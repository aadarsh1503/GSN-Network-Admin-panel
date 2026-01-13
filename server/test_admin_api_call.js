import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAdminQuotesAPI() {
    console.log('🔍 Testing Admin Quotes API...\n');
    
    try {
        // Step 1: Admin Login
        console.log('🔐 Step 1: Admin Login...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const adminToken = loginData.token;
        
        console.log('✅ Admin login successful\n');

        // Step 2: Fetch Admin Quotes
        console.log('📊 Step 2: Fetching admin quotes...');
        const quotesResponse = await fetch(`${BASE_URL}/api/admin-panel/quotes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!quotesResponse.ok) {
            throw new Error(`Quotes fetch failed: ${quotesResponse.status}`);
        }

        const quotes = await quotesResponse.json();
        
        console.log('✅ Quotes fetched successfully');
        console.log(`📊 Total quotes received: ${quotes.length}`);
        
        if (quotes.length > 0) {
            const quotesWithCompany = quotes.filter(q => q.company_name);
            const quotesWithoutCompany = quotes.filter(q => !q.company_name);
            
            console.log(`🏢 Quotes with company: ${quotesWithCompany.length}`);
            console.log(`❌ Quotes without company: ${quotesWithoutCompany.length}`);
            
            console.log('\n📋 First 3 quotes:');
            quotes.slice(0, 3).forEach((quote, index) => {
                console.log(`\n--- Quote ${index + 1} (ID: ${quote.id}) ---`);
                console.log(`Customer: ${quote.user_name} (${quote.user_email})`);
                console.log(`Company: ${quote.company_name || 'MISSING'}`);
                console.log(`Company Email: ${quote.company_email || 'MISSING'}`);
                console.log(`Price: ${quote.accepted_price || 'MISSING'}`);
                console.log(`Responses: ${quote.response_count} total, ${quote.accepted_count} accepted`);
                console.log(`Status: ${quote.status}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAdminQuotesAPI();