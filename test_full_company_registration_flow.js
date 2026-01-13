// Test full company registration and activation flow
const API_BASE = 'http://localhost:5000/api';

async function testFullCompanyFlow() {
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
        
        console.log('🗑️ Step 2: Delete existing company if exists...');
        
        // Get all users to find the company
        const usersResponse = await fetch(`${API_BASE}/user/companies`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const users = await usersResponse.json();
        const existingCompany = users.find(u => u.email === 'parvandersingh67@gmail.com');
        
        if (existingCompany) {
            console.log(`🗑️ Found existing company (ID: ${existingCompany.id}), deleting...`);
            
            const deleteResponse = await fetch(`${API_BASE}/admin-panel/users/${existingCompany.id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Testing company registration flow' })
            });
            
            if (deleteResponse.ok) {
                console.log('✅ Existing company deleted successfully');
            } else {
                const deleteError = await deleteResponse.json();
                console.log('⚠️ Delete failed (might not exist):', deleteError.message);
            }
        } else {
            console.log('ℹ️ No existing company found with that email');
        }
        
        console.log('👤 Step 3: Register new company...');
        
        // Register new company
        const registerResponse = await fetch(`${API_BASE}/user/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Company Pvt Ltd',
                email: 'parvandersingh67@gmail.com',
                phone: '9876543210',
                password: '222333',
                role: 'company',
                category: 'Freight Forwarding',
                country: 'India'
            })
        });
        
        const registerData = await registerResponse.json();
        
        if (!registerResponse.ok) {
            console.error('❌ Company registration failed:', registerData.message);
            return;
        }
        
        console.log('✅ Company registered successfully:', registerData.message);
        console.log('📋 Company details:', {
            id: registerData.user?.id,
            name: registerData.user?.name,
            email: registerData.user?.email,
            status: registerData.accountStatus
        });
        
        if (registerData.accountStatus === 'pending_approval') {
            console.log('⏳ Company is pending approval as expected');
            
            // Wait a moment for registration emails to process
            console.log('⏳ Waiting for registration emails to process...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('🚀 Step 4: Activate company from admin...');
            
            // Get the new company ID
            const newUsersResponse = await fetch(`${API_BASE}/user/companies`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            const newUsers = await newUsersResponse.json();
            const newCompany = newUsers.find(u => u.email === 'parvandersingh67@gmail.com');
            
            if (!newCompany) {
                console.error('❌ Could not find newly registered company');
                return;
            }
            
            console.log('🎯 Found new company:', {
                id: newCompany.id,
                name: newCompany.name,
                email: newCompany.email,
                status: newCompany.status
            });
            
            // Activate the company
            const activationResponse = await fetch(`${API_BASE}/admin-panel/users/${newCompany.id}/activate`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    reason: 'Test activation for email verification' 
                })
            });
            
            const activationData = await activationResponse.json();
            
            if (activationResponse.ok) {
                console.log('✅ Company activation successful:', activationData.message);
                console.log('📧 Check server logs and emails for activation notifications...');
                
                // Check email queue status
                setTimeout(async () => {
                    console.log('📊 Step 5: Check email queue status...');
                    
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
        } else {
            console.log('⚠️ Company was activated immediately, not pending approval');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run the test
testFullCompanyFlow();