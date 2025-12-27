import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugEmailStats() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('🔍 Debugging email stats queries...\n');
    
    // Test 1: Check if email_notifications table exists
    console.log('1. Checking email_notifications table...');
    try {
      const [emailTable] = await connection.execute('SHOW TABLES LIKE "email_notifications"');
      if (emailTable.length > 0) {
        console.log('✅ email_notifications table exists');
        
        // Test the stats query
        const statsQuery = `
            SELECT 
                type,
                status,
                COUNT(*) as count,
                DATE(sent_at) as date
            FROM email_notifications 
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY type, status, DATE(sent_at)
            ORDER BY sent_at DESC
        `;
        
        const [stats] = await connection.execute(statsQuery);
        console.log('✅ Stats query successful:', stats.length, 'records');
      } else {
        console.log('❌ email_notifications table does not exist');
      }
    } catch (error) {
      console.log('❌ Stats query failed:', error.message);
    }
    
    // Test 2: Check user counts queries one by one
    console.log('\n2. Testing user count queries...');
    
    // Test basic user counts
    try {
      const [allUsers] = await connection.execute(`SELECT COUNT(*) as count FROM users WHERE role != 'admin' AND status = 1`);
      console.log('✅ All users:', allUsers[0].count);
      
      const [regularUsers] = await connection.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 1`);
      console.log('✅ Regular users:', regularUsers[0].count);
      
      const [companies] = await connection.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'company' AND status = 1`);
      console.log('✅ Companies:', companies[0].count);
      
      const [business] = await connection.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'business' AND status = 1`);
      console.log('✅ Business owners:', business[0].count);
      
    } catch (error) {
      console.log('❌ Basic user counts failed:', error.message);
    }
    
    // Test 3: Check user_subscriptions table
    console.log('\n3. Checking user_subscriptions table...');
    try {
      const [subTable] = await connection.execute('SHOW TABLES LIKE "user_subscriptions"');
      if (subTable.length > 0) {
        console.log('✅ user_subscriptions table exists');
        
        const [subCount] = await connection.execute(`
          SELECT COUNT(DISTINCT u.id) as count 
          FROM users u 
          JOIN user_subscriptions us ON u.id = us.user_id 
          WHERE us.status = 'active' AND u.status = 1
        `);
        console.log('✅ Active subscribers:', subCount[0].count);
      } else {
        console.log('❌ user_subscriptions table does not exist');
        console.log('   Using 0 for subscribers count');
      }
    } catch (error) {
      console.log('❌ Subscribers query failed:', error.message);
    }
    
    // Test 4: Try the full UNION query
    console.log('\n4. Testing full UNION query...');
    try {
      const userCountsQuery = `
          SELECT 
              'all' as type, COUNT(*) as count FROM users WHERE role != 'admin' AND status = 1
          UNION ALL
          SELECT 
              'users' as type, COUNT(*) as count FROM users WHERE role = 'user' AND status = 1
          UNION ALL
          SELECT 
              'companies' as type, COUNT(*) as count FROM users WHERE role = 'company' AND status = 1
          UNION ALL
          SELECT 
              'business_owners' as type, COUNT(*) as count FROM users WHERE role = 'business' AND status = 1
      `;
      
      const [userCounts] = await connection.execute(userCountsQuery);
      console.log('✅ UNION query (without subscribers) successful:');
      userCounts.forEach(item => {
        console.log(`   - ${item.type}: ${item.count}`);
      });
      
    } catch (error) {
      console.log('❌ UNION query failed:', error.message);
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugEmailStats();