// Test active users filter
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testActiveUsersFilter() {
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

        // Get all users
        const usersResponse = await fetch(`${BASE_URL}/api/user/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const users = await usersResponse.json();
        console.log('\n👥 All users:');
        users.forEach(user => {
            console.log(`   ID: ${user.id}, Name: ${user.name}, Status: ${user.status} (${typeof user.status})`);
        });
        
        // Test different filter conditions
        console.log('\n🔍 Testing filter conditions:');
        
        const filter1 = users.filter(user => user.status === 1);
        console.log(`   user.status === 1: ${filter1.length} users`);
        
        const filter2 = users.filter(user => user.status === true);
        console.log(`   user.status === true: ${filter2.length} users`);
        
        const filter3 = users.filter(user => user.status === 1 || user.status === true);
        console.log(`   user.status === 1 || user.status === true: ${filter3.length} users`);
        
        const filter4 = users.filter(user => Boolean(user.status));
        console.log(`   Boolean(user.status): ${filter4.length} users`);
        
        console.log('\n✅ Active users should be:', filter3.length);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testActiveUsersFilter();