import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test function to check business owners API
async function testBusinessOwnersAPI() {
    try {
        console.log('Testing Business Owners API endpoints...\n');

        // First, let's try to login as admin to get a token
        console.log('1. Attempting admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@example.com', // Replace with actual admin email
            password: 'admin123' // Replace with actual admin password
        });

        const token = loginResponse.data.token;
        console.log('✅ Admin login successful');

        // Set up headers for authenticated requests
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get business owners
        console.log('\n2. Testing GET /api/user/business-owners...');
        const businessOwnersResponse = await axios.get(`${BASE_URL}/api/user/business-owners`, { headers });
        console.log('✅ Business owners fetched successfully');
        console.log(`   Found ${businessOwnersResponse.data.length} business owners`);

        if (businessOwnersResponse.data.length > 0) {
            const firstUser = businessOwnersResponse.data[0];
            console.log(`   First user: ${firstUser.name} (${firstUser.email})`);

            // Test 2: Get user profile by ID
            console.log(`\n3. Testing GET /api/user/profile/${firstUser.id}...`);
            try {
                const profileResponse = await axios.get(`${BASE_URL}/api/user/profile/${firstUser.id}`, { headers });
                console.log('✅ User profile fetched successfully');
                console.log(`   Profile data keys: ${Object.keys(profileResponse.data).join(', ')}`);
            } catch (error) {
                console.log('❌ User profile fetch failed:', error.response?.data?.message || error.message);
            }

            // Test 3: Update user profile
            console.log(`\n4. Testing PUT /api/user/update-profile/${firstUser.id}...`);
            try {
                const updateData = {
                    name: firstUser.name,
                    email: firstUser.email,
                    mobile: firstUser.mobile || '1234567890',
                    category: 'Test Category',
                    country: 'Test Country',
                    state: 'Test State',
                    city: 'Test City',
                    owner_name: 'Test Owner',
                    owner_phone: '9876543210',
                    incharge_name: 'Test Incharge',
                    incharge_phone: '5555555555',
                    website: 'https://test.com',
                    skype: 'test.skype'
                };

                const updateResponse = await axios.put(`${BASE_URL}/api/user/update-profile/${firstUser.id}`, updateData, { headers });
                console.log('✅ User profile updated successfully');
                console.log(`   Response: ${updateResponse.data.message}`);
            } catch (error) {
                console.log('❌ User profile update failed:', error.response?.data?.message || error.message);
            }

            // Test 4: Update business status
            console.log(`\n5. Testing PUT /api/user/business-status/${firstUser.id}...`);
            try {
                const statusUpdateResponse = await axios.put(`${BASE_URL}/api/user/business-status/${firstUser.id}`, {
                    type: 'status',
                    value: firstUser.status
                }, { headers });
                console.log('✅ Business status updated successfully');
                console.log(`   Response: ${statusUpdateResponse.data.message}`);
            } catch (error) {
                console.log('❌ Business status update failed:', error.response?.data?.message || error.message);
            }
        } else {
            console.log('   No business owners found to test with');
        }

        console.log('\n✅ All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            console.log('   Please check admin credentials in the test script');
        }
    }
}

// Run the test
testBusinessOwnersAPI();