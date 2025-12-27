// Test dashboard stats API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testDashboardStats() {
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

        // Test dashboard stats
        console.log('\n📊 Testing dashboard stats API...');
        const statsResponse = await fetch(`${BASE_URL}/api/admin-panel/dashboard-stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!statsResponse.ok) {
            const errorText = await statsResponse.text();
            throw new Error(`Dashboard stats failed: ${statsResponse.status} - ${errorText}`);
        }

        const stats = await statsResponse.json();
        console.log('✅ Dashboard stats received');
        
        // Show key metrics
        console.log('\n📈 Key Metrics:');
        console.log('Users:', JSON.stringify(stats.users, null, 2));
        console.log('Quotes:', JSON.stringify(stats.quotes, null, 2));
        console.log('Subscriptions:', JSON.stringify(stats.subscriptions, null, 2));
        console.log('Transactions:', JSON.stringify(stats.transactions, null, 2));
        
        console.log('\n🎯 Top Metrics:');
        console.log(JSON.stringify(stats.topMetrics, null, 2));
        
        console.log('\n📅 Monthly Revenue:');
        console.log(JSON.stringify(stats.monthlyRevenue, null, 2));
        
        console.log('\n👥 Monthly User Growth:');
        console.log(JSON.stringify(stats.monthlyUserGrowth, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDashboardStats();