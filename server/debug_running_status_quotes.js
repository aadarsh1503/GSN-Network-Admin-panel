// Debug script to investigate why some quotes have "running" status instead of "approved"

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

async function debugRunningStatusQuotes() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Connected to database');

    // Find quotes with "running" status that have verified payments
    console.log('\n=== QUOTES WITH RUNNING STATUS AND VERIFIED PAYMENTS ===');
    const [runningQuotes] = await connection.execute(`
      SELECT DISTINCT 
        q.id as quote_id,
        q.status as quote_status,
        q.updated_at as quote_updated_at,
        q.user_id,
        u.name as user_name,
        u.role as user_role,
        pv.verification_status,
        pv.verification_date,
        c.name as company_name
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      JOIN payment_verifications pv ON q.id = pv.quote_id
      JOIN users c ON pv.company_id = c.id
      WHERE q.status = 'running' 
      AND pv.verification_status = 'verified'
      ORDER BY q.updated_at DESC
    `);

    console.log(`Found ${runningQuotes.length} quotes with "running" status and verified payments:`);
    runningQuotes.forEach(quote => {
      console.log(`  Quote #${quote.quote_id}:`);
      console.log(`    - Status: ${quote.quote_status}`);
      console.log(`    - Updated: ${quote.quote_updated_at}`);
      console.log(`    - User: ${quote.user_name} (${quote.user_role})`);
      console.log(`    - Company: ${quote.company_name}`);
      console.log(`    - Payment Verified: ${quote.verification_date}`);
      
      // Check if quote was updated after payment verification
      const quoteUpdated = new Date(quote.quote_updated_at);
      const paymentVerified = new Date(quote.verification_date);
      
      if (quoteUpdated > paymentVerified) {
        console.log(`    ⚠️  Quote was updated AFTER payment verification!`);
        console.log(`       Payment verified: ${paymentVerified}`);
        console.log(`       Quote updated: ${quoteUpdated}`);
      } else {
        console.log(`    ✅ Quote updated before or at payment verification`);
      }
      console.log('');
    });

    // Check if there are any recent status changes in the database logs or audit trail
    console.log('\n=== CHECKING FOR RECENT QUOTE STATUS CHANGES ===');
    
    // Look for patterns in the updated_at timestamps
    const [recentUpdates] = await connection.execute(`
      SELECT 
        id,
        status,
        updated_at,
        created_at,
        user_id
      FROM quotes 
      WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND status IN ('running', 'approved')
      ORDER BY updated_at DESC
      LIMIT 20
    `);

    console.log('Recent quote status updates (last 24 hours):');
    recentUpdates.forEach(quote => {
      console.log(`  Quote #${quote.id}: ${quote.status} (updated: ${quote.updated_at})`);
    });

    // Check if there's a pattern with user acceptance
    console.log('\n=== CHECKING USER ACCEPTANCE STATUS FOR RUNNING QUOTES ===');
    
    for (const quote of runningQuotes.slice(0, 3)) {
      const [userStatus] = await connection.execute(`
        SELECT 
          uqs.status as user_response_status,
          uqs.accepted_at,
          uqs.created_at as status_created_at,
          qr.id as quote_response_id,
          c.name as company_name
        FROM user_quote_status uqs
        JOIN quote_responses qr ON uqs.quote_response_id = qr.id
        JOIN users c ON qr.company_id = c.id
        WHERE uqs.quote_id = ?
        ORDER BY uqs.created_at DESC
      `, [quote.quote_id]);

      console.log(`\nQuote #${quote.quote_id} user acceptance history:`);
      if (userStatus.length === 0) {
        console.log('  No user acceptance records found');
      } else {
        userStatus.forEach(status => {
          console.log(`  - Response ID: ${status.quote_response_id}`);
          console.log(`    Company: ${status.company_name}`);
          console.log(`    User Status: ${status.user_response_status}`);
          console.log(`    Accepted At: ${status.accepted_at}`);
          console.log(`    Status Created: ${status.status_created_at}`);
        });
      }
    }

    // Check if there are any automated processes or cron jobs
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. Check if there are any automated processes that change quote status to "running"');
    console.log('2. Check if admin panel or company panel has functionality to change status to "running"');
    console.log('3. Verify the payment verification endpoint is correctly updating status to "approved"');
    console.log('4. Check if there are any race conditions between different status updates');

    // Test the payment verification endpoint behavior
    console.log('\n=== TESTING PAYMENT VERIFICATION LOGIC ===');
    console.log('The payment verification endpoint should:');
    console.log('1. Update payment_verifications.verification_status = "verified"');
    console.log('2. Update user_quote_status.payment_verification_status = "verified"');
    console.log('3. Update quotes.status = "approved"');
    console.log('');
    console.log('If quotes have "running" status instead of "approved", it means:');
    console.log('- Either the payment verification endpoint is not working correctly');
    console.log('- Or something else is changing the status after payment verification');

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
debugRunningStatusQuotes();