// Create test transaction data
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function createTestTransactions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get some users and subscriptions for test data
    const [users] = await connection.execute('SELECT id, name, email FROM users LIMIT 3');
    const [subscriptions] = await connection.execute('SELECT id, user_id, plan_id, amount_paid FROM user_subscriptions LIMIT 3');
    
    console.log('👥 Available users:', users.length);
    console.log('📋 Available subscriptions:', subscriptions.length);

    if (users.length === 0 || subscriptions.length === 0) {
      console.log('❌ Need users and subscriptions to create test transactions');
      return;
    }

    // Create test transactions
    const testTransactions = [
      {
        user_id: subscriptions[0].user_id,
        subscription_id: subscriptions[0].id,
        amount: subscriptions[0].amount_paid,
        status: 'completed',
        payment_method: 'credit_card',
        transaction_reference: 'TXN_' + Date.now() + '_001',
        description: 'Subscription payment for premium plan'
      },
      {
        user_id: subscriptions[1]?.user_id || subscriptions[0].user_id,
        subscription_id: subscriptions[1]?.id || subscriptions[0].id,
        amount: subscriptions[1]?.amount_paid || subscriptions[0].amount_paid,
        status: 'pending',
        payment_method: 'paypal',
        transaction_reference: 'TXN_' + Date.now() + '_002',
        description: 'Subscription renewal payment'
      },
      {
        user_id: users[0].id,
        subscription_id: null, // One-time payment without subscription
        amount: '29.99',
        status: 'completed',
        payment_method: 'bank_transfer',
        transaction_reference: 'TXN_' + Date.now() + '_003',
        description: 'One-time service fee'
      }
    ];

    console.log('\n💳 Creating test transactions...');
    
    for (const txn of testTransactions) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO transactions (user_id, subscription_id, amount, status, payment_method, transaction_reference, description, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [txn.user_id, txn.subscription_id, txn.amount, txn.status, txn.payment_method, txn.transaction_reference, txn.description]
        );
        
        console.log(`✅ Created transaction ${txn.transaction_reference} - $${txn.amount} (${txn.status})`);
      } catch (error) {
        console.log(`❌ Error creating transaction: ${error.message}`);
      }
    }

    // Check final count
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM transactions');
    console.log(`\n📊 Total transactions in database: ${count[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestTransactions();