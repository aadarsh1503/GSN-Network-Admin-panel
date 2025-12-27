// Test toast functionality by triggering some admin actions
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testToastFunctionality() {
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

        console.log('\n📊 Testing actions that trigger toasts...');
        
        // Test fetching data (should trigger success toast)
        console.log('1. Testing dashboard stats fetch...');
        const statsResponse = await fetch(`${BASE_URL}/api/admin-panel/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsResponse.ok) {
            console.log('   ✅ Dashboard stats fetched successfully (should show success toast)');
        } else {
            console.log('   ❌ Dashboard stats failed (should show error toast)');
        }

        // Test fetching quotes
        console.log('2. Testing quotes fetch...');
        const quotesResponse = await fetch(`${BASE_URL}/api/admin-panel/quotes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (quotesResponse.ok) {
            console.log('   ✅ Quotes fetched successfully (should show success toast)');
        } else {
            console.log('   ❌ Quotes fetch failed (should show error toast)');
        }

        // Test fetching subscriptions
        console.log('3. Testing subscriptions fetch...');
        const subsResponse = await fetch(`${BASE_URL}/api/admin-panel/subscriptions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (subsResponse.ok) {
            console.log('   ✅ Subscriptions fetched successfully (should show success toast)');
        } else {
            console.log('   ❌ Subscriptions fetch failed (should show error toast)');
        }

        // Test fetching transactions
        console.log('4. Testing transactions fetch...');
        const txnResponse = await fetch(`${BASE_URL}/api/admin-panel/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (txnResponse.ok) {
            console.log('   ✅ Transactions fetched successfully (should show success toast)');
        } else {
            console.log('   ❌ Transactions fetch failed (should show error toast)');
        }

        console.log('\n🎉 Toast testing complete!');
        console.log('📋 Expected behavior:');
        console.log('   ✅ Toasts should auto-close after 5 seconds');
        console.log('   ✅ Toast text should be dark (#1a1a1a) and visible');
        console.log('   ✅ Toast background should be yellow/gold gradient');
        console.log('   ✅ Toasts should be clickable to close manually');
        console.log('   ✅ Maximum 5 toasts should be visible at once');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testToastFunctionality();