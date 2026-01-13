// Simple test to check payment upload endpoint
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const testPaymentUpload = async () => {
  console.log('🧪 Testing Payment Upload Endpoint');
  console.log('==================================');

  try {
    // First login to get token
    console.log('🔐 Step 1: Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'subodhchauhan1309@gmail.com',
        password: '222333'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login successful');
    const token = loginData.token;

    // Test the upload endpoint with minimal data
    console.log('\n📤 Step 2: Testing upload endpoint...');
    
    const formData = new FormData();
    formData.append('quote_id', '84');
    formData.append('quote_response_id', '1'); // Use a valid response ID
    formData.append('payment_date', '2026-01-11');
    formData.append('payment_notes', 'Test upload');
    
    // Create a small test file
    const testFileContent = 'test image content';
    fs.writeFileSync('test_payment.jpg', testFileContent);
    formData.append('payment_proof', fs.createReadStream('test_payment.jpg'));

    const uploadResponse = await fetch('http://localhost:5000/api/enhanced-quotes/upload-payment-proof', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const uploadData = await uploadResponse.json();
    
    console.log(`\n📊 Upload Response Status: ${uploadResponse.status}`);
    console.log('📊 Upload Response Data:', uploadData);

    if (uploadResponse.ok) {
      console.log('✅ Upload successful!');
    } else {
      console.log('❌ Upload failed:', uploadData.message);
      
      if (uploadResponse.status === 500) {
        console.log('🚨 500 Internal Server Error detected!');
        console.log('This suggests a server-side crash or database issue.');
      }
      
      if (uploadData.message && uploadData.message.includes('already uploaded')) {
        console.log('🚨 "Already uploaded" error detected!');
        console.log('This suggests existing payment proof data needs cleanup.');
      }
    }

    // Cleanup test file
    try {
      fs.unlinkSync('test_payment.jpg');
    } catch (e) {
      // Ignore cleanup errors
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

testPaymentUpload();