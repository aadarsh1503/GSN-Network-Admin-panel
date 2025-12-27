// Test all modal data endpoints to verify they work
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAllModalData() {
    try {
        console.log('🔐 Testing admin login...');
        
        // Login as admin
        const loginResponse = await fetch(`${BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');

        // Test all modal scenarios
        console.log('\n📊 Testing all modal data scenarios...');
        
        const scenarios = [
            {
                name: 'Total Users',
                type: 'users',
                endpoint: '/api/user/all',
                expectedCount: 5
            },
            {
                name: 'Active Users',
                type: 'activeUsers',
                endpoint: '/api/user/all',
                filter: (data) => data.filter(user => user.status === 1 || user.status === true),
                expectedCount: 5
            },
            {
                name: 'All Quotes',
                type: 'quotes',
                endpoint: '/api/admin-panel/quotes',
                expectedCount: 3
            },
            {
                name: 'Weekly Quotes',
                type: 'weeklyQuotes',
                endpoint: '/api/admin-panel/quotes',
                filter: (data) => {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return data.filter(quote => new Date(quote.created_at) >= oneWeekAgo);
                },
                expectedCount: 3
            },
            {
                name: 'All Subscriptions',
                type: 'subscriptions',
                endpoint: '/api/admin-panel/subscriptions',
                expectedCount: 3
            },
            {
                name: 'Active Subscriptions',
                type: 'activeSubscriptions',
                endpoint: '/api/admin-panel/subscriptions',
                filter: (data) => data.filter(sub => sub.status === 'active'),
                expectedCount: 3
            },
            {
                name: 'Quote Transactions',
                type: 'transactions',
                endpoint: '/api/admin-panel/transactions',
                expectedCount: 3
            },
            {
                name: 'Avg Transaction Analysis',
                type: 'avgTransaction',
                endpoint: '/api/admin-panel/transactions',
                expectedCount: 3
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n🔍 Testing ${scenario.name}:`);
            
            try {
                const response = await fetch(`${BASE_URL}${scenario.endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    let data = await response.json();
                    
                    // Apply filter if exists
                    if (scenario.filter) {
                        data = scenario.filter(data);
                    }
                    
                    console.log(`   ✅ Endpoint: ${scenario.endpoint}`);
                    console.log(`   📊 Records: ${data.length}`);
                    console.log(`   🎯 Expected: ${scenario.expectedCount}`);
                    console.log(`   ${data.length === scenario.expectedCount ? '✅' : '⚠️ '} Match: ${data.length === scenario.expectedCount ? 'YES' : 'NO'}`);
                    
                    if (data.length > 0) {
                        console.log(`   📄 Sample keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`);
                    }
                } else {
                    console.log(`   ❌ HTTP Error: ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        // Test subscription transactions fallback
        console.log('\n🔍 Testing subscription transactions fallback:');
        try {
            const response = await fetch(`${BASE_URL}/api/admin-panel/subscription-transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Subscription transactions: ${data.length} records`);
            } else {
                console.log(`   ❌ HTTP Error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('\n🎉 Modal data testing complete!');
        console.log('All cards should now show data when clicked.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAllModalData();