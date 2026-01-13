// Debug script to investigate business quote status issue
// When payment is verified, business panel shows "pending" instead of "approved"

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function debugQuoteStatusIssue() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Connected to database');

    // 1. Find quotes with payment verifications
    console.log('\n=== STEP 1: Finding quotes with payment verifications ===');
    const [quotesWithPayments] = await connection.execute(`
      SELECT DISTINCT 
        q.id as quote_id,
        q.status as quote_status,
        q.user_id,
        u.name as user_name,
        u.role as user_role
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      JOIN payment_verifications pv ON q.id = pv.quote_id
      WHERE pv.verification_status = 'verified'
      ORDER BY q.id DESC
      LIMIT 10
    `);

    console.log(`Found ${quotesWithPayments.length} quotes with verified payments:`);
    quotesWithPayments.forEach(quote => {
      console.log(`  Quote #${quote.quote_id}: Status="${quote.quote_status}", User="${quote.user_name}" (${quote.user_role})`);
    });

    if (quotesWithPayments.length === 0) {
      console.log('❌ No quotes with verified payments found. Creating test scenario...');
      return;
    }

    // 2. Check payment verification details for these quotes
    console.log('\n=== STEP 2: Payment verification details ===');
    for (const quote of quotesWithPayments.slice(0, 3)) {
      const [paymentDetails] = await connection.execute(`
        SELECT 
          pv.id as verification_id,
          pv.verification_status,
          pv.verification_date,
          pv.company_notes,
          qr.id as quote_response_id,
          qr.price,
          c.name as company_name
        FROM payment_verifications pv
        JOIN quote_responses qr ON pv.quote_response_id = qr.id
        JOIN users c ON pv.company_id = c.id
        WHERE pv.quote_id = ?
        ORDER BY pv.verification_date DESC
      `, [quote.quote_id]);

      console.log(`\n  Quote #${quote.quote_id} payment details:`);
      paymentDetails.forEach(payment => {
        console.log(`    - Verification ID: ${payment.verification_id}`);
        console.log(`    - Status: ${payment.verification_status}`);
        console.log(`    - Date: ${payment.verification_date}`);
        console.log(`    - Company: ${payment.company_name}`);
        console.log(`    - Price: $${payment.price}`);
      });
    }

    // 3. Check user_quote_status table for acceptance status
    console.log('\n=== STEP 3: User quote status (acceptance) ===');
    for (const quote of quotesWithPayments.slice(0, 3)) {
      const [userStatus] = await connection.execute(`
        SELECT 
          uqs.status as user_response_status,
          uqs.accepted_at,
          uqs.payment_verification_status,
          qr.id as quote_response_id,
          c.name as company_name
        FROM user_quote_status uqs
        JOIN quote_responses qr ON uqs.quote_response_id = qr.id
        JOIN users c ON qr.company_id = c.id
        WHERE uqs.quote_id = ?
        ORDER BY uqs.accepted_at DESC
      `, [quote.quote_id]);

      console.log(`\n  Quote #${quote.quote_id} user acceptance status:`);
      if (userStatus.length === 0) {
        console.log(`    ❌ No user acceptance records found`);
      } else {
        userStatus.forEach(status => {
          console.log(`    - Response ID: ${status.quote_response_id}`);
          console.log(`    - Company: ${status.company_name}`);
          console.log(`    - User Status: ${status.user_response_status}`);
          console.log(`    - Accepted At: ${status.accepted_at}`);
          console.log(`    - Payment Verification Status: ${status.payment_verification_status}`);
        });
      }
    }

    // 4. Test the business quotes API query
    console.log('\n=== STEP 4: Testing business quotes API query ===');
    const testUserId = quotesWithPayments[0].user_id;
    const [businessQuotes] = await connection.execute(`
      SELECT q.*, 
             COUNT(qr.id) as response_count,
             MIN(qr.price) as lowest_price,
             MAX(qr.price) as highest_price
      FROM quotes q 
      LEFT JOIN quote_responses qr ON q.id = qr.quote_id 
      WHERE q.user_id = ? 
      GROUP BY q.id 
      ORDER BY q.created_at DESC
      LIMIT 5
    `, [testUserId]);

    console.log(`\nBusiness quotes for user ${testUserId}:`);
    businessQuotes.forEach(quote => {
      console.log(`  Quote #${quote.id}: Status="${quote.status}", Responses=${quote.response_count}`);
    });

    // 5. Check if there's a timing issue - look at recent payment verifications
    console.log('\n=== STEP 5: Recent payment verifications ===');
    const [recentVerifications] = await connection.execute(`
      SELECT 
        pv.id,
        pv.quote_id,
        pv.verification_status,
        pv.verification_date,
        q.status as current_quote_status,
        u.name as user_name
      FROM payment_verifications pv
      JOIN quotes q ON pv.quote_id = q.id
      JOIN users u ON q.user_id = u.id
      WHERE pv.verification_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY pv.verification_date DESC
      LIMIT 10
    `);

    console.log(`\nRecent payment verifications (last 24 hours):`);
    if (recentVerifications.length === 0) {
      console.log('  No recent verifications found');
    } else {
      recentVerifications.forEach(verification => {
        console.log(`  Verification #${verification.id}:`);
        console.log(`    Quote #${verification.quote_id} - Status: ${verification.current_quote_status}`);
        console.log(`    Verification: ${verification.verification_status}`);
        console.log(`    Date: ${verification.verification_date}`);
        console.log(`    User: ${verification.user_name}`);
        
        // Check if there's a mismatch
        if (verification.verification_status === 'verified' && verification.current_quote_status !== 'approved') {
          console.log(`    ⚠️  MISMATCH: Payment verified but quote status is "${verification.current_quote_status}"`);
        }
      });
    }

    // 6. Check for any database triggers or constraints that might affect status updates
    console.log('\n=== STEP 6: Database constraints and triggers ===');
    const [triggers] = await connection.execute(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ?
      AND EVENT_OBJECT_TABLE IN ('quotes', 'payment_verifications', 'user_quote_status')
    `, [process.env.DB_NAME]);

    if (triggers.length > 0) {
      console.log('Found database triggers:');
      triggers.forEach(trigger => {
        console.log(`  ${trigger.TRIGGER_NAME} on ${trigger.EVENT_OBJECT_TABLE} (${trigger.EVENT_MANIPULATION})`);
      });
    } else {
      console.log('No relevant database triggers found');
    }

    console.log('\n=== ANALYSIS COMPLETE ===');
    console.log('Check the output above for any mismatches between payment verification status and quote status.');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the debug
debugQuoteStatusIssue();