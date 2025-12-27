// Check admin user details
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function checkAdminUser() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get admin user details
    const [adminUsers] = await connection.execute(
      'SELECT id, name, email, password, role, created_at FROM users WHERE role = "admin"'
    );
    
    console.log('\n👤 Admin Users:');
    adminUsers.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.created_at}`);
      console.log('---');
    });

    // Let's create a simple admin password if needed
    console.log('\n🔧 Would you like me to create a simple admin password?');
    console.log('I can update the admin password to "admin123" for testing');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAdminUser();