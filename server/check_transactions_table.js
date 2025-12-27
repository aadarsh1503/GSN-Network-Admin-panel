// Check transactions table structure
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function checkTransactionsTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check transactions table structure
    console.log('\n📋 Transactions table structure:');
    const [structure] = await connection.execute('DESCRIBE transactions');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Check if there are any existing transactions
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM transactions');
    console.log(`\n📊 Current transactions: ${count[0].total}`);

    if (count[0].total > 0) {
      const [sample] = await connection.execute('SELECT * FROM transactions LIMIT 1');
      console.log('\n📄 Sample transaction:');
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTransactionsTable();