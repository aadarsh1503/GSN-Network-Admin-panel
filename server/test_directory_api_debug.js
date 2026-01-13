import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: '92.112.181.224',
    user: 'gsnuser',
    password: 'sCp@/2I1D3w',
    database: 'GSN'
};

async function testDirectoryAPI() {
    let connection;
    
    try {
        console.log('🔍 Testing Directory API...\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully\n');
        
        // Test 1: Check if users table exists and has company data
        console.log('1. Testing users table structure...');
        const [tableInfo] = await connection.execute(`
            DESCRIBE users
        `);
        console.log('✅ Users table columns:', tableInfo.map(col => col.Field).join(', '));
        
        // Test 2: Check for company users
        console.log('\n2. Testing company users query...');
        const [companyUsers] = await connection.execute(`
            SELECT id, name, email, role, category, country, city, state, status, is_blacklisted
            FROM users 
            WHERE role = 'company' AND status = 1 AND is_blacklisted = 0
            LIMIT 5
        `);
        console.log(`✅ Found ${companyUsers.length} active company users`);
        if (companyUsers.length > 0) {
            console.log('Sample company:', {
                id: companyUsers[0].id,
                name: companyUsers[0].name,
                category: companyUsers[0].category,
                location: `${companyUsers[0].city || 'N/A'}, ${companyUsers[0].country || 'N/A'}`
            });
        }
        
        // Test 3: Check if user_subscriptions table exists
        console.log('\n3. Testing user_subscriptions table...');
        try {
            const [subscriptionInfo] = await connection.execute(`
                DESCRIBE user_subscriptions
            `);
            console.log('✅ User_subscriptions table exists with columns:', subscriptionInfo.map(col => col.Field).join(', '));
            
            // Check for active subscriptions
            const [activeSubscriptions] = await connection.execute(`
                SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active'
            `);
            console.log(`✅ Found ${activeSubscriptions[0].count} active subscriptions`);
        } catch (error) {
            console.log('⚠️ User_subscriptions table might not exist:', error.message);
        }
        
        // Test 4: Check if reviews table exists
        console.log('\n4. Testing reviews table...');
        try {
            const [reviewsInfo] = await connection.execute(`
                DESCRIBE reviews
            `);
            console.log('✅ Reviews table exists with columns:', reviewsInfo.map(col => col.Field).join(', '));
        } catch (error) {
            console.log('⚠️ Reviews table might not exist:', error.message);
        }
        
        // Test 5: Test the main directory query (simplified)
        console.log('\n5. Testing main directory query...');
        try {
            const [directoryResults] = await connection.execute(`
                SELECT u.id, u.name, u.email, u.phone, u.logo, u.about_company,
                       u.category, u.country, u.state, u.city, u.services,
                       u.website, u.facebook, u.twitter, u.instagram, u.linkedin
                FROM users u
                WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
                LIMIT 3
            `);
            console.log(`✅ Directory query successful, found ${directoryResults.length} companies`);
            
            if (directoryResults.length > 0) {
                console.log('Sample result:', {
                    id: directoryResults[0].id,
                    name: directoryResults[0].name,
                    category: directoryResults[0].category,
                    services: directoryResults[0].services
                });
            }
        } catch (error) {
            console.log('❌ Directory query failed:', error.message);
        }
        
        // Test 6: Test company profile query for a specific ID
        if (companyUsers.length > 0) {
            const testCompanyId = companyUsers[0].id;
            console.log(`\n6. Testing company profile query for ID ${testCompanyId}...`);
            
            try {
                const [profileResult] = await connection.execute(`
                    SELECT u.*, 
                           0 as average_rating,
                           0 as total_reviews,
                           0 as has_subscription,
                           NULL as plan_name,
                           NULL as subscription_date
                    FROM users u
                    WHERE u.id = ? AND u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
                `, [testCompanyId]);
                
                console.log(`✅ Company profile query successful for ID ${testCompanyId}`);
                if (profileResult.length > 0) {
                    console.log('Profile data:', {
                        id: profileResult[0].id,
                        name: profileResult[0].name,
                        category: profileResult[0].category,
                        services: profileResult[0].services
                    });
                }
            } catch (error) {
                console.log(`❌ Company profile query failed for ID ${testCompanyId}:`, error.message);
            }
        }
        
        // Test 7: Check for company_branches table
        console.log('\n7. Testing company_branches table...');
        try {
            const [branchesInfo] = await connection.execute(`
                DESCRIBE company_branches
            `);
            console.log('✅ Company_branches table exists');
        } catch (error) {
            console.log('⚠️ Company_branches table might not exist:', error.message);
        }
        
        // Test 8: Check for company_members table
        console.log('\n8. Testing company_members table...');
        try {
            const [membersInfo] = await connection.execute(`
                DESCRIBE company_members
            `);
            console.log('✅ Company_members table exists');
        } catch (error) {
            console.log('⚠️ Company_members table might not exist:', error.message);
        }
        
        console.log('\n🎉 Directory API testing completed!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testDirectoryAPI();