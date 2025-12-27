import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserRoles() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Checking user roles and counts...');
    
    // Check distinct roles
    const [roles] = await connection.execute('SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('User roles in database:');
    roles.forEach(role => {
      console.log(`- ${role.role}: ${role.count} users`);
    });
    
    // Check status distribution
    const [statusData] = await connection.execute('SELECT role, status, COUNT(*) as count FROM users GROUP BY role, status ORDER BY role, status');
    console.log('\nUser status distribution:');
    statusData.forEach(item => {
      console.log(`- ${item.role} (status ${item.status}): ${item.count} users`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserRoles();