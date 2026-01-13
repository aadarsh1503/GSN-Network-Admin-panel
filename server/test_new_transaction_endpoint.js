import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testNewTransactionEndpoint() {
    try {
        console.log('🔐 Testing admin login...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');

        // Test the new accepted-quote-transactions endpoint
        console.log('\n🧪 Testing /api/admin-panel/accepted-quote-transactions');
        const newEndpointResponse = await fetch(`${BASE_URL}/api/admin-panel/accepted-quote-transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`Status: ${newEndpointResponse.status}`);
        
        if (newEndpointResponse.ok) {
            const data = await newEndpointResponse.json();
            console.log(`✅ Found ${data.length} accepted quote transactions`);
            
            if (data.length > 0) {
                console.log('\n📋 Sample transaction:');
                console.log(`  ID: ${data[0].id}`);
                console.log(`  User: ${data[0].user_name} (${data[0].user_email})`);
                console.log(`  Company: ${data[0].company_name} (${data[0].company_email})`);
                console.log(`  Quote ID: ${data[0].quote_id}`);
                console.log(`  Product: ${data[0].product_description}`);
                console.log(`  Amount: $${data[0].amount}`);
                console.log(`  Reference: ${data[0].transaction_reference}`);
                console.log(`  Status: ${data[0].status}`);
                console.log(`  Date: ${data[0].created_at}`);
            }
        } else {
            const errorText = await newEndpointResponse.text();
            console.log(`❌ Error: ${errorText}`);
        }

        // Test dashboard stats
        console.log('\n📊 Testing dashboard stats...');
        const statsResponse = await fetch(`${BASE_URL}/api/admin-panel/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Dashboard stats received');
            console.log(`  Transaction stats: ${JSON.stringify(stats.transactions)}`);
            console.log(`  Monthly transactions: ${stats.topMetrics?.monthly_transactions || 0}`);
            console.log(`  Avg transaction value: $${stats.topMetrics?.avg_transaction_value || 0}`);
        } else {
            console.log('❌ Dashboard stats failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testNewTransactionEndpoint();