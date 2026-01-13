const axios = require('axios');
require('dotenv').config();

async function testDisputeAPIResponse() {
  try {
    console.log('🔍 Testing dispute API response...');
    
    // 1. Login first
    const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
      email: 'a@gmail.com',
      password: '222333'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // 2. Get disputes
    const disputesResponse = await axios.get('http://localhost:5000/api/disputes/my-disputes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`📋 Found ${disputesResponse.data.length} disputes`);
    
    // 3. Find dispute #24
    const dispute24 = disputesResponse.data.find(d => d.id === 24);
    
    if (dispute24) {
      console.log('\n📋 Dispute #24 API Response:');
      console.log(`   ID: ${dispute24.id}`);
      console.log(`   Title: ${dispute24.title}`);
      console.log(`   Status: ${dispute24.status}`);
      console.log(`   Company: ${dispute24.company_name}`);
      console.log(`   Images count: ${dispute24.images ? dispute24.images.length : 0}`);
      
      if (dispute24.images && dispute24.images.length > 0) {
        console.log('\n📸 Images in API response:');
        dispute24.images.forEach((image, index) => {
          console.log(`   Image ${index + 1}:`);
          console.log(`     URL: ${image.image_url}`);
          console.log(`     Type: ${image.image_type}`);
          console.log(`     ID: ${image.id}`);
        });
      } else {
        console.log('\n❌ No images found in API response');
      }
    } else {
      console.log('\n❌ Dispute #24 not found in API response');
      console.log('Available disputes:');
      disputesResponse.data.forEach(d => {
        console.log(`   #${d.id}: ${d.title} (${d.images ? d.images.length : 0} images)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDisputeAPIResponse();