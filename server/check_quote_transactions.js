// Check for quote-related transactions and payment flow
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function checkQuoteTransactions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check all tables that might contain quote payment data
    console.log('\n📋 Checking quote-related tables...');
    
    // Check quote_responses table
    console.log('\n🔍 Quote Responses:');
    const [responses] = await connection.execute(`
      SELECT qr.*, q.user_id, q.product_description, u.name as user_name, u.email as user_email,
             c.name as company_name, c.email as company_email
      FROM quote_responses qr
      JOIN quotes q ON qr.quote_id = q.id
      JOIN users u ON q.user_id = u.id
      JOIN users c ON qr.company_id = c.id
      LIMIT 5
    `);
    
    console.log(`Found ${responses.length} quote responses`);
    if (responses.length > 0) {
      console.log('Sample response:', JSON.stringify(responses[0], null, 2));
    }

    // Check user_quote_status table for accepted quotes
    console.log('\n✅ User Quote Status (Accepted):');
    const [acceptedQuotes] = await connection.execute(`
      SELECT uqs.*, qr.price, qr.transit_time, qr.company_id,
             q.user_id, q.product_description, 
             u.name as user_name, u.email as user_email,
             c.name as company_name, c.email as company_email
      FROM user_quote_status uqs
      JOIN quote_responses qr ON uqs.response_id = qr.id
      JOIN quotes q ON qr.quote_id = q.id
      JOIN users u ON q.user_id = u.id
      JOIN users c ON qr.company_id = c.id
      WHERE uqs.status = 'accepted'
      LIMIT 5
    `);
    
    console.log(`Found ${acceptedQuotes.length} accepted quotes`);
    if (acceptedQuotes.length > 0) {
      console.log('Sample accepted quote:', JSON.stringify(acceptedQuotes[0], null, 2));
    }

    // Check if there's a separate payment/transaction table for quotes
    console.log('\n💳 Current Transactions:');
    const [transactions] = await connection.execute(`
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
    `);
    
    console.log(`Found ${transactions.length} transactions`);
    transactions.forEach(txn => {
      console.log(`- ID: ${txn.id}, User: ${txn.user_name}, Amount: $${txn.amount}, Type: ${txn.subscription_id ? 'Subscription' : 'Other'}, Status: ${txn.status}`);
    });

    // Check table structures for payment tracking
    console.log('\n📊 Table Structures:');
    
    const tables = ['quote_responses', 'user_quote_status', 'transactions'];
    for (const table of tables) {
      try {
        const [structure] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`\n${table}:`);
        structure.forEach(col => {
          console.log(`  ${col.Field}: ${col.Type}`);
        });
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkQuoteTransactions();