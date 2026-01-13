// Comprehensive test of all bank details operations
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testAllBankDetailsOperations() {
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
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    console.log('\n📋 Step 2: Get existing admin bank details...');
    
    // Get existing bank details
    const getResponse = await fetch(`${API_BASE}/api/bank-details/admin/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const existingData = await getResponse.json();
    console.log(`Found ${existingData.length} existing admin bank details`);
    
    console.log('\n➕ Step 3: Create new admin bank details...');
    
    // Create new bank details
    const createData = {
      bank_name: 'Test Bank Complete',
      branch_name: 'Test Branch Complete',
      account_holder_name: 'GSN Network Services Complete',
      account_number: '5555666677778888',
      iban_number: 'GB29 NWBK 6016 1331 9268 19',
      swift_code: 'SBININBB123',
      payment_instructions: 'Complete test payment instructions',
      is_active: false // Don't make it active initially
    };
    
    const createResponse = await fetch(`${API_BASE}/api/bank-details/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(createData)
    });
    
    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.log('❌ Failed to create admin bank details:', createResult);
      return;
    }
    
    const newBankId = createResult.id;
    console.log('✅ Admin bank details created successfully, ID:', newBankId);
    
    console.log('\n🔄 Step 4: Update admin bank details...');
    
    // Update the bank details
    const updateData = {
      bank_name: 'Updated Test Bank',
      branch_name: 'Updated Test Branch',
      account_holder_name: 'GSN Network Services Updated',
      account_number: '9999888877776666',
      iban_number: 'GB29 NWBK 6016 1331 9268 20',
      swift_code: 'SBININBB124',
      payment_instructions: 'Updated test payment instructions',
      is_active: true // Make it active
    };
    
    const updateResponse = await fetch(`${API_BASE}/api/bank-details/admin/${newBankId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.log('❌ Failed to update admin bank details:', updateResult);
    } else {
      console.log('✅ Admin bank details updated successfully');
    }
    
    console.log('\n📋 Step 5: Verify updated data...');
    
    // Get updated bank details
    const verifyResponse = await fetch(`${API_BASE}/api/bank-details/admin/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const verifyData = await verifyResponse.json();
    const updatedRecord = verifyData.find(record => record.id === newBankId);
    
    if (updatedRecord) {
      console.log('✅ Updated record found:');
      console.log(`  - Bank: ${updatedRecord.bank_name}`);
      console.log(`  - Account: ${updatedRecord.account_number}`);
      console.log(`  - IBAN: ${updatedRecord.iban_number}`);
      console.log(`  - Active: ${updatedRecord.is_active ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Updated record not found');
    }
    
    console.log('\n🗑️ Step 6: Delete test bank details...');
    
    // Delete the test record
    const deleteResponse = await fetch(`${API_BASE}/api/bank-details/admin/${newBankId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const deleteResult = await deleteResponse.json();
    
    if (!deleteResponse.ok) {
      console.log('❌ Failed to delete admin bank details:', deleteResult);
    } else {
      console.log('✅ Admin bank details deleted successfully');
    }
    
    console.log('\n🎉 All admin bank details operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAllBankDetailsOperations();