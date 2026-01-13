// Debug script to test user profile logo backend functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testUserProfileLogo() {
    console.log('🔍 Testing User Profile Logo Backend...\n');
    
    let token = '';
    let userId = '';
    
    try {
        // Step 1: Login
        console.log('1️⃣ Testing Login...');
        const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'user@example.com',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
            token = loginData.token;
            userId = loginData.user.id;
            console.log(`✅ Login successful! User ID: ${userId}`);
        } else {
            console.log(`❌ Login failed: ${loginData.message}`);
            return;
        }
        
        // Step 2: Get current profile
        console.log('\n2️⃣ Testing Get Profile...');
        const profileResponse = await fetch(`${BASE_URL}/api/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const profileData = await profileResponse.json();
        
        if (profileResponse.ok) {
            console.log('✅ Profile retrieved successfully!');
            console.log('📊 Current profile data:');
            console.log(JSON.stringify(profileData.user, null, 2));
            console.log(`🖼️ Current logo: ${profileData.user.logo || 'null'}`);
        } else {
            console.log(`❌ Failed to get profile: ${profileData.message}`);
            return;
        }
        
        // Step 3: Test profile update with logo
        console.log('\n3️⃣ Testing Profile Update with Logo...');
        const testLogoUrl = 'https://example.com/test-logo.jpg';
        
        const updateData = {
            name: profileData.user.name,
            email: profileData.user.email,
            phone: profileData.user.phone,
            country: profileData.user.country,
            logo: testLogoUrl
        };
        
        console.log('📤 Sending update data:');
        console.log(JSON.stringify(updateData, null, 2));
        
        const updateResponse = await fetch(`${BASE_URL}/api/user/update-profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResponse.ok) {
            console.log('✅ Profile update successful!');
            console.log(`📝 Response: ${updateResult.message}`);
        } else {
            console.log(`❌ Profile update failed: ${updateResult.message}`);
            return;
        }
        
        // Step 4: Verify the update
        console.log('\n4️⃣ Verifying Profile Update...');
        const verifyResponse = await fetch(`${BASE_URL}/api/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok) {
            console.log('✅ Profile verification successful!');
            console.log('📊 Updated profile data:');
            console.log(JSON.stringify(verifyData.user, null, 2));
            console.log(`🖼️ Updated logo: ${verifyData.user.logo || 'null'}`);
            
            if (verifyData.user.logo === testLogoUrl) {
                console.log('🎉 SUCCESS: Logo was saved and retrieved correctly!');
            } else {
                console.log('❌ FAILURE: Logo was not saved correctly!');
                console.log(`Expected: ${testLogoUrl}`);
                console.log(`Got: ${verifyData.user.logo}`);
            }
        } else {
            console.log(`❌ Failed to verify profile: ${verifyData.message}`);
        }
        
        // Step 5: Test direct database query (if we have access)
        console.log('\n5️⃣ Testing Direct Database Query...');
        console.log('(This would require database access - skipping for now)');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run the test
testUserProfileLogo();