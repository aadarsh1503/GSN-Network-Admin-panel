import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testAPIEndpoints() {
    try {
        console.log('🧪 Testing API endpoints directly...\n');
        
        // Test 1: Check if dispute routes are accessible
        console.log('1️⃣ Testing dispute reasons endpoint...');
        try {
            const response = await axios.get(`${BASE_URL}/api/disputes/reasons`);
            console.log(`✅ Dispute reasons: ${response.data.length} found`);
        } catch (error) {
            console.log(`❌ Dispute reasons failed: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
        }
        
        // Test 2: Check server health
        console.log('\n2️⃣ Testing server health...');
        try {
            const response = await axios.get(`${BASE_URL}/api/health`);
            console.log('✅ Server health check passed');
        } catch (error) {
            console.log(`⚠️ Health endpoint not found: ${error.message}`);
        }
        
        // Test 3: Check if the company status endpoint exists (without auth)
        console.log('\n3️⃣ Testing company status endpoint structure...');
        try {
            const response = await axios.put(`${BASE_URL}/api/disputes/company-status/999`, {
                status: 'resolved',
                reason: 'test'
            });
            console.log('✅ Endpoint exists (unexpected success)');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Endpoint exists but requires authentication (expected)');
            } else if (error.response && error.response.status === 404) {
                console.log('❌ Endpoint not found - route may not be registered');
            } else {
                console.log(`⚠️ Unexpected error: ${error.message}`);
                if (error.response) {
                    console.log(`   Status: ${error.response.status}`);
                    console.log(`   Data: ${JSON.stringify(error.response.data)}`);
                }
            }
        }
        
        console.log('\n📝 If endpoints are not working:');
        console.log('1. Check if server is running on port 5000');
        console.log('2. Check if routes are properly registered');
        console.log('3. Check for CORS issues');
        console.log('4. Check authentication middleware');
        
    } catch (error) {
        console.error('❌ Error testing endpoints:', error.message);
    }
}

testAPIEndpoints();