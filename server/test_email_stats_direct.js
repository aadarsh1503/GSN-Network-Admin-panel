import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailStats() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Testing email statistics queries...');
    
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
    
    console.log('Running stats query...');
    const [stats] = await connection.execute(statsQuery);
    console.log('✅ Stats query successful:', stats);
    
    // Test the user counts query
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
        UNION ALL
        SELECT 
            'subscribers' as type, COUNT(DISTINCT u.id) as count 
            FROM users u 
            JOIN user_subscriptions us ON u.id = us.user_id 
            WHERE us.status = 'active' AND u.status = 1
    `;
    
    console.log('Running user counts query...');
    const [userCounts] = await connection.execute(userCountsQuery);
    console.log('✅ User counts query successful:', userCounts);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmailStats();