// Set admin password for testing
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function setAdminPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Hash the new password
    const newPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`🔐 Setting admin password to: ${newPassword}`);
    console.log(`🔒 Hashed password: ${hashedPassword}`);

    // Update admin password
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = "admin@gmail.com" AND role = "admin"',
      [hashedPassword]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('\nYou can now login with:');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
    } else {
      console.log('❌ No admin user found to update');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setAdminPassword();