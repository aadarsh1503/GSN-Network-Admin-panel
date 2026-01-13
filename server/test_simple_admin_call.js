import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testSimple() {
    try {
        console.log('🔍 Testing simple admin login...');
        
        const response = await fetch(`${BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));
        
        const text = await response.text();
        console.log('Response body:', text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ Login successful, token:', data.token ? 'Present' : 'Missing');
            
            // Now test the quotes API
            console.log('\n📊 Testing quotes API...');
            const quotesResponse = await fetch(`${BASE_URL}/api/admin-panel/quotes`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Quotes response status:', quotesResponse.status);
            const quotesText = await quotesResponse.text();
            console.log('Quotes response length:', quotesText.length);
            
            if (quotesResponse.ok) {
                const quotes = JSON.parse(quotesText);
                console.log(`✅ Got ${quotes.length} quotes`);
                
                if (quotes.length > 0) {
                    console.log('\nFirst quote sample:');
                    const first = quotes[0];
                    console.log('- ID:', first.id);
                    console.log('- User:', first.user_name);
                    console.log('- Company Name:', first.company_name || 'MISSING');
                    console.log('- Company Email:', first.company_email || 'MISSING');
                    console.log('- Price:', first.accepted_price || 'MISSING');
                }
            } else {
                console.log('❌ Quotes API failed:', quotesText);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSimple();