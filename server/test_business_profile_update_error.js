// Test script to debug the 500 error when updating business profile
import fetch from 'node-fetch';

const testBusinessProfileUpdate = async () => {
    try {
        console.log('🔍 Testing Business Profile Update API...\n');

        // Step 1: Login to get token
        console.log('🔐 Step 1: Login as business user...');
        const loginResponse = await fetch('http://localhost:5000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'ksacargo@gvscargo.com',
                password: 'password123'
            })
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginData);
            return;
        }

        console.log('✅ Login successful');
        const token = loginData.token;

        // Step 2: Get current profile
        console.log('\n📋 Step 2: Get current profile...');
        const profileResponse = await fetch('http://localhost:5000/api/business/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const currentProfile = await profileResponse.json();
        
        if (!profileResponse.ok) {
            console.log('❌ Failed to get profile:', currentProfile);
            return;
        }

        console.log('✅ Current profile retrieved');
        console.log('Current profile data:', JSON.stringify(currentProfile, null, 2));

        // Step 3: Test update with minimal data
        console.log('\n🔄 Step 3: Test profile update...');
        
        const updateData = {
            name: currentProfile.name || 'Test Business',
            email: currentProfile.email,
            phone: currentProfile.phone || '+1234567890',
            category: 'Manufacturing,Trading', // Test comma-separated categories
            country: currentProfile.country || 'United States',
            state: currentProfile.state || 'California',
            city: currentProfile.city || 'Los Angeles',
            about_company: currentProfile.about_company || 'Test business description'
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updateResponse = await fetch('http://localhost:5000/api/business/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        console.log('Update response status:', updateResponse.status);
        console.log('Update response headers:', Object.fromEntries(updateResponse.headers));

        const updateResult = await updateResponse.text();
        console.log('Update response body:', updateResult);

        if (updateResponse.ok) {
            console.log('✅ Profile update successful');
        } else {
            console.log('❌ Profile update failed');
            
            // Try to parse as JSON
            try {
                const errorData = JSON.parse(updateResult);
                console.log('Error data:', errorData);
            } catch (e) {
                console.log('Raw error response:', updateResult);
            }
        }

        // Step 4: Test with full profile data (like frontend sends)
        console.log('\n🔄 Step 4: Test with full profile data...');
        
        const fullUpdateData = {
            ...currentProfile,
            category: 'Manufacturing,Trading',
            services: JSON.stringify(['Air Freight', 'Sea Freight']),
            about_company: 'Updated business description'
        };

        console.log('Full update data keys:', Object.keys(fullUpdateData));

        const fullUpdateResponse = await fetch('http://localhost:5000/api/business/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fullUpdateData)
        });

        console.log('Full update response status:', fullUpdateResponse.status);
        
        const fullUpdateResult = await fullUpdateResponse.text();
        console.log('Full update response:', fullUpdateResult);

        if (fullUpdateResponse.ok) {
            console.log('✅ Full profile update successful');
        } else {
            console.log('❌ Full profile update failed');
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
};

// Run the test
testBusinessProfileUpdate();