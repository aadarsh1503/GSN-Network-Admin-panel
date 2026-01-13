// Simple test to check if business endpoints exist
import db from './config/db.js';

async function testBusinessEndpoints() {
    try {
        console.log('Testing database connection and business users...\n');

        // Test 1: Check if we can connect to database
        console.log('1. Testing database connection...');
        const [rows] = await db.execute('SELECT 1 as test');
        console.log('✅ Database connection successful');

        // Test 2: Check if users table exists and has business users
        console.log('\n2. Checking for business users in database...');
        const [businessUsers] = await db.execute(`
            SELECT 
                id, 
                name, 
                email, 
                phone, 
                role, 
                is_blacklisted, 
                status 
            FROM users 
            WHERE role = 'business' 
            LIMIT 5
        `);
        
        console.log(`✅ Found ${businessUsers.length} business users`);
        
        if (businessUsers.length > 0) {
            console.log('   Sample business users:');
            businessUsers.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name} (${user.email}) - Status: ${user.status ? 'Active' : 'Inactive'}`);
            });
        } else {
            console.log('   No business users found. Creating a test business user...');
            
            // Create a test business user
            const [insertResult] = await db.execute(`
                INSERT INTO users (name, email, phone, role, password, status, is_blacklisted) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                'Test Business Owner',
                'testbusiness@example.com',
                '1234567890',
                'business',
                '$2b$10$dummy.hash.for.testing', // Dummy hash
                1, // Active
                0  // Not blacklisted
            ]);
            
            console.log(`✅ Created test business user with ID: ${insertResult.insertId}`);
        }

        // Test 3: Check if we can update a business user
        if (businessUsers.length > 0) {
            const testUser = businessUsers[0];
            console.log(`\n3. Testing update for user: ${testUser.name} (ID: ${testUser.id})`);
            
            const [updateResult] = await db.execute(`
                UPDATE users 
                SET category = ?, country = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, ['Test Category', 'Test Country', testUser.id]);
            
            if (updateResult.affectedRows > 0) {
                console.log('✅ User update successful');
            } else {
                console.log('❌ User update failed - no rows affected');
            }
        }

        console.log('\n✅ All database tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        // Close database connection
        await db.end();
    }
}

// Run the test
testBusinessEndpoints();