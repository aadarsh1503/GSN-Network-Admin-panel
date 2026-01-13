// Test script to check user logo in database directly
import db from './server/config/db.js';

async function testUserLogoDatabase() {
    console.log('🔍 Testing User Logo Database Operations...\n');
    
    try {
        // Step 1: Check current user table structure
        console.log('1️⃣ Checking user table structure...');
        const [columns] = await db.execute('DESCRIBE users');
        console.log('📊 User table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        const logoColumn = columns.find(col => col.Field === 'logo');
        if (logoColumn) {
            console.log(`✅ Logo column exists: ${logoColumn.Type}`);
        } else {
            console.log('❌ Logo column does not exist!');
            return;
        }
        
        // Step 2: Check if we have any test users
        console.log('\n2️⃣ Checking for test users...');
        const [users] = await db.execute('SELECT id, name, email, logo FROM users WHERE role = "user" LIMIT 5');
        console.log(`📊 Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Logo: ${user.logo || 'null'}`);
        });
        
        if (users.length === 0) {
            console.log('❌ No users found for testing');
            return;
        }
        
        const testUser = users[0];
        console.log(`\n🎯 Using test user: ${testUser.name} (ID: ${testUser.id})`);
        
        // Step 3: Test direct logo update
        console.log('\n3️⃣ Testing direct logo update...');
        const testLogoUrl = 'https://example.com/test-logo-direct.jpg';
        
        const [updateResult] = await db.execute(
            'UPDATE users SET logo = ? WHERE id = ?',
            [testLogoUrl, testUser.id]
        );
        
        console.log(`📝 Update result: ${updateResult.affectedRows} rows affected`);
        
        // Step 4: Verify the update
        console.log('\n4️⃣ Verifying direct update...');
        const [updatedUser] = await db.execute(
            'SELECT id, name, email, logo FROM users WHERE id = ?',
            [testUser.id]
        );
        
        if (updatedUser.length > 0) {
            const user = updatedUser[0];
            console.log('✅ User found after update:');
            console.log(`  - ID: ${user.id}`);
            console.log(`  - Name: ${user.name}`);
            console.log(`  - Email: ${user.email}`);
            console.log(`  - Logo: ${user.logo || 'null'}`);
            
            if (user.logo === testLogoUrl) {
                console.log('🎉 SUCCESS: Direct database update works!');
            } else {
                console.log('❌ FAILURE: Direct database update failed!');
                console.log(`Expected: ${testLogoUrl}`);
                console.log(`Got: ${user.logo}`);
            }
        } else {
            console.log('❌ User not found after update');
        }
        
        // Step 5: Test the updateUserProfile function logic
        console.log('\n5️⃣ Testing updateUserProfile function logic...');
        
        const testData = {
            name: testUser.name,
            email: testUser.email,
            phone: 'test-phone',
            country: 'test-country',
            logo: 'https://example.com/test-logo-function.jpg'
        };
        
        // Simulate the updateUserProfile function
        const sanitizeValue = (value) => value === undefined ? null : value;
        
        const sql = `
            UPDATE users SET 
                name = ?, email = ?, phone = ?, country = ?, logo = ?
            WHERE id = ?
        `;
        
        const values = [
            sanitizeValue(testData.name),
            sanitizeValue(testData.email), 
            sanitizeValue(testData.phone),
            sanitizeValue(testData.country),
            sanitizeValue(testData.logo),
            testUser.id
        ];
        
        console.log('📤 Executing SQL:');
        console.log(sql);
        console.log('📤 With values:');
        console.log(values);
        
        const [functionResult] = await db.execute(sql, values);
        console.log(`📝 Function simulation result: ${functionResult.affectedRows} rows affected`);
        
        // Step 6: Final verification
        console.log('\n6️⃣ Final verification...');
        const [finalUser] = await db.execute(
            'SELECT id, name, email, phone, country, logo FROM users WHERE id = ?',
            [testUser.id]
        );
        
        if (finalUser.length > 0) {
            const user = finalUser[0];
            console.log('✅ Final user state:');
            console.log(JSON.stringify(user, null, 2));
            
            if (user.logo === testData.logo) {
                console.log('🎉 SUCCESS: Function simulation works!');
            } else {
                console.log('❌ FAILURE: Function simulation failed!');
                console.log(`Expected: ${testData.logo}`);
                console.log(`Got: ${user.logo}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Database test error:', error);
    } finally {
        await db.end();
    }
}

// Run the test
testUserLogoDatabase();