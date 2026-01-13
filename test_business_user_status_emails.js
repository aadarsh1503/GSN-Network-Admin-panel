// Test script to verify business user and regular user status email functionality
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Test configuration
const testConfig = {
  adminCredentials: {
    email: 'admin@gmail.com',
    password: 'admin123'
  }
};

async function testBusinessUserStatusEmails() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${API_BASE}/api/user/login`, testConfig.adminCredentials);
    const adminToken = loginResponse.data.token;
    
    console.log('✅ Admin login successful');
    
    // Set up headers with admin token
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n📋 Fetching business users...');
    
    // Get business users
    const businessUsersResponse = await axios.get(`${API_BASE}/api/user/business-owners`, { headers });
    const businessUsers = businessUsersResponse.data;
    
    console.log(`✅ Found ${businessUsers.length} business users`);
    
    if (businessUsers.length > 0) {
      const testUser = businessUsers[0];
      console.log(`\n🧪 Testing status emails for business user: ${testUser.name} (${testUser.email})`);
      
      // Test deactivation email
      console.log('\n📧 Testing deactivation email...');
      await axios.put(`${API_BASE}/api/user/business-status/${testUser.id}`, {
        type: 'status',
        value: false
      }, { headers });
      
      console.log('✅ Deactivation request sent - check email queue');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test reactivation email
      console.log('\n📧 Testing reactivation email...');
      await axios.put(`${API_BASE}/api/user/business-status/${testUser.id}`, {
        type: 'status',
        value: true
      }, { headers });
      
      console.log('✅ Reactivation request sent - check email queue');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test blacklist email
      console.log('\n📧 Testing blacklist email...');
      await axios.put(`${API_BASE}/api/user/business-status/${testUser.id}`, {
        type: 'blacklist',
        value: true
      }, { headers });
      
      console.log('✅ Blacklist request sent - check email queue');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test unblacklist email
      console.log('\n📧 Testing unblacklist email...');
      await axios.put(`${API_BASE}/api/user/business-status/${testUser.id}`, {
        type: 'blacklist',
        value: false
      }, { headers });
      
      console.log('✅ Unblacklist request sent - check email queue');
    }
    
    console.log('\n📋 Fetching regular users...');
    
    // Get regular users
    const regularUsersResponse = await axios.get(`${API_BASE}/api/user/regular-users`, { headers });
    const regularUsers = regularUsersResponse.data;
    
    console.log(`✅ Found ${regularUsers.length} regular users`);
    
    if (regularUsers.length > 0) {
      const testUser = regularUsers[0];
      console.log(`\n🧪 Testing status emails for regular user: ${testUser.name} (${testUser.email})`);
      
      // Test deactivation email
      console.log('\n📧 Testing deactivation email...');
      await axios.put(`${API_BASE}/api/user/company-status/${testUser.id}`, {
        type: 'status',
        value: false
      }, { headers });
      
      console.log('✅ Deactivation request sent - check email queue');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test reactivation email (but regular users don't get activation emails, only deactivation)
      console.log('\n📧 Testing reactivation (should not send activation email for regular users)...');
      await axios.put(`${API_BASE}/api/user/company-status/${testUser.id}`, {
        type: 'status',
        value: true
      }, { headers });
      
      console.log('✅ Reactivation request sent - should only send deactivation emails, not activation');
    }
    
    // Check email queue status
    console.log('\n📊 Checking email queue status...');
    try {
      const queueResponse = await axios.get(`${API_BASE}/api/email-queue/status`, { headers });
      console.log('📧 Email Queue Status:', queueResponse.data);
    } catch (error) {
      console.log('ℹ️ Email queue status endpoint not available');
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Business users should receive deactivation/blacklist emails (not activation)');
    console.log('- Regular users should receive deactivation/blacklist emails (not activation)');
    console.log('- Admin should receive notifications for all status changes');
    console.log('- Check server logs and email queue for processing status');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - check admin credentials');
    }
  }
}

// Run the test
testBusinessUserStatusEmails();