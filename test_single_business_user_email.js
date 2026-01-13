// Simple test to trigger one business user email and see logs
import axios from 'axios';

async function testSingleBusinessUserEmail() {
  try {
    console.log('🔐 Logging in as admin...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    // Get business users
    const businessUsersResponse = await axios.get('http://localhost:5000/api/user/business-owners', { headers });
    const businessUsers = businessUsersResponse.data;
    
    if (businessUsers.length > 0) {
      const testUser = businessUsers[0];
      console.log(`\n📧 Testing deactivation email for: ${testUser.name} (${testUser.email})`);
      
      // Test deactivation email
      await axios.put(`http://localhost:5000/api/user/business-status/${testUser.id}`, {
        type: 'status',
        value: false
      }, { headers });
      
      console.log('✅ Deactivation request sent - check server logs for email processing');
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n📊 Checking email queue status...');
      const queueResponse = await axios.get('http://localhost:5000/api/email-queue/status', { headers });
      console.log('Email Queue:', queueResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSingleBusinessUserEmail();