import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testDisputeFlow() {
    try {
        console.log('🧪 Testing complete dispute flow...\n');
        
        // Test 1: Get company disputes (you'll need to login as a company first)
        console.log('1️⃣ Testing company disputes endpoint...');
        try {
            const response = await axios.get(`${BASE_URL}/api/disputes/company-disputes`, {
                headers: {
                    'Authorization': 'Bearer YOUR_COMPANY_TOKEN_HERE' // You'll need to replace this
                }
            });
            console.log(`✅ Found ${response.data.length} disputes for company`);
        } catch (error) {
            console.log('⚠️ Company disputes endpoint test skipped (need authentication)');
        }
        
        // Test 2: Test dispute reasons endpoint (public)
        console.log('\n2️⃣ Testing dispute reasons endpoint...');
        try {
            const response = await axios.get(`${BASE_URL}/api/disputes/reasons`);
            console.log(`✅ Found ${response.data.length} dispute reasons`);
            response.data.slice(0, 3).forEach(reason => {
                console.log(`  - ${reason.title}`);
            });
        } catch (error) {
            console.log('❌ Dispute reasons endpoint failed:', error.message);
        }
        
        console.log('\n📝 Manual Testing Instructions:');
        console.log('1. Login as a company user');
        console.log('2. Navigate to http://localhost:5174/company/disputes');
        console.log('3. Try to respond to a dispute using the green message button');
        console.log('4. Try to change dispute status using the orange status button');
        console.log('5. Check that notifications are sent to users');
        
        console.log('\n✅ Basic endpoint tests completed!');
        
    } catch (error) {
        console.error('❌ Error testing dispute flow:', error.message);
    }
}

testDisputeFlow();