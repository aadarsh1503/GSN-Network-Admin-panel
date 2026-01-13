import axios from 'axios';
import FormData from 'form-data';

// Test the frontend API call flow
async function testFrontendAPICall() {
  console.log('🔍 Testing frontend API call flow...');
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'a@gmail.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.username} (${user.role})`);
    
    // 2. Test dispute creation (without file)
    console.log('\n2. Testing dispute creation...');
    const disputeData = {
      company_id: 10,
      dispute_reason_id: 1,
      title: 'Frontend Test Dispute',
      description: 'Testing dispute creation from frontend flow',
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
    
    // 3. Test file upload endpoint
    console.log('\n3. Testing file upload endpoint...');
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post('http://localhost:5000/api/upload/image', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ File upload successful:', uploadResponse.data);
    
    // 4. Test attachment saving
    console.log('\n4. Testing attachment saving...');
    const attachmentData = {
      dispute_id: disputeId,
      image_url: uploadResponse.data.url,
      image_type: 'evidence'
    };
    
    const attachmentResponse = await axios.post('http://localhost:5000/api/disputes/attachments', attachmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Attachment saved:', attachmentResponse.data);
    
    // 5. Verify the dispute has the attachment
    console.log('\n5. Verifying dispute with attachment...');
    const disputesResponse = await axios.get('http://localhost:5000/api/disputes/my-disputes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const createdDispute = disputesResponse.data.find(d => d.id === disputeId);
    if (createdDispute) {
      console.log(`✅ Dispute verification successful:`);
      console.log(`   Title: ${createdDispute.title}`);
      console.log(`   Images: ${createdDispute.images ? createdDispute.images.length : 0}`);
      if (createdDispute.images && createdDispute.images.length > 0) {
        console.log(`   Image URL: ${createdDispute.images[0].image_url}`);
      }
    }
    
    console.log('\n✅ Frontend API call test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in frontend API test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendAPICall();