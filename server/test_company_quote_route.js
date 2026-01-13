// Test the company quote status update route
const BASE_URL = 'http://localhost:5000';

async function testCompanyQuoteRoute() {
    console.log('🔍 Testing Company Quote Status Route...\n');
    
    try {
        // Test if the route exists (without authentication first)
        console.log('📡 Testing route existence...');
        const response = await fetch(`${BASE_URL}/api/company-quotes/quote/69/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'approved' })
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response status text: ${response.statusText}`);
        
        if (response.status === 401) {
            console.log('✅ Route exists but requires authentication (expected)');
        } else if (response.status === 404) {
            console.log('❌ Route not found - there might be an issue with route registration');
        } else {
            console.log(`ℹ️ Unexpected response: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        // Test with a token (if available)
        console.log('\n📡 Testing with authentication...');
        
        // You would need to get a valid company token here
        // For now, let's just test the route structure
        
        console.log('\n🔍 Route Analysis:');
        console.log('Expected route: PUT /api/company-quotes/quote/:quoteId/status');
        console.log('Actual request: PUT /api/company-quotes/quote/69/status');
        console.log('Route should match if properly registered');
        
    } catch (error) {
        console.error('❌ Error testing route:', error.message);
        
        if (error.message.includes('fetch failed')) {
            console.log('💡 Server might not be running on port 5000');
        }
    }
}

testCompanyQuoteRoute();