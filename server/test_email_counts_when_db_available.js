// This script will test the email user counts when database is available
import fetch from 'node-fetch';

async function testEmailCounts() {
  try {
    console.log('🧪 Testing Email User Counts...');
    
    // First login as admin
    const loginResponse = await fetch('http://localhost:5000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Cannot login - database not available');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Admin login successful');
    
    // Test email stats endpoint
    const statsResponse = await fetch('http://localhost:5000/api/admin/email-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Email stats working');
      console.log('📊 User Counts:');
      Object.entries(statsData.userCounts).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} users`);
      });
    } else {
      console.log('❌ Email stats failed:', statsResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testEmailCounts();