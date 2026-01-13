// Direct test of company activation API
const API_BASE = 'http://localhost:5000/api';

async function testCompanyActivation() {
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
        
        if (companies.length === 0) {
            console.log('⚠️ No companies found to test with');
            return;
        }
        
        // Find a company that's not active (status = 0 or false)
        const inactiveCompany = companies.find(c => !c.status);
        
        if (!inactiveCompany) {
            console.log('⚠️ No inactive companies found. Using first company for test...');
            var testCompany = companies[0];
        } else {
            var testCompany = inactiveCompany;
        }
        
        console.log('🎯 Testing with company:', {
            id: testCompany.id,
            name: testCompany.name,
            email: testCompany.email,
            status: testCompany.status
        });
        
        console.log('🚀 Step 3: Activate company...');
        
        // Activate company
        const activationResponse = await fetch(`${API_BASE}/admin-panel/users/${testCompany.id}/activate`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                reason: 'Test activation for email debugging' 
            })
        });
        
        const activationData = await activationResponse.json();
        
        if (activationResponse.ok) {
            console.log('✅ Company activation successful:', activationData.message);
            console.log('📧 Check server logs for email queue activity...');
            
            // Check email queue status
            setTimeout(async () => {
                console.log('📊 Step 4: Check email queue status...');
                
                const queueResponse = await fetch(`${API_BASE}/email-queue/status`, {
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                
                const queueData = await queueResponse.json();
                
                if (queueResponse.ok) {
                    console.log('📊 Email Queue Status:', queueData);
                } else {
                    console.error('❌ Failed to get queue status:', queueData.message);
                }
            }, 2000);
            
        } else {
            console.error('❌ Company activation failed:', activationData.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run the test
testCompanyActivation();