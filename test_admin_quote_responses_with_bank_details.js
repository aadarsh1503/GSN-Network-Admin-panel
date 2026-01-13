// Test the admin enhanced quotes API to check if IBAN and SWIFT code are returned
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testAdminQuoteResponsesWithBankDetails() {
  try {
    console.log('🔐 Step 1: Admin Login...');
    
    // Login as admin
    const loginResponse = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Admin login successful');
    
    console.log('\n📋 Step 2: Get quote responses with bank details for quote 70...');
    
    // Test with quote ID 70 as mentioned in the issue
    const testQuoteId = 70;
    
    // Get quote responses with bank details using admin endpoint
    const responsesResponse = await fetch(`${API_BASE}/api/enhanced-quotes/admin/${testQuoteId}/responses-with-bank-details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responses = await responsesResponse.json();
    
    if (!responsesResponse.ok) {
      console.error('❌ Failed to get responses:', responses);
      return;
    }
    
    console.log(`✅ Found ${Array.isArray(responses) ? responses.length : 0} responses for quote ${testQuoteId}`);
    
    if (Array.isArray(responses) && responses.length > 0) {
      responses.forEach((response, index) => {
        console.log(`\n📋 Response ${index + 1}:`);
        console.log(`  - Company: ${response.company_name}`);
        console.log(`  - Price: $${response.price}`);
        console.log(`  - Bank Name: ${response.bank_name || 'Not set'}`);
        console.log(`  - Account Number: ${response.account_number || 'Not set'}`);
        console.log(`  - Account Holder: ${response.account_holder_name || 'Not set'}`);
        console.log(`  - IBAN Number: ${response.iban_number || 'Not set'} ${response.iban_number ? '✅' : '❌'}`);
        console.log(`  - SWIFT Code: ${response.swift_code || 'Not set'} ${response.swift_code ? '✅' : '❌'}`);
        console.log(`  - Branch Name: ${response.branch_name || 'Not set'}`);
        console.log(`  - Payment Instructions: ${response.bank_instructions || 'Not set'}`);
      });
      
      const responsesWithBankDetails = responses.filter(r => r.bank_name || r.account_number);
      const responsesWithIBAN = responses.filter(r => r.iban_number);
      const responsesWithSWIFT = responses.filter(r => r.swift_code);
      
      console.log(`\n📊 Summary:`);
      console.log(`  - Total responses: ${responses.length}`);
      console.log(`  - With bank details: ${responsesWithBankDetails.length}`);
      console.log(`  - With IBAN: ${responsesWithIBAN.length} ${responsesWithIBAN.length > 0 ? '✅' : '❌'}`);
      console.log(`  - With SWIFT: ${responsesWithSWIFT.length} ${responsesWithSWIFT.length > 0 ? '✅' : '❌'}`);
      
      if (responsesWithIBAN.length > 0 && responsesWithSWIFT.length > 0) {
        console.log('\n🎉 SUCCESS: IBAN and SWIFT codes are now being returned!');
        console.log('The frontend should now display complete bank details including IBAN and SWIFT code.');
      } else if (responsesWithBankDetails.length > 0) {
        console.log('\n⚠️ PARTIAL: Bank details exist but IBAN/SWIFT may not be set in the database');
        console.log('Companies need to update their bank details to include IBAN and SWIFT codes.');
      } else {
        console.log('\n❌ No bank details found for any responses');
      }
    } else {
      console.log('❌ No responses found for this quote');
      
      // Let's try to find any quote with responses
      console.log('\n🔍 Searching for quotes with responses...');
      
      try {
        const allQuotesResponse = await fetch(`${API_BASE}/api/enhanced-quotes/admin/comprehensive`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const allQuotes = await allQuotesResponse.json();
        
        if (Array.isArray(allQuotes) && allQuotes.length > 0) {
          const quotesWithResponses = allQuotes.filter(q => q.response_count > 0);
          console.log(`Found ${quotesWithResponses.length} quotes with responses:`);
          
          quotesWithResponses.slice(0, 5).forEach(quote => {
            console.log(`  - Quote ${quote.id}: ${quote.response_count} responses`);
          });
          
          if (quotesWithResponses.length > 0) {
            const testQuote = quotesWithResponses[0];
            console.log(`\n🎯 Testing with quote ${testQuote.id} instead...`);
            
            const testResponse = await fetch(`${API_BASE}/api/enhanced-quotes/admin/${testQuote.id}/responses-with-bank-details`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            const testResponses = await testResponse.json();
            console.log(`Found ${Array.isArray(testResponses) ? testResponses.length : 0} responses for quote ${testQuote.id}`);
            
            if (Array.isArray(testResponses) && testResponses.length > 0) {
              const firstResponse = testResponses[0];
              console.log('\n📋 Sample response:');
              console.log(`  - IBAN: ${firstResponse.iban_number || 'Not set'} ${firstResponse.iban_number ? '✅' : '❌'}`);
              console.log(`  - SWIFT: ${firstResponse.swift_code || 'Not set'} ${firstResponse.swift_code ? '✅' : '❌'}`);
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch comprehensive quotes');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAdminQuoteResponsesWithBankDetails();