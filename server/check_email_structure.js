import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [columns] = await connection.execute('DESCRIBE email_notifications');
    console.log('Email table structure:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
    });
    
    // Check existing data
    const [data] = await connection.execute('SELECT * FROM email_notifications LIMIT 1');
    if (data.length > 0) {
      console.log('\nSample record:');
      console.log(data[0]);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();