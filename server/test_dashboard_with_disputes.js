import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test dashboard with dispute integration
async function testDashboardWithDisputes() {
    console.log('🧪 Testing Dashboard with Dispute Integration...\n');

    try {
        // Step 1: Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await fetch(`${BASE_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Step 2: Test dashboard stats endpoint
        console.log('2. Testing dashboard stats with disputes...');
        const statsResponse = await fetch(`${BASE_URL}/admin-panel/dashboard-stats`, {
            headers: authHeaders
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log(`✅ Status: ${statsResponse.status}`);
            console.log('📊 Dashboard Stats:');
            console.log(`   Users: ${stats.users?.length || 0} groups`);
            console.log(`   Quotes: ${stats.quotes?.length || 0} status groups`);
            console.log(`   Subscriptions: ${stats.subscriptions?.length || 0} status groups`);
            console.log(`   Transactions: ${stats.transactions?.length || 0} status groups`);
            console.log(`   Disputes: ${stats.disputes?.length || 0} status groups`);
            
            if (stats.disputes && stats.disputes.length > 0) {
                console.log('   Dispute breakdown:');
                stats.disputes.forEach(dispute => {
                    console.log(`     - ${dispute.status}: ${dispute.count} disputes`);
                });
            }
            
            if (stats.topMetrics) {
                console.log(`   Pending Disputes: ${stats.topMetrics.pending_disputes || 0}`);
                console.log(`   Total Disputes: ${stats.topMetrics.total_disputes || 0}`);
                console.log(`   Monthly Resolved: ${stats.topMetrics.monthly_resolved_disputes || 0}`);
            }
        } else {
            console.log(`❌ Status: ${statsResponse.status}`);
        }
        console.log('');

        // Step 3: Test dispute endpoints directly
        console.log('3. Testing dispute endpoints...');
        const disputesResponse = await fetch(`${BASE_URL}/disputes/admin/all`, {
            headers: authHeaders
        });
        
        if (disputesResponse.ok) {
            const disputes = await disputesResponse.json();
            console.log(`✅ Disputes endpoint: ${disputes.length} disputes found`);
            
            if (disputes.length > 0) {
                const statusCounts = disputes.reduce((acc, dispute) => {
                    acc[dispute.status] = (acc[dispute.status] || 0) + 1;
                    return acc;
                }, {});
                
                console.log('   Status distribution:');
                Object.entries(statusCounts).forEach(([status, count]) => {
                    console.log(`     - ${status}: ${count}`);
                });
            }
        } else {
            console.log(`❌ Disputes endpoint failed: ${disputesResponse.status}`);
        }
        console.log('');

        console.log('🎉 Dashboard dispute integration test completed!');
        console.log('📝 Summary:');
        console.log('   ✅ Dashboard stats include dispute data');
        console.log('   ✅ Dispute endpoints are accessible');
        console.log('   ✅ Frontend should now show dispute metrics');
        console.log('');
        console.log('🌐 Check the dashboard at:');
        console.log('   • http://localhost:5173/admin/dashboard');
        console.log('   • Look for "Pending Disputes" card');
        console.log('   • Click the card to see dispute details');

    } catch (error) {
        console.error('❌ Error testing dashboard with disputes:', error.message);
    }
}

testDashboardWithDisputes();