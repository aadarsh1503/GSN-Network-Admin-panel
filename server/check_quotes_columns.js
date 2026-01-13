import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

async function checkQuotesColumns() {
  let connection;
  
  try {
    console.log('🔍 Checking quotes table columns...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE quotes');
    
    console.log('📋 Quotes table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Also check a sample quote
    const [quotes] = await connection.execute('SELECT * FROM quotes LIMIT 1');
    if (quotes.length > 0) {
      console.log('\n📋 Sample quote data:');
      console.log(quotes[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkQuotesColumns();