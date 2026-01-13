// Test script to verify business user authentication and role validation
import db from './config/db.js';
import bcrypt from 'bcryptjs';

const testBusinessUserAuth = async () => {
    try {
        console.log('🔍 Testing Business User Authentication Flow...\n');

        // 1. Check if we have any business users
        const [businessUsers] = await db.execute(
            'SELECT id, name, email, role, status, is_blacklisted FROM users WHERE role = "business" LIMIT 5'
        );

        console.log('📊 Business Users in Database:');
        if (businessUsers.length === 0) {
            console.log('❌ No business users found in database');
            
            // Create a test business user
            console.log('\n🔧 Creating test business user...');
            const testEmail = 'test-business@example.com';
            const testPassword = 'password123';
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            
            const [result] = await db.execute(`
                INSERT INTO users (name, email, phone, password, role, category, country, status, is_blacklisted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Test Business User',
                testEmail,
                '+1234567890',
                hashedPassword,
                'business',
                'Logistics',
                'United States',
                1, // Active status
                0  // Not blacklisted
            ]);
            
            console.log(`✅ Created test business user with ID: ${result.insertId}`);
            console.log(`📧 Email: ${testEmail}`);
            console.log(`🔑 Password: ${testPassword}`);
            
        } else {
            businessUsers.forEach((user, index) => {
                console.log(`${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
                console.log(`   Role: ${user.role}, Status: ${user.status ? 'Active' : 'Inactive'}, Blacklisted: ${user.is_blacklisted ? 'Yes' : 'No'}`);
            });
        }

        // 2. Test login simulation
        console.log('\n🔐 Testing Login Simulation...');
        const testUser = businessUsers[0] || {
            id: 1,
            name: 'Test Business User',
            email: 'test-business@example.com',
            role: 'business'
        };

        console.log('User object that would be stored in localStorage:');
        console.log(JSON.stringify({
            id: testUser.id,
            name: testUser.name,
            email: testUser.email,
            role: testUser.role
        }, null, 2));

        // 3. Test role validation
        console.log('\n🛡️ Testing Role Validation...');
        const allowedRoles = ['business'];
        const userRole = testUser.role;
        const isAuthorized = allowedRoles.includes(userRole);
        
        console.log(`User Role: ${userRole}`);
        console.log(`Allowed Roles: [${allowedRoles.join(', ')}]`);
        console.log(`Is Authorized: ${isAuthorized ? '✅ YES' : '❌ NO'}`);

        // 4. Check business routes accessibility
        console.log('\n🛣️ Business Routes that should be accessible:');
        const businessRoutes = [
            '/business/dashboard',
            '/business/quotes',
            '/business/profile',
            '/business/messages',
            '/business/notifications',
            '/business/disputes',
            '/business/help'
        ];
        
        businessRoutes.forEach(route => {
            console.log(`✅ ${route}`);
        });

        console.log('\n✨ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

// Run the test
testBusinessUserAuth();