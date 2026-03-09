import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './.env' });

async function showAllTables() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database successfully\n');

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log('📋 All Tables in Database:');
    console.log('=' .repeat(50));
    
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log('=' .repeat(50));
    console.log(`\nTotal Tables: ${tables.length}\n`);

    // Get row counts for each table
    console.log('📊 Row Counts:');
    console.log('=' .repeat(50));
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const count = countResult[0].count;
      console.log(`${tableName}: ${count} rows`);
    }
    
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

showAllTables();
