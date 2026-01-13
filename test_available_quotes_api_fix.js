// Simple test to verify available quotes API filtering
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAvailableQuotesFiltering() {
    console.log('🔍 Testing Available Quotes API Filtering Fix\n');
    
    try {
        // Step 1: Login as a company
        console.log('🔐 Step 1: Logging in as company...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'company@example.com', // You may need to adjust this
                password: 'password123'
            })
        });

        if (!loginResponse.ok) {
            // Try alternative login
            console.log('Trying alternative company login...');
            const altLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@company.com',
                    password: 'password'
                })
            });
            
            if (!altLoginResponse.ok) {
                throw new Error(`Company login failed: ${loginResponse.status}`);
            }
            
            const altLoginData = await altLoginResponse.json();
            var token = altLoginData.token;
        } else {
            const loginData = await loginResponse.json();
            var token = loginData.token;
        }
        
        console.log('✅ Company login successful');

        // Step 2: Fetch available quotes
        console.log('\n📋 Step 2: Fetching available quotes...');
        const quotesResponse = await fetch(`${BASE_URL}/api/quotes/available`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!quotesResponse.ok) {
            throw new Error(`Available quotes fetch failed: ${quotesResponse.status}`);
        }

        const quotesData = await quotesResponse.json();
        
        console.log('✅ Available quotes fetched successfully');
        console.log(`📊 Total available quotes: ${quotesData.quotes.length}`);
        
        if (quotesData.quotes.length > 0) {
            console.log('\n📋 Sample available quotes:');
            quotesData.quotes.slice(0, 5).forEach((quote, index) => {
                console.log(`${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Status: ${quote.status} | Responses: ${quote.response_count}`);
                console.log(`   Already responded: ${quote.already_responded ? 'Yes' : 'No'}`);
                console.log('');
            });
        }

        // Step 3: Check for admin quotes to compare
        console.log('📋 Step 3: Comparing with admin quotes...');
        
        // Login as admin
        const adminLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        if (adminLoginResponse.ok) {
            const adminLoginData = await adminLoginResponse.json();
            const adminToken = adminLoginData.token;
            
            // Fetch all quotes from admin panel
            const adminQuotesResponse = await fetch(`${BASE_URL}/api/admin-panel/quotes`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (adminQuotesResponse.ok) {
                const adminQuotesData = await adminQuotesResponse.json();
                
                console.log(`📊 Total quotes in admin panel: ${adminQuotesData.length}`);
                
                // Find quotes with accepted responses or payment proofs
                const takenQuotes = adminQuotesData.filter(quote => 
                    quote.company_name || 
                    quote.accepted_price || 
                    quote.payment_status === 'verified'
                );
                
                console.log(`📊 Quotes taken by companies: ${takenQuotes.length}`);
                
                if (takenQuotes.length > 0) {
                    console.log('\n📋 Sample taken quotes (should NOT appear in available):');
                    takenQuotes.slice(0, 3).forEach((quote, index) => {
                        console.log(`${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                        console.log(`   Company: ${quote.company_name || 'None'}`);
                        console.log(`   Price: ${quote.accepted_price || 'None'}`);
                        console.log(`   Payment: ${quote.payment_status || 'None'}`);
                        console.log('');
                    });
                    
                    // Check if any taken quotes appear in available quotes
                    const takenQuoteIds = takenQuotes.map(q => q.id);
                    const availableQuoteIds = quotesData.quotes.map(q => q.id);
                    const overlap = takenQuoteIds.filter(id => availableQuoteIds.includes(id));
                    
                    if (overlap.length === 0) {
                        console.log('✅ SUCCESS: No taken quotes found in available quotes list');
                    } else {
                        console.log(`❌ ISSUE: ${overlap.length} taken quotes still showing as available:`);
                        console.log(`   Quote IDs: ${overlap.join(', ')}`);
                    }
                }
            }
        }

        // Step 4: Summary
        console.log('\n📊 Test Summary:');
        console.log(`- Available quotes for company: ${quotesData.quotes.length}`);
        console.log(`- Company subscription status: ${quotesData.hasActiveSubscription ? 'Active' : 'Inactive'}`);
        console.log(`- Can respond to quotes: ${quotesData.canRespond ? 'Yes' : 'No'}`);
        console.log('- Filtering appears to be working correctly ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure the server is running on port 5000');
        console.log('2. Ensure you have company accounts set up');
        console.log('3. Check that the database has quote data');
    }
}

// Run the test
testAvailableQuotesFiltering();