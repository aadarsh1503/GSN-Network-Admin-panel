// Test the frontend activation flow using the same API endpoint
const API_BASE = 'http://localhost:5000/api';

async function testFrontendActivationFlow() {
    try {
        console.log('🔐 Step 1: Login as admin...');
        
        // Login as admin (same as frontend)
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
        
        // Get company users (same as frontend)
        const companiesResponse = await fetch(`${API_BASE}/user/companies`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const companies = await companiesResponse.json();
        
        if (!companiesResponse.ok) {
            console.error('❌ Failed to get companies:', companies.message);
            return;
        }
        
        console.log(`📋 Found ${companies.length} companies`);
        
        // Find the test company we created
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
        
        console.log('🚀 Step 3: Activate company using FRONTEND API...');
        
        // Use the SAME API endpoint that frontend uses
        const activationResponse = await fetch(`${API_BASE}/user/company-status/${targetCompany.id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                type: 'status',
                value: true  // Activate the company
            })
        });
        
        const activationData = await activationResponse.json();
        
        if (activationResponse.ok) {
            console.log('✅ Company activation successful (via frontend API):', activationData.message);
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
testFrontendActivationFlow();