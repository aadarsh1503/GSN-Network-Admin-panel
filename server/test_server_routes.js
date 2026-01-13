// Test script to check if server routes are working
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testServerRoutes() {
    console.log('🔍 Testing server routes...\n');
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        const healthResponse = await fetch(`${API_BASE}/api/test/health`);
        console.log(`   Server health: ${healthResponse.status === 200 ? '✅ OK' : '❌ Failed'}`);
        
        // Test 2: Check if user routes are mounted
        console.log('\n2. Testing user routes...');
        const userResponse = await fetch(`${API_BASE}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        });
        console.log(`   User routes mounted: ${userResponse.status !== 404 ? '✅ OK' : '❌ Not Found'}`);
        
        // Test 3: Check if company-profile route exists (should return 401 without auth)
        console.log('\n3. Testing company-profile route...');
        const companyProfileResponse = await fetch(`${API_BASE}/api/user/company-profile`);
        console.log(`   Company profile route: ${companyProfileResponse.status === 401 ? '✅ OK (Unauthorized - route exists)' : `❌ Status: ${companyProfileResponse.status}`}`);
        
        if (companyProfileResponse.status === 404) {
            console.log('   ❌ Route not found! Check if server was restarted after adding the route.');
        }
        
        // Test 4: List all available routes (if possible)
        console.log('\n4. Available user routes should include:');
        console.log('   - GET /api/user/me');
        console.log('   - GET /api/user/company-profile ← NEW ROUTE');
        console.log('   - POST /api/user/login');
        console.log('   - POST /api/user/register');
        
    } catch (error) {
        console.error('❌ Error testing routes:', error.message);
        console.log('\n💡 Make sure the server is running on port 5000');
        console.log('   Run: cd server && npm start');
    }
}

testServerRoutes();