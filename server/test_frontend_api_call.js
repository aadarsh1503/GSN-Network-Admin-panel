import fetch from 'node-fetch';

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing Frontend API Call...\n');
    
    // Login as admin
    const loginResponse = await fetch('http://localhost:5000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Admin login successful');
    
    // Test the exact API call that frontend makes
    const response = await fetch('http://localhost:5000/api/admin/email-stats', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response successful');
      console.log('📊 Response Data:');
      console.log('   emailStats:', data.emailStats);
      console.log('   userCounts:', data.userCounts);
      
      console.log('\n🎯 Frontend should receive:');
      Object.entries(data.userCounts).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} users`);
      });
      
    } else {
      const errorData = await response.text();
      console.log('❌ API Response failed');
      console.log('Error:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFrontendAPI();