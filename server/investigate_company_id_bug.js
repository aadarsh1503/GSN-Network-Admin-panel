// Investigate why wrong company IDs are being used
import db from './config/db.js';

async function investigateCompanyIdBug() {
  try {
    console.log('Investigating the company ID bug...\n');
    
    // Check the most recent accepted quote and trace what should happen
    const [recentAcceptance] = await db.execute(`
      SELECT 
        uqs.quote_id,
        uqs.user_id as accepting_user_id,
        uqs.company_id as stored_company_id,
        uqs.quote_response_id,
        qr.company_id as actual_response_company_id,
        u1.name as accepting_user_name,
        u2.name as stored_company_name,
        u3.name as actual_company_name
      FROM user_quote_status uqs
      JOIN quote_responses qr ON uqs.quote_response_id = qr.id
      JOIN users u1 ON uqs.user_id = u1.id
      JOIN users u2 ON uqs.company_id = u2.id
      JOIN users u3 ON qr.company_id = u3.id
      WHERE uqs.status = 'accepted'
      ORDER BY uqs.accepted_at DESC
      LIMIT 1
    `);
    
    if (recentAcceptance.length > 0) {
      const acceptance = recentAcceptance[0];
      console.log('Most recent quote acceptance details:');
      console.table([acceptance]);
      
      console.log('\n📊 ANALYSIS:');
      console.log(`Quote #${acceptance.quote_id} was accepted by: ${acceptance.accepting_user_name}`);
      console.log(`Stored company ID in user_quote_status: ${acceptance.stored_company_id} (${acceptance.stored_company_name})`);
      console.log(`Actual company ID from quote_responses: ${acceptance.actual_response_company_id} (${acceptance.actual_company_name})`);
      
      if (acceptance.stored_company_id !== acceptance.actual_response_company_id) {
        console.log('\n❌ MISMATCH: The stored company ID does not match the actual response company ID!');
        console.log('This means the wrong company ID was passed during quote acceptance.');
      } else {
        console.log('\n✅ Company IDs match - the issue is elsewhere');
      }
    }
    
    // Now let's check if there are multiple notification calls happening
    console.log('\n--- Checking for potential duplicate notification calls ---');
    
    // The issue might be that the notification function is called multiple times
    // Let's see if we can find evidence of this in the database
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

investigateCompanyIdBug();