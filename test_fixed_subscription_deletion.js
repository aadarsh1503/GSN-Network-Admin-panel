// Test the fixed subscription deletion
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testFixedSubscriptionDeletion() {
    try {
        console.log('🧪 Testing fixed subscription deletion...\n');
        
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
        
        // Test deleting subscription ID 33
        console.log('\n🗑️ Attempting to delete subscription ID 33...');
        const deleteResponse = await fetch(`${BASE_URL}/api/admin-panel/subscriptions/33`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(`Deletion failed: ${deleteResponse.status} - ${errorData.message}`);
        }
        
        const deleteData = await deleteResponse.json();
        console.log('✅ Subscription deletion successful');
        console.log('Response:', deleteData);
        
        // Verify the subscription is gone
        console.log('\n🔍 Verifying deletion...');
        const subsResponse = await fetch(`${BASE_URL}/api/admin-panel/subscriptions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!subsResponse.ok) {
            throw new Error(`Failed to fetch subscriptions: ${subsResponse.status}`);
        }
        
        const subscriptions = await subsResponse.json();
        const subscription33 = subscriptions.find(sub => sub.id === 33);
        
        if (subscription33) {
            console.log('❌ Subscription 33 still exists');
        } else {
            console.log('✅ Subscription 33 successfully deleted');
        }
        
        console.log(`📊 Current subscriptions: ${subscriptions.length}`);
        subscriptions.forEach(sub => {
            console.log(`  - ID: ${sub.id}, User: ${sub.user_email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
        });
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFixedSubscriptionDeletion();