import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testServerHealth() {
    console.log('🔍 Testing Server Health...\n');

    try {
        // Test basic server response
        console.log('1. Testing server connection...');
        const healthResponse = await fetch(`${BASE_URL}/`);
        console.log(`Server response: ${healthResponse.status}`);
        
        // Test version endpoint
        console.log('2. Testing version endpoint...');
        const versionResponse = await fetch(`${BASE_URL}/api/version/current`);
        console.log(`Version endpoint: ${versionResponse.status}`);
        
        if (!versionResponse.ok) {
            const errorText = await versionResponse.text();
            console.log(`Version error: ${errorText}`);
        }
        
        // Test login endpoint
        console.log('3. Testing login endpoint...');
        const loginResponse = await fetch(`${BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });
        
        console.log(`Login endpoint: ${loginResponse.status}`);
        
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log(`Login error: ${errorText}`);
        }
        
    } catch (error) {
        console.error('❌ Server health check failed:', error.message);
    }
}

testServerHealth();