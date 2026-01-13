const axios = require('axios');

async function testServerRunning() {
  try {
    console.log('🔍 Testing if server is running...');
    
    // Test a simple endpoint
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running on port 5000');
      console.log('💡 Please start the server with: npm start');
    } else {
      console.log('❌ Server error:', error.message);
    }
  }
}

testServerRunning();