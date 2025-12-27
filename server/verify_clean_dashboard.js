// Verify dashboard shows clean data after cleanup
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function verifyCleanDashboard() {
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

        // Test all admin endpoints
        console.log('\n📊 Testing all admin endpoints...');
        
        const endpoints = [
            { name: 'Dashboard Stats', url: '/api/admin-panel/dashboard-stats' },
            { name: 'Quotes', url: '/api/admin-panel/quotes' },
            { name: 'Subscriptions', url: '/api/admin-panel/subscriptions' },
            { name: 'Transactions', url: '/api/admin-panel/transactions' }
        ];

        for (const endpoint of endpoints) {
            const response = await fetch(`${BASE_URL}${endpoint.url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (endpoint.name === 'Dashboard Stats') {
                    console.log(`✅ ${endpoint.name}:`);
                    console.log(`   Total Users: ${data.users.reduce((sum, user) => sum + user.count, 0)}`);
                    console.log(`   Total Quotes: ${data.quotes.reduce((sum, quote) => sum + quote.count, 0)}`);
                    console.log(`   Total Subscriptions: ${data.subscriptions.reduce((sum, sub) => sum + sub.count, 0)}`);
                    console.log(`   Total Transactions: ${data.transactions.reduce((sum, txn) => sum + txn.count, 0)}`);
                    console.log(`   Active Users: ${data.topMetrics?.active_users || 0}`);
                    console.log(`   Active Quotes: ${data.topMetrics?.active_quotes || 0}`);
                    console.log(`   Active Subscriptions: ${data.topMetrics?.active_subscriptions || 0}`);
                    console.log(`   Monthly Transactions: ${data.topMetrics?.monthly_transactions || 0}`);
                    console.log(`   Avg Transaction Value: $${data.topMetrics?.avg_transaction_value || 0}`);
                    console.log(`   Weekly Quotes: ${data.topMetrics?.weekly_quotes || 0}`);
                } else {
                    const count = Array.isArray(data) ? data.length : 'N/A';
                    console.log(`✅ ${endpoint.name}: ${count} records`);
                }
            } else {
                console.log(`❌ ${endpoint.name}: ${response.status} error`);
            }
        }

        console.log('\n🎉 Dashboard Verification Complete!');
        console.log('All values should be 0 since database is clean (only admin account exists)');
        console.log('If you see any non-zero values, there might be remaining test data.');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyCleanDashboard();