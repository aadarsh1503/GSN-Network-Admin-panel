// Test subscription endpoints
import fetch from 'node-fetch';

async function testSubscriptionEndpoints() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Test subscription transactions endpoint
    console.log('\n🔍 Testing /api/admin-panel/subscription-transactions');
    const subTxnResponse = await fetch('http://localhost:5000/api/admin-panel/subscription-transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const subTxnData = await subTxnResponse.json();
    console.log(`Status: ${subTxnResponse.status}`);
    if (subTxnResponse.ok) {
      console.log(`✅ Found ${subTxnData.length} subscription transactions`);
      if (subTxnData.length > 0) {
        console.log('Sample:', JSON.stringify(subTxnData[0], null, 2));
      }
    } else {
      console.log('❌ Error:', subTxnData.message);
    }

    // Test original subscriptions endpoint
    console.log('\n🔍 Testing /api/admin-panel/subscriptions');
    const subResponse = await fetch('http://localhost:5000/api/admin-panel/subscriptions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const subData = await subResponse.json();
    console.log(`Status: ${subResponse.status}`);
    if (subResponse.ok) {
      console.log(`✅ Found ${subData.length} subscriptions`);
      if (subData.length > 0) {
        console.log('Sample:', JSON.stringify(subData[0], null, 2));
      }
    } else {
      console.log('❌ Error:', subData.message);
    }

    // Test quote transactions endpoint
    console.log('\n🔍 Testing /api/admin-panel/transactions (quote transactions)');
    const quoteTxnResponse = await fetch('http://localhost:5000/api/admin-panel/transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const quoteTxnData = await quoteTxnResponse.json();
    console.log(`Status: ${quoteTxnResponse.status}`);
    if (quoteTxnResponse.ok) {
      console.log(`✅ Found ${quoteTxnData.length} quote transactions`);
      if (quoteTxnData.length > 0) {
        console.log('Sample:', JSON.stringify(quoteTxnData[0], null, 2));
      }
    } else {
      console.log('❌ Error:', quoteTxnData.message);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testSubscriptionEndpoints();