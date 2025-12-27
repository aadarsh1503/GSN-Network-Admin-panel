// Check subscription-related tables
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function checkTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Show all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 All tables in database:');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });

    // Look for subscription-related tables
    const subscriptionTables = tables.filter(table => 
      Object.values(table)[0].toLowerCase().includes('subscription') ||
      Object.values(table)[0].toLowerCase().includes('plan') ||
      Object.values(table)[0].toLowerCase().includes('payment')
    );

    console.log('\n💳 Subscription-related tables:');
    if (subscriptionTables.length > 0) {
      for (const table of subscriptionTables) {
        const tableName = Object.values(table)[0];
        console.log(`\n📊 ${tableName}:`);
        
        try {
          const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  Records: ${rows[0].count}`);
          
          // Show structure
          const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
          console.log('  Columns:', structure.map(col => col.Field).join(', '));
          
          // Show sample data if exists
          if (rows[0].count > 0) {
            const [sample] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 1`);
            console.log('  Sample:', JSON.stringify(sample[0], null, 2));
          }
        } catch (error) {
          console.log(`  Error: ${error.message}`);
        }
      }
    } else {
      console.log('No subscription-related tables found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();