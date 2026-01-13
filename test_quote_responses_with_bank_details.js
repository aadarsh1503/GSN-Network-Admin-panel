// Test the enhanced quotes API to check if IBAN and SWIFT code are returned
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testQuoteResponsesWithBankDetails() {
  try {
    console.log('🔐 Step 1: Business User Login...');
    
    // Login as a business user (using one from the company users we found)
    const loginResponse = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'aadarshchauhan35@gmail.com', // Company user from our check
        password: 'admin123' // Assuming same password pattern
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.message);
      console.log('💡 Trying different password...');
      
      // Try with a different password
      const loginResponse2 = await fetch(`${API_BASE}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'aadarshchauhan35@gmail.com',
          password: '123456'
        })
      });
      
      const loginData2 = await loginResponse2.json();
      
      if (!loginResponse2.ok) {
        console.error('❌ Login failed with both passwords');
        console.log('Available company users to test with:');
        console.log('- aadarshchauhan35@gmail.com');
        console.log('- niranjayakumar25@gmail.com');
        console.log('- spd@gmail.com');
        console.log('- aar@gmail.com');
        console.log('- sparsh@gmail.com');
        return;
      }
      
      loginData.token = loginData2.token;
      loginData.user = loginData2.user;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful as:', loginData.user?.email);
    
    console.log('\n📋 Step 2: Get business quotes...');
    
    // Get business quotes to find one with responses
    const quotesResponse = await fetch(`${API_BASE}/api/business-quotes/my-quotes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const quotes = await quotesResponse.json();
    console.log(`Found ${Array.isArray(quotes) ? quotes.length : 0} quotes`);
    
    if (!Array.isArray(quotes) || quotes.length === 0) {
      console.log('❌ No quotes found for this user');
      return;
    }
    
    // Use quote ID 70 as mentioned in the issue, or the first available quote
    const testQuoteId = quotes.find(q => q.id === 70)?.id || quotes[0]?.id;
    console.log(`🎯 Testing with quote ID: ${testQuoteId}`);
    
    console.log('\n📋 Step 3: Get quote responses with bank details...');
    
    // Get quote responses with bank details
    const responsesResponse = await fetch(`${API_BASE}/api/enhanced-quotes/${testQuoteId}/responses-with-bank-details`, {
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
    
    console.log(`✅ Found ${Array.isArray(responses) ? responses.length : 0} responses`);
    
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
      } else {
        console.log('\n⚠️ ISSUE: Some bank details are still missing');
      }
    } else {
      console.log('❌ No responses found for this quote');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testQuoteResponsesWithBankDetails();