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

async function checkPaymentVerificationsColumns() {
  let connection;
  
  try {
    console.log('🔍 Checking payment_verifications table columns...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE payment_verifications');
    
    console.log('📋 payment_verifications table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Also check a sample payment verification
    const [payments] = await connection.execute('SELECT * FROM payment_verifications LIMIT 3');
    if (payments.length > 0) {
      console.log('\n📋 Sample payment verification data:');
      payments.forEach((payment, idx) => {
        console.log(`Payment ${idx + 1}:`, payment);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkPaymentVerificationsColumns();