// Debug all endpoints used by modal functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function debugModalEndpoints() {
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

        // Test all endpoints used by modals
        console.log('\n📊 Testing modal endpoints...');
        
        const endpoints = [
            { name: 'All Users', url: '/api/user/all', cardType: 'users' },
            { name: 'Admin Quotes', url: '/api/admin-panel/quotes', cardType: 'quotes' },
            { name: 'Admin Subscriptions', url: '/api/admin-panel/subscriptions', cardType: 'subscriptions' },
            { name: 'Admin Transactions', url: '/api/admin-panel/transactions', cardType: 'transactions' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\n🔍 Testing ${endpoint.name} (${endpoint.url}):`);
                
                const response = await fetch(`${BASE_URL}${endpoint.url}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`   ✅ Status: ${response.status}`);
                    console.log(`   📊 Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
                    console.log(`   📈 Records count: ${Array.isArray(data) ? data.length : 'N/A'}`);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`   🔍 Sample record keys:`, Object.keys(data[0]));
                        console.log(`   📄 First record:`, JSON.stringify(data[0], null, 2));
                    } else if (Array.isArray(data) && data.length === 0) {
                        console.log(`   ⚠️  Empty array returned`);
                    } else {
                        console.log(`   📄 Response:`, JSON.stringify(data, null, 2));
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`   ❌ Status: ${response.status}`);
                    console.log(`   ❌ Error: ${errorText}`);
                }
            } catch (error) {
                console.log(`   ❌ Network Error: ${error.message}`);
            }
        }

        // Test filtered data scenarios
        console.log('\n🔍 Testing filtered data scenarios...');
        
        // Test active users filter
        try {
            const usersResponse = await fetch(`${BASE_URL}/api/user/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                const activeUsers = users.filter(user => user.status === 1);
                console.log(`   👥 Total users: ${users.length}`);
                console.log(`   ✅ Active users: ${activeUsers.length}`);
                if (users.length > 0) {
                    console.log(`   📊 User status values:`, users.map(u => ({ id: u.id, name: u.name, status: u.status })));
                }
            }
        } catch (error) {
            console.log(`   ❌ Active users filter error: ${error.message}`);
        }

        // Test active subscriptions filter
        try {
            const subsResponse = await fetch(`${BASE_URL}/api/admin-panel/subscriptions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (subsResponse.ok) {
                const subscriptions = await subsResponse.json();
                const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
                console.log(`   📦 Total subscriptions: ${subscriptions.length}`);
                console.log(`   ✅ Active subscriptions: ${activeSubscriptions.length}`);
                if (subscriptions.length > 0) {
                    console.log(`   📊 Subscription status values:`, subscriptions.map(s => ({ id: s.id, status: s.status })));
                }
            }
        } catch (error) {
            console.log(`   ❌ Active subscriptions filter error: ${error.message}`);
        }

        // Test weekly quotes filter
        try {
            const quotesResponse = await fetch(`${BASE_URL}/api/admin-panel/quotes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (quotesResponse.ok) {
                const quotes = await quotesResponse.json();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const weeklyQuotes = quotes.filter(quote => new Date(quote.created_at) >= oneWeekAgo);
                console.log(`   📋 Total quotes: ${quotes.length}`);
                console.log(`   📅 Weekly quotes: ${weeklyQuotes.length}`);
                if (quotes.length > 0) {
                    console.log(`   📊 Quote dates:`, quotes.map(q => ({ id: q.id, created_at: q.created_at })));
                }
            }
        } catch (error) {
            console.log(`   ❌ Weekly quotes filter error: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugModalEndpoints();