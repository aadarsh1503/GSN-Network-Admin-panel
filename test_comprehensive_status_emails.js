// Test comprehensive account status change emails
const API_BASE = 'http://localhost:5000/api';

async function testAllStatusChangeEmails() {
    try {
        console.log('🔐 Step 1: Login as admin...');
        
        // Login as admin
        const loginResponse = await fetch(`${API_BASE}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: 'admin@gmail.com', 
                password: 'admin123' 
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.error('❌ Admin login failed:', loginData.message);
            return;
        }
        
        const adminToken = loginData.token;
        console.log('✅ Admin login successful');
        
        console.log('👥 Step 2: Get company users...');
        
        // Get company users
        const companiesResponse = await fetch(`${API_BASE}/user/companies`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const companies = await companiesResponse.json();
        
        if (!companiesResponse.ok) {
            console.error('❌ Failed to get companies:', companies.message);
            return;
        }
        
        console.log(`📋 Found ${companies.length} companies`);
        
        // Find the test company
        const testCompany = companies.find(c => c.email === 'parvandersingh67@gmail.com');
        
        if (!testCompany) {
            console.log('⚠️ Test company not found. Using first company...');
            var targetCompany = companies[0];
        } else {
            var targetCompany = testCompany;
        }
        
        console.log('🎯 Testing with company:', {
            id: targetCompany.id,
            name: targetCompany.name,
            email: targetCompany.email,
            status: targetCompany.status
        });
        
        // Test 1: Deactivate Account
        console.log('\n🚀 Test 1: Deactivating account...');
        await testStatusChange(adminToken, targetCompany.id, 'status', false, 'Account Deactivation');
        
        await delay(3000); // Wait for emails to process
        
        // Test 2: Reactivate Account
        console.log('\n🚀 Test 2: Reactivating account...');
        await testStatusChange(adminToken, targetCompany.id, 'status', true, 'Account Activation');
        
        await delay(3000); // Wait for emails to process
        
        // Test 3: Blacklist Account
        console.log('\n🚀 Test 3: Blacklisting account...');
        await testStatusChange(adminToken, targetCompany.id, 'blacklist', true, 'Account Blacklist');
        
        await delay(3000); // Wait for emails to process
        
        // Test 4: Unblacklist Account
        console.log('\n🚀 Test 4: Removing from blacklist...');
        await testStatusChange(adminToken, targetCompany.id, 'blacklist', false, 'Account Restoration');
        
        console.log('\n✅ All tests completed! Check server logs and emails.');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

async function testStatusChange(adminToken, userId, type, value, testName) {
    try {
        const response = await fetch(`${API_BASE}/user/company-status/${userId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                type: type,
                value: value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ ${testName} successful:`, data.message);
            console.log('📧 Check server logs for email processing...');
        } else {
            console.error(`❌ ${testName} failed:`, data.message);
        }
        
    } catch (error) {
        console.error(`❌ ${testName} error:`, error.message);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the comprehensive test
testAllStatusChangeEmails();