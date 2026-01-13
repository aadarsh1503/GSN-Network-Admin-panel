// Test the admin subscriptions API after the fix
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAdminSubscriptionsAPI() {
    try {
        console.log('🧪 Testing Admin Subscriptions API...\n');
        
        // First login as admin
        console.log('🔐 Logging in as admin...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@admin.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');
        
        // Test subscriptions endpoint
        console.log('\n📊 Fetching subscriptions...');
        const subsResponse = await fetch(`${BASE_URL}/api/admin-panel/subscriptions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!subsResponse.ok) {
            throw new Error(`Subscriptions fetch failed: ${subsResponse.status}`);
        }
        
        const subscriptions = await subsResponse.json();
        console.log(`✅ Found ${subscriptions.length} subscriptions`);
        
        // Display subscription details
        console.log('\n📋 Subscription Details:');
        subscriptions.forEach((sub, index) => {
            console.log(`${index + 1}. ${sub.user_name} (${sub.user_email})`);
            console.log(`   Plan: ${sub.plan_name} - $${sub.amount_paid}`);
            console.log(`   Status: ${sub.status} | Payment: ${sub.payment_status}`);
            console.log(`   Period: ${new Date(sub.start_date).toLocaleDateString()} - ${new Date(sub.end_date).toLocaleDateString()}`);
            console.log('');
        });
        
        // Check if any Guest plans are showing
        const guestPlans = subscriptions.filter(sub => sub.plan_name === 'Guest' || parseFloat(sub.amount_paid) === 0);
        if (guestPlans.length > 0) {
            console.log('⚠️ WARNING: Still showing Guest plans:');
            guestPlans.forEach(sub => {
                console.log(`  - ${sub.user_email}: ${sub.plan_name} ($${sub.amount_paid})`);
            });
        } else {
            console.log('✅ No Guest plans showing - fix successful!');
        }
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAdminSubscriptionsAPI();