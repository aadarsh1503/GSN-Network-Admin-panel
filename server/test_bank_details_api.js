import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testBankDetailsAPI() {
  try {
    console.log('Testing bank details database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Test if table exists and has data
    const [rows] = await connection.execute(
      'SELECT * FROM bank_details WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );
    
    console.log('Active bank details found:', rows.length);
    if (rows.length > 0) {
      console.log('Bank details:', {
        id: rows[0].id,
        bank_name: rows[0].bank_name,
        branch_name: rows[0].branch_name,
        ifsc_code: rows[0].ifsc_code,
        account_holder_name: rows[0].account_holder_name,
        is_active: rows[0].is_active
      });
    }
    
    await connection.end();
    console.log('✅ Bank details API test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBankDetailsAPI();