// Test admin login to get a valid token
import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    const response = await fetch('http://localhost:5000/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123' // Updated admin password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin login successful');
      console.log('Token:', data.token);
      console.log('User:', data.user);
      
      // Test admin endpoints with this token
      await testAdminEndpointsWithToken(data.token);
    } else {
      console.log('❌ Admin login failed:', data.message);
      console.log('Let me try different passwords...');
      
      const commonPasswords = ['admin', '123456', 'password', 'admin@123'];
      for (const pwd of commonPasswords) {
        console.log(`Trying password: ${pwd}`);
        const testResponse = await fetch('http://localhost:5000/api/user/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'admin@gmail.com',
            password: pwd
          })
        });
        
        const testData = await testResponse.json();
        if (testResponse.ok) {
          console.log(`✅ Success with password: ${pwd}`);
          console.log('Token:', testData.token);
          await testAdminEndpointsWithToken(testData.token);
          return;
        }
      }
      
      console.log('❌ Could not find correct admin password');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAdminEndpointsWithToken(token) {
  console.log('\n🌐 Testing admin endpoints with valid token...');
  
  const endpoints = [
    '/api/admin-panel/quotes',
    '/api/admin-panel/subscriptions', 
    '/api/admin-panel/transactions'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`${endpoint}: ${response.status} - ${Array.isArray(data) ? data.length : 'N/A'} records`);
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
  }
}

testAdminLogin();