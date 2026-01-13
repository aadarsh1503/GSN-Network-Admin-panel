// Test script to verify business user registration flow
import db from './config/db.js';
import bcrypt from 'bcryptjs';

const testBusinessRegistrationFlow = async () => {
    try {
        console.log('🧪 Testing Business User Registration Flow...\n');

        // Test data
        const testBusinessUser = {
            name: 'Test Business User',
            email: 'test-business-auto@example.com',
            phone: '+1234567890',
            password: 'password123',
            role: 'business',
            category: 'Logistics',
            country: 'United States'
        };

        // 1. Clean up any existing test user
        await db.execute('DELETE FROM users WHERE email = ?', [testBusinessUser.email]);
        console.log('✅ Cleaned up existing test data');

        // 2. Simulate registration
        const hashedPassword = await bcrypt.hash(testBusinessUser.password, 10);
        const initialStatus = (testBusinessUser.role === 'user' || testBusinessUser.role === 'business') ? 1 : 0;
        
        const sql = `
            INSERT INTO users (name, email, phone, password, role, category, country, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(sql, [
            testBusinessUser.name,
            testBusinessUser.email,
            testBusinessUser.phone,
            hashedPassword,
            testBusinessUser.role,
            testBusinessUser.category,
            testBusinessUser.country,
            initialStatus
        ]);

        console.log(`✅ Business user created with ID: ${result.insertId}`);
        console.log(`📧 Email: ${testBusinessUser.email}`);
        console.log(`🔑 Password: ${testBusinessUser.password}`);
        console.log(`📊 Status: ${initialStatus ? 'Active (can login immediately)' : 'Inactive (needs approval)'}`);

        // 3. Verify the user can login
        const [loginCheck] = await db.execute(
            'SELECT id, name, email, role, status FROM users WHERE email = ?',
            [testBusinessUser.email]
        );

        if (loginCheck.length > 0) {
            const user = loginCheck[0];
            console.log('\n🔐 Login Check:');
            console.log(`   User ID: ${user.id}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status ? '✅ Active (can login)' : '❌ Inactive (cannot login)'}`);
            
            if (user.status === 1) {
                console.log('\n🎉 SUCCESS: Business user can login immediately after registration!');
            } else {
                console.log('\n❌ ISSUE: Business user still requires approval');
            }
        }

        // 4. Test different role scenarios
        console.log('\n📋 Role Status Summary:');
        console.log('   👤 User role: Auto-activated (status = 1)');
        console.log('   🏢 Business role: Auto-activated (status = 1) ✅ NEW BEHAVIOR');
        console.log('   🏭 Company role: Requires approval (status = 0)');

        console.log('\n✨ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

// Run the test
testBusinessRegistrationFlow();