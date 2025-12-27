import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkEmailTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Checking email_notifications table...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "email_notifications"');
    
    if (tables.length === 0) {
      console.log('❌ email_notifications table does not exist');
      console.log('Creating email_notifications table...');
      
      await connection.execute(`
        CREATE TABLE email_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          recipient_email VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          message TEXT NOT NULL,
          type ENUM('general', 'quote_response', 'acceptance', 'rejection', 'status_update', 'user_acceptance') DEFAULT 'general',
          quote_id INT NULL,
          status ENUM('sent', 'failed') DEFAULT 'sent',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_recipient (recipient_email),
          INDEX idx_type (type),
          INDEX idx_status (status),
          INDEX idx_created (created_at)
        )
      `);
      
      console.log('✅ email_notifications table created successfully');
    } else {
      console.log('✅ email_notifications table exists');
      
      // Check table structure
      const [columns] = await connection.execute('DESCRIBE email_notifications');
      console.log('Table columns:', columns.map(col => col.Field).join(', '));
      
      // Check if there are any records
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM email_notifications');
      console.log(`📊 Total email records: ${count[0].total}`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEmailTable();