// Check user_quote_status table structure
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function checkUserQuoteStatus() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check user_quote_status structure
    console.log('\n📋 user_quote_status structure:');
    const [structure] = await connection.execute('DESCRIBE user_quote_status');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Check data in user_quote_status
    console.log('\n📊 user_quote_status data:');
    const [data] = await connection.execute('SELECT * FROM user_quote_status LIMIT 5');
    console.log(`Found ${data.length} records`);
    if (data.length > 0) {
      data.forEach(record => {
        console.log(JSON.stringify(record, null, 2));
      });
    }

    // Check quote_responses with accepted status
    console.log('\n✅ Quote responses with accepted status:');
    const [acceptedResponses] = await connection.execute(`
      SELECT qr.id, qr.quote_id, qr.company_id, qr.price, qr.status,
             q.user_id, q.product_description,
             u.name as user_name, u.email as user_email,
             c.name as company_name, c.email as company_email
      FROM quote_responses qr
      JOIN quotes q ON qr.quote_id = q.id
      JOIN users u ON q.user_id = u.id
      JOIN users c ON qr.company_id = c.id
      WHERE qr.status = 'accepted'
    `);
    
    console.log(`Found ${acceptedResponses.length} accepted quote responses`);
    if (acceptedResponses.length > 0) {
      acceptedResponses.forEach(response => {
        console.log(`- Quote ${response.quote_id}: ${response.user_name} accepted ${response.company_name}'s offer of $${response.price}`);
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

checkUserQuoteStatus();