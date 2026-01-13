// Test business dashboard API endpoints
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test business login and dashboard
async function testBusinessDashboard() {
    try {
        console.log('Testing Business Dashboard API...\n');

        // 1. Login as business user
        console.log('1. Testing business login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: 'ksacargo@gvscargo.com', // Using existing business user
            password: 'test123' // Updated password
        });

        if (loginResponse.data.token) {
            console.log('✅ Business login successful');
            const token = loginResponse.data.token;
            
            // Set up headers for authenticated requests
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // 2. Test dashboard stats
            console.log('\n2. Testing dashboard stats...');
            try {
                const statsResponse = await axios.get(`${BASE_URL}/api/business/dashboard-stats`, { headers });
                console.log('✅ Dashboard stats retrieved successfully');
                console.log('   Stats:', JSON.stringify(statsResponse.data, null, 2));
            } catch (error) {
                console.log('❌ Dashboard stats failed:', error.response?.data?.message || error.message);
            }

            // 3. Test business quotes
            console.log('\n3. Testing business quotes...');
            try {
                const quotesResponse = await axios.get(`${BASE_URL}/api/business/quotes`, { headers });
                console.log('✅ Business quotes retrieved successfully');
                console.log('   Found', quotesResponse.data.length, 'quotes');
            } catch (error) {
                console.log('❌ Business quotes failed:', error.response?.data?.message || error.message);
            }

            // 4. Test business profile
            console.log('\n4. Testing business profile...');
            try {
                const profileResponse = await axios.get(`${BASE_URL}/api/business/profile`, { headers });
                console.log('✅ Business profile retrieved successfully');
                console.log('   Business name:', profileResponse.data.name);
            } catch (error) {
                console.log('❌ Business profile failed:', error.response?.data?.message || error.message);
            }

            // 5. Test business notifications
            console.log('\n5. Testing business notifications...');
            try {
                const notificationsResponse = await axios.get(`${BASE_URL}/api/business/notifications`, { headers });
                console.log('✅ Business notifications retrieved successfully');
                console.log('   Found', notificationsResponse.data.length, 'notifications');
            } catch (error) {
                console.log('❌ Business notifications failed:', error.response?.data?.message || error.message);
            }

            // 6. Test business messages
            console.log('\n6. Testing business messages...');
            try {
                const messagesResponse = await axios.get(`${BASE_URL}/api/business/messages`, { headers });
                console.log('✅ Business messages retrieved successfully');
                console.log('   Found', messagesResponse.data.length, 'messages');
            } catch (error) {
                console.log('❌ Business messages failed:', error.response?.data?.message || error.message);
            }

            // 7. Test business disputes
            console.log('\n7. Testing business disputes...');
            try {
                const disputesResponse = await axios.get(`${BASE_URL}/api/business/disputes`, { headers });
                console.log('✅ Business disputes retrieved successfully');
                console.log('   Found', disputesResponse.data.length, 'disputes');
            } catch (error) {
                console.log('❌ Business disputes failed:', error.response?.data?.message || error.message);
            }

            // 8. Test business help
            console.log('\n8. Testing business help...');
            try {
                const helpResponse = await axios.get(`${BASE_URL}/api/business/help`, { headers });
                console.log('✅ Business help retrieved successfully');
                console.log('   FAQs available:', helpResponse.data.faqs?.length || 0);
            } catch (error) {
                console.log('❌ Business help failed:', error.response?.data?.message || error.message);
            }

        } else {
            console.log('❌ Business login failed - no token received');
        }

    } catch (error) {
        console.log('❌ Business login failed:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ Business Dashboard API test completed!');
}

// Run the test
testBusinessDashboard();