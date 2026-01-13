// Simple test to verify payment upload fix
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testPaymentUpload() {
    console.log('🧪 Testing Payment Upload Fix...\n');
    
    // Test configuration
    const config = {
        baseUrl: 'http://localhost:5000',
        // You'll need to replace these with actual values
        token: 'YOUR_AUTH_TOKEN_HERE',
        quoteId: 88,
        quoteResponseId: 123,
        paymentDate: '2026-01-08'
    };
    
    try {
        // Create a test file (dummy image)
        const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync('test_payment.png', testImageBuffer);
        
        // Create FormData
        const formData = new FormData();
        formData.append('payment_proof', fs.createReadStream('test_payment.png'));
        formData.append('quote_id', config.quoteId.toString());
        formData.append('quote_response_id', config.quoteResponseId.toString());
        formData.append('payment_date', config.paymentDate);
        formData.append('payment_notes', 'Test payment upload after fixing 500 error');
        
        console.log('📤 Uploading payment proof...');
        console.log(`Quote ID: ${config.quoteId}`);
        console.log(`Quote Response ID: ${config.quoteResponseId}`);
        console.log(`Payment Date: ${config.paymentDate}\n`);
        
        // Make the request
        const response = await fetch(`${config.baseUrl}/api/enhanced-quotes/upload-payment-proof`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            console.log('✅ SUCCESS! Payment upload works correctly');
            console.log('📋 Response Details:');
            console.log(`   Status: ${response.status}`);
            console.log(`   Message: ${responseData.message}`);
            console.log(`   Payment Proof ID: ${responseData.paymentProofId}`);
            console.log(`   File URL: ${responseData.fileUrl}`);
            console.log('\n🎉 The 500 error has been fixed!');
        } else {
            console.log(`❌ ERROR: ${response.status}`);
            console.log(`   Message: ${responseData.message}`);
            
            if (response.status === 500) {
                console.log('\n🔍 This indicates the 500 error still exists');
                console.log('   Check server logs for more details');
            } else if (response.status === 401) {
                console.log('\n🔑 Authentication issue - update the token in config');
            } else if (response.status === 404) {
                console.log('\n📝 Quote or response not found - update IDs in config');
            }
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error.message);
        console.log('\n🔍 Possible issues:');
        console.log('   - Server not running on port 5000');
        console.log('   - Network connectivity issues');
        console.log('   - Invalid request format');
    } finally {
        // Cleanup test file
        try {
            fs.unlinkSync('test_payment.png');
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

// Instructions
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Update the config object with your actual values:');
console.log('   - token: Get from browser localStorage.getItem("token")');
console.log('   - quoteId: Use a valid quote ID from your database');
console.log('   - quoteResponseId: Use a valid quote response ID');
console.log('2. Make sure the server is running on port 5000');
console.log('3. Run: node test_payment_upload_simple.js\n');

// Only run if token is provided
if (process.argv.includes('--run')) {
    testPaymentUpload();
} else {
    console.log('💡 To run the test, add --run flag: node test_payment_upload_simple.js --run');
}