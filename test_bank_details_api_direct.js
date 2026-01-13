// Direct test of the bank details API
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testBankDetailsAPI() {
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
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    console.log('\n📋 Step 2: Get existing bank details...');
    
    // Get existing bank details
    const getResponse = await fetch(`${API_BASE}/api/bank-details/admin/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const existingData = await getResponse.json();
    console.log('Existing bank details:', existingData);
    
    console.log('\n➕ Step 3: Create new bank details...');
    
    // Create new bank details
    const createData = {
      bank_name: 'Test Bank API',
      branch_name: 'Test Branch API',
      account_holder_name: 'GSN Network Services Test',
      account_number: '9876543210123456',
      iban_number: 'GB29 NWBK 6016 1331 9268 19',
      swift_code: 'SBININBB123',
      payment_instructions: 'Test payment instructions from API',
      is_active: true
    };
    
    console.log('Sending data:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch(`${API_BASE}/api/bank-details/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(createData)
    });
    
    const createResult = await createResponse.json();
    console.log('Create response status:', createResponse.status);
    console.log('Create response:', createResult);
    
    if (createResponse.ok) {
      console.log('✅ Bank details created successfully!');
    } else {
      console.log('❌ Failed to create bank details');
      console.log('Error details:', createResult);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBankDetailsAPI();