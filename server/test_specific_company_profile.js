import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function testCompanyProfile() {
    let connection;
    
    try {
        console.log('🔍 Testing Company Profile API for ID 10...\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully\n');
        
        const companyId = 10;
        
        // Test the exact query from the controller (FIXED with MAX)
        console.log('1. Testing the FIXED controller query with MAX...');
        try {
            const [companyRows] = await connection.execute(`
                SELECT u.*, 
                       COALESCE(AVG(r.rating), 0) as average_rating,
                       COUNT(r.id) as total_reviews,
                       MAX(CASE WHEN us.status = 'active' THEN 1 ELSE 0 END) as has_subscription,
                       MAX(mp.name) as plan_name,
                       MAX(us.created_at) as subscription_date
                FROM users u
                LEFT JOIN reviews r ON u.id = r.company_id AND r.status = 'approved'
                LEFT JOIN user_subscriptions us ON (u.id = us.user_id AND us.status = 'active')
                LEFT JOIN membership_plans mp ON us.plan_id = mp.id
                WHERE u.id = ? AND u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
                GROUP BY u.id
            `, [companyId]);
            
            console.log(`✅ Query executed successfully, found ${companyRows.length} results`);
            
            if (companyRows.length > 0) {
                const company = companyRows[0];
                console.log('Company data:', {
                    id: company.id,
                    name: company.name,
                    category: company.category,
                    average_rating: company.average_rating,
                    total_reviews: company.total_reviews,
                    has_subscription: company.has_subscription,
                    plan_name: company.plan_name,
                    services: company.services
                });
            } else {
                console.log('❌ No company found with ID', companyId);
            }
        } catch (error) {
            console.log('❌ Query failed:', error.message);
            console.log('Error details:', error);
        }
        
        // Test branches query
        console.log('\n2. Testing branches query...');
        try {
            const [branches] = await connection.execute(
                'SELECT * FROM company_branches WHERE company_id = ?', 
                [companyId]
            );
            console.log(`✅ Branches query successful, found ${branches.length} branches`);
        } catch (error) {
            console.log('❌ Branches query failed:', error.message);
        }
        
        // Test members query
        console.log('\n3. Testing members query...');
        try {
            const [members] = await connection.execute(`
                SELECT cm.*, cb.branch_name 
                FROM company_members cm
                JOIN company_branches cb ON cm.branch_id = cb.id
                WHERE cm.company_id = ?
            `, [companyId]);
            console.log(`✅ Members query successful, found ${members.length} members`);
        } catch (error) {
            console.log('❌ Members query failed:', error.message);
        }
        
        // Test reviews query
        console.log('\n4. Testing reviews query...');
        try {
            const [reviews] = await connection.execute(`
                SELECT r.*, u.name as reviewer_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.company_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
                LIMIT 10
            `, [companyId]);
            console.log(`✅ Reviews query successful, found ${reviews.length} reviews`);
        } catch (error) {
            console.log('❌ Reviews query failed:', error.message);
        }
        
        console.log('\n🎉 Company profile testing completed!');
        
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
testCompanyProfile();