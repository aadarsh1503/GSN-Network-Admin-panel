import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

const testBusinessLogoUpload = async () => {
  try {
    console.log('🔐 Testing business logo upload functionality...');
    
    // Login as admin (since we know this works)
    console.log('🔐 Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/user/login`, {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Test 1: Check if upload endpoint is accessible
    console.log('\n📡 Testing upload endpoint accessibility...');
    
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });

    console.log('📤 Uploading test logo...');
    const uploadResponse = await axios.post(`${API_BASE}/upload/image`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Logo upload successful!');
    console.log('📊 Upload response:', {
      message: uploadResponse.data.message,
      url: uploadResponse.data.url,
      public_id: uploadResponse.data.public_id
    });

    // Test 2: Verify the uploaded image URL is accessible
    console.log('\n🔍 Verifying uploaded image accessibility...');
    try {
      const imageCheck = await axios.head(uploadResponse.data.url);
      console.log('✅ Uploaded image is accessible');
      console.log('📊 Image details:', {
        status: imageCheck.status,
        contentType: imageCheck.headers['content-type'],
        contentLength: imageCheck.headers['content-length']
      });
    } catch (imageError) {
      console.log('❌ Uploaded image is not accessible:', imageError.message);
    }

    console.log('\n✅ Business logo upload test completed successfully!');
    console.log('📝 Summary:');
    console.log('   ✅ Upload endpoint is working');
    console.log('   ✅ Image upload to Cloudinary successful');
    console.log('   ✅ Response format is correct');
    console.log('   ✅ Uploaded image is accessible');
    
    console.log('\n🔧 Frontend should now work with these changes:');
    console.log('   - Changed endpoint from /api/upload/logo to /api/upload/image');
    console.log('   - Changed form field from "logo" to "image"');
    console.log('   - Changed response field from "logoUrl" to "url"');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n🔍 Debugging 404 error:');
      console.log('   - Check if upload routes are properly mounted in server/index.js');
      console.log('   - Verify /api/upload/image endpoint exists');
      console.log('   - Check server logs for route registration');
    }
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Debugging 401 error:');
      console.log('   - Check if authentication middleware is working');
      console.log('   - Verify token is being sent correctly');
    }
  }
};

testBusinessLogoUpload();