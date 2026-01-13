// debug_admin_quotes_api.js
// Script to debug why the comprehensive admin quotes API is not working

const BASE_URL = 'http://localhost:5000'; // Adjust if your server runs on different port

async function debugAdminQuotesAPI() {
    console.log('🔍 Debugging Admin Quotes API Issues...\n');

    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
        const response = await fetch(`${BASE_URL}/api/admin-panel/quotes`);
        console.log(`✅ Server is running - Status: ${response.status}`);
        
        if (response.status === 401) {
            console.log('⚠️  Authentication required - this is expected');
        } else if (response.status === 200) {
            const data = await response.json();
            console.log(`✅ Basic admin API working - Found ${data.length} quotes`);
        }
    } catch (error) {
        console.log(`❌ Server connection failed: ${error.message}`);
        console.log('👉 Make sure your server is running on the correct port');
        return;
    }

    // Test 2: Check if enhanced routes exist
    console.log('\n2. Testing enhanced quote routes...');
    const enhancedRoutes = [
        '/api/enhanced-quotes/admin/comprehensive-quotes',
        '/api/enhanced-quotes/admin/comprehensive-quotes/approved'
    ];

    for (const route of enhancedRoutes) {
        try {
            const response = await fetch(`${BASE_URL}${route}`);
            console.log(`Route: ${route}`);
            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.status === 404) {
                console.log('❌ Route not found - server needs restart or route not registered');
            } else if (response.status === 401) {
                console.log('✅ Route exists but requires authentication');
            } else if (response.status === 500) {
                console.log('⚠️  Server error - check server logs');
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
        }
        console.log('---');
    }

    // Test 3: Check what data the fallback API returns
    console.log('\n3. Analyzing fallback API data...');
    try {
        const response = await fetch(`${BASE_URL}/api/admin-panel/quotes`);
        if (response.ok) {
            const quotes = await response.json();
            console.log(`Found ${quotes.length} quotes in fallback API`);
            
            if (quotes.length > 0) {
                const sampleQuote = quotes[0];
                console.log('\nSample quote structure:');
                console.log('- ID:', sampleQuote.id);
                console.log('- User:', sampleQuote.user_name);
                console.log('- Response Count:', sampleQuote.response_count);
                console.log('- Status:', sampleQuote.status);
                console.log('- Has company_name field:', !!sampleQuote.company_name);
                console.log('- Has accepted_price field:', !!sampleQuote.accepted_price);
                
                if (!sampleQuote.company_name) {
                    console.log('\n❌ ISSUE FOUND: Fallback API lacks company assignment data');
                    console.log('👉 This is why you see "No company assigned"');
                }
            }
        }
    } catch (error) {
        console.log(`Error analyzing fallback data: ${error.message}`);
    }

    // Test 4: Provide solutions
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. RESTART THE SERVER to register new routes:');
    console.log('   - Stop server (Ctrl+C)');
    console.log('   - Run: npm run dev (or node server/index.js)');
    console.log('');
    console.log('2. If routes still return 404 after restart:');
    console.log('   - Check server/index.js has: app.use(\'/api/enhanced-quotes\', enhancedQuoteRoutes);');
    console.log('   - Check for syntax errors in enhanced quote files');
    console.log('');
    console.log('3. If you see authentication errors:');
    console.log('   - Make sure you\'re logged in as admin');
    console.log('   - Check browser network tab for auth headers');
    console.log('');
    console.log('4. TEMPORARY WORKAROUND:');
    console.log('   - The fallback mechanism will show basic info until server is restarted');
    console.log('   - Company assignment data requires the new comprehensive API');
}

// Run the debug
debugAdminQuotesAPI().catch(console.error);