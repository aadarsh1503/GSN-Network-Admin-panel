// test_server_connection.js
async function testServerConnection() {
    try {
        console.log('🔍 Testing server connection...');
        
        // Test if server is running
        const response = await fetch('http://localhost:5000/api/users/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Server response status:', response.status);
        
        if (response.status === 401) {
            console.log('✅ Server is running! (401 is expected without auth token)');
        } else {
            console.log('Response:', await response.text());
        }
        
        // Test business routes specifically
        console.log('\n🔍 Testing business routes...');
        const businessResponse = await fetch('http://localhost:5000/api/business/transaction-invoices', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Business route response status:', businessResponse.status);
        console.log('Business route response:', await businessResponse.text());
        
    } catch (error) {
        console.error('❌ Error testing server:', error.message);
    }
}

testServerConnection();