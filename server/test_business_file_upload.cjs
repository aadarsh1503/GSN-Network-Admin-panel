const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Test the business dispute file upload flow
async function testBusinessFileUpload() {
  console.log('🔍 Testing business dispute file upload flow...');
  
  try {
    // 1. Login as business user
    console.log('\n1. Logging in as business user...');
    const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
      email: 'a@gmail.com',
      password: '222333'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.username} (${user.role})`);
    
    if (user.role !== 'business') {
      console.log('❌ User is not a business user, cannot test business dispute upload');
      return;
    }
    
    // 2. Test dispute creation
    console.log('\n2. Creating dispute...');
    const disputeData = {
      company_id: 10,
      dispute_reason_id: 1,
      title: 'File Upload Test Dispute',
      description: 'Testing file upload functionality from business user',
      priority: 'medium'
    };
    
    const disputeResponse = await axios.post('http://localhost:5000/api/disputes/create', disputeData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dispute created:', disputeResponse.data);
    const disputeId = disputeResponse.data.disputeId;
    
    // 3. Test file upload
    console.log('\n3. Testing file upload...');
    
    // Create a test image (1x1 PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-evidence.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Uploading file to /api/upload/image...');
    const uploadResponse = await axios.post('http://localhost:5000/api/upload/image', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ File upload response:', uploadResponse.data);
    
    if (!uploadResponse.data.url) {
      console.log('❌ No URL returned from upload');
      return;
    }
    
    // 4. Save attachment to dispute
    console.log('\n4. Saving attachment to dispute...');
    const attachmentData = {
      dispute_id: disputeId,
      image_url: uploadResponse.data.url,
      image_type: 'evidence'
    };
    
    console.log('📎 Attachment data:', attachmentData);
    const attachmentResponse = await axios.post('http://localhost:5000/api/disputes/attachments', attachmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Attachment saved:', attachmentResponse.data);
    
    // 5. Verify dispute shows attachment
    console.log('\n5. Verifying dispute with attachment...');
    const disputesResponse = await axios.get('http://localhost:5000/api/disputes/my-disputes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const createdDispute = disputesResponse.data.find(d => d.id === disputeId);
    if (createdDispute) {
      console.log(`✅ Dispute found:`);
      console.log(`   ID: ${createdDispute.id}`);
      console.log(`   Title: ${createdDispute.title}`);
      console.log(`   Images count: ${createdDispute.images ? createdDispute.images.length : 0}`);
      
      if (createdDispute.images && createdDispute.images.length > 0) {
        console.log(`   ✅ Attachment found:`);
        createdDispute.images.forEach((img, index) => {
          console.log(`     ${index + 1}. ${img.image_url} (${img.image_type})`);
        });
      } else {
        console.log(`   ❌ No attachments found in dispute`);
      }
    } else {
      console.log('❌ Created dispute not found in my-disputes response');
    }
    
    console.log('\n✅ Business file upload test completed!');
    
  } catch (error) {
    console.error('❌ Error in business file upload test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }
  }
}

testBusinessFileUpload();