const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

async function testUploadEndpoint() {
  try {
    console.log('🔍 Testing upload endpoint directly...');
    
    // 1. Login first
    const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
      email: 'a@gmail.com',
      password: '222333'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // 2. Test upload endpoint
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Testing upload endpoint...');
    const uploadResponse = await axios.post('http://localhost:5000/api/upload/image', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Upload successful:', uploadResponse.data);
    
  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUploadEndpoint();