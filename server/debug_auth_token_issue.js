import db from './config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const debugAuthToken = async () => {
    console.log('🔍 Debugging Authentication Token Issue');
    console.log('============================================================');
    
    try {
        // Connect to database
        console.log('✅ MySQL Database connected successfully!');
        
        // Check if there are any company users
        const [companies] = await db.execute(`
            SELECT id, name, email, role, created_at 
            FROM users 
            WHERE role = 'company' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log(`\n📋 Found ${companies.length} company users:`);
        companies.forEach((company, index) => {
            console.log(`${index + 1}. ${company.name} (${company.email}) - ID: ${company.id}`);
        });
        
        if (companies.length > 0) {
            const testCompany = companies[0];
            console.log(`\n🧪 Testing token generation for: ${testCompany.email}`);
            
            // Generate a fresh token
            const token = jwt.sign(
                { 
                    id: testCompany.id, 
                    email: testCompany.email, 
                    role: testCompany.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('✅ Generated token:', token.substring(0, 50) + '...');
            
            // Verify the token
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('✅ Token verification successful');
                console.log('📋 Decoded payload:', {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    exp: new Date(decoded.exp * 1000).toISOString()
                });
                
                // Test API call with this token
                console.log('\n🔄 Testing API call with generated token...');
                
                const response = await fetch('http://localhost:5000/api/quotes/available', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`📊 API Response Status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ API call successful!');
                    console.log(`📋 Received ${data.quotes?.length || 0} quotes`);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.log('❌ API call failed:', errorData.message || 'Unknown error');
                }
                
            } catch (verifyError) {
                console.log('❌ Token verification failed:', verifyError.message);
            }
        }
        
        // Check localStorage simulation
        console.log('\n🔍 Checking browser localStorage simulation...');
        
        // Simulate what might be in localStorage
        const simulatedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoiYWFkYXJzaGNoYXVoYW4zNUBnbWFpbC5jb20iLCJyb2xlIjoiY29tcGFueSIsImlhdCI6MTczNTkxNzc5NCwiZXhwIjoxNzM2MDA0MTk0fQ.invalid_signature';
        
        try {
            const decoded = jwt.verify(simulatedToken, process.env.JWT_SECRET);
            console.log('✅ Simulated token is valid');
        } catch (error) {
            console.log('❌ Simulated token is invalid:', error.message);
            
            // Check if it's expired
            try {
                const payload = JSON.parse(atob(simulatedToken.split('.')[1]));
                const currentTime = Date.now() / 1000;
                const isExpired = payload.exp < currentTime;
                
                console.log('📋 Token details:');
                console.log('  - User ID:', payload.id);
                console.log('  - Email:', payload.email);
                console.log('  - Role:', payload.role);
                console.log('  - Issued at:', new Date(payload.iat * 1000).toISOString());
                console.log('  - Expires at:', new Date(payload.exp * 1000).toISOString());
                console.log('  - Is expired:', isExpired);
                
            } catch (parseError) {
                console.log('❌ Could not parse token payload');
            }
        }
        
    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        await db.end();
    }
};

debugAuthToken();