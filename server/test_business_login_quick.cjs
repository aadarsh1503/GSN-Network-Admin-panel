const axios = require('axios');
require('dotenv').config();

async function testBusinessLogin() {
  try {
    console.log('🔍 Testing business login...');
    
    const response = await axios.post('http://localhost:5000/api/user/login', {
      email: 'a@gmail.com',
      password: '222333'
    });
    
    console.log('✅ Login successful:', response.data);
    
    // Test token validation
    const token = response.data.token;
    console.log('🔑 Token:', token.substring(0, 50) + '...');
    
    // Test a protected endpoint
    const testResponse = await axios.get('http://localhost:5000/api/disputes/my-disputes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Protected endpoint works:', testResponse.data.length, 'disputes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testBusinessLogin();