// Check for company ID mismatches in accepted quotes
import db from './config/db.js';

async function checkQuoteCompanyMismatch() {
  try {
    console.log('Checking quote responses for the accepted quotes...');
    
    // Get the accepted quotes and their company IDs
    const [acceptedQuotes] = await db.execute(`
      SELECT 
        uqs.quote_id,
        uqs.quote_response_id,
        uqs.company_id as accepted_company_id,
        qr.company_id as response_company_id,
        qr.price,
        u.name as company_name,
        u.email as company_email
      FROM user_quote_status uqs
      JOIN quote_responses qr ON uqs.quote_response_id = qr.id
      JOIN users u ON qr.company_id = u.id
      WHERE uqs.status = 'accepted'
      ORDER BY uqs.accepted_at DESC
      LIMIT 10
    `);
    
    console.log('Accepted quotes and their company details:');
    console.table(acceptedQuotes);
    
    // Check if there are mismatches
    const mismatches = acceptedQuotes.filter(q => q.accepted_company_id !== q.response_company_id);
    if (mismatches.length > 0) {
      console.log('\n❌ FOUND MISMATCHES:');
      console.table(mismatches);
      
      console.log('\nThis means notifications are being sent to the wrong companies!');
      console.log('The accepted_company_id should match response_company_id');
    } else {
      console.log('\n✅ No mismatches found - company IDs are correct');
    }
    
    // Also check which company is receiving the notifications
    console.log('\n--- Checking notification recipients ---');
    const [notificationRecipients] = await db.execute(`
      SELECT 
        un.user_id,
        u.name as recipient_name,
        u.email as recipient_email,
        COUNT(*) as notification_count
      FROM user_notifications un
      JOIN users u ON un.user_id = u.id
      JOIN notifications n ON un.notification_id = n.id
      WHERE n.title = 'Quote Accepted!'
      GROUP BY un.user_id, u.name, u.email
      ORDER BY notification_count DESC
    `);
    
    console.log('Users receiving quote acceptance notifications:');
    console.table(notificationRecipients);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkQuoteCompanyMismatch();