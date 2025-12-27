import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testUserCounts() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Testing user count queries...');
    
    // Test the exact query from email controller
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
            LEFT JOIN user_subscriptions us ON u.id = us.user_id 
            WHERE us.status = 'active' AND u.status = 1
    `;
    
    const [userCounts] = await connection.execute(userCountsQuery);
    console.log('User counts result:');
    userCounts.forEach(item => {
      console.log(`- ${item.type}: ${item.count}`);
    });
    
    // Convert to object format like in controller
    const userCountsObj = userCounts.reduce((acc, curr) => {
      acc[curr.type] = curr.count;
      return acc;
    }, {});
    
    console.log('\nFormatted user counts object:');
    console.log(userCountsObj);
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUserCounts();