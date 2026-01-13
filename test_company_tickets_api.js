// Test the company tickets API endpoints
import fetch from 'node-fetch';

async function testCompanyTicketsAPI() {
    try {
        console.log('🧪 Testing Company Tickets API...');
        console.log('📍 Server URL: http://localhost:5000');
        
        // Test the company tickets endpoint (will require authentication)
        console.log('\n1. Testing GET /api/tickets/company/received');
        const response = await fetch('http://localhost:5000/api/tickets/company/received', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // In production, you'd need: 'Authorization': 'Bearer ' + token
            }
        });
        
        console.log(`   Response Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
            console.log('   🔐 Authentication required (expected for company endpoint)');
            console.log('   ✅ Endpoint is accessible but requires company authentication');
        } else if (response.ok) {
            const tickets = await response.json();
            console.log(`   📊 Company tickets found: ${tickets.length}`);
        } else {
            console.log(`   ❌ Unexpected response: ${response.status}`);
        }
        
        console.log('\n2. Testing PUT /api/tickets/company/:id/respond');
        const responseTest = await fetch('http://localhost:5000/api/tickets/company/1/respond', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ response: 'Test response' })
        });
        
        console.log(`   Response Status: ${responseTest.status} ${responseTest.statusText}`);
        
        if (responseTest.status === 401) {
            console.log('   🔐 Authentication required (expected for company endpoint)');
            console.log('   ✅ Endpoint is accessible but requires company authentication');
        }
        
        console.log('\n✅ API Endpoints Test Complete');
        console.log('\n🎯 Next Steps:');
        console.log('   1. Login as a company user');
        console.log('   2. Go to: http://localhost:5174/company/my-Tickets');
        console.log('   3. Verify tickets sent to company are displayed');
        console.log('   4. Test responding to tickets');
        console.log('   5. Check Messages panel for response integration');
        
    } catch (error) {
        console.error('❌ API Test Error:', error.message);
        console.log('\n💡 Make sure the server is running on http://localhost:5000');
    }
}

// Run the test
testCompanyTicketsAPI();