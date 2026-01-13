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

// Simulate the fixed controller logic
async function testFixedAPI() {
    let connection;
    
    try {
        console.log('🔍 Testing fixed API logic...\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully\n');
        
        // Test directory query
        const [rows] = await connection.execute(`
            SELECT u.id, u.name, u.email, u.phone, u.logo, u.about_company,
                   u.category, u.country, u.state, u.city, u.services,
                   u.website, u.facebook, u.twitter, u.instagram, u.linkedin,
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as total_reviews,
                   MAX(CASE WHEN us.status = 'active' THEN 1 ELSE 0 END) as has_subscription,
                   MAX(mp.name) as plan_name
            FROM users u
            LEFT JOIN reviews r ON (u.id = r.company_id AND r.status = 'approved')
            LEFT JOIN user_subscriptions us ON (u.id = us.user_id AND us.status = 'active')
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
            GROUP BY u.id 
            ORDER BY has_subscription DESC, average_rating DESC, total_reviews DESC
            LIMIT 3
        `);
        
        // Apply the fixed parsing logic
        const companies = rows.map(company => {
            let services = [];
            
            if (company.services) {
                // Check if services is already an array (MySQL auto-parsed JSON)
                if (Array.isArray(company.services)) {
                    services = company.services;
                } else {
                    // Handle string format
                    let servicesString = company.services;
                    if (Buffer.isBuffer(company.services)) {
                        servicesString = company.services.toString('utf8');
                    }
                    
                    try {
                        // First try to parse as JSON
                        services = JSON.parse(servicesString);
                    } catch (e) {
                        // If JSON parsing fails, split by comma
                        if (typeof servicesString === 'string') {
                            services = servicesString.split(',').map(s => s.trim()).filter(s => s);
                        } else {
                            services = [];
                        }
                    }
                }
            }
            
            return {
                id: company.id,
                name: company.name,
                email: company.email,
                phone: company.phone,
                category: company.category,
                country: company.country,
                city: company.city,
                state: company.state,
                website: company.website,
                services,
                average_rating: company.average_rating ? Math.round(company.average_rating * 10) / 10 : 0,
                total_reviews: company.total_reviews,
                is_premium: company.has_subscription === 1,
                plan_name: company.plan_name
            };
        });
        
        console.log('📋 Fixed API Response:');
        console.log(JSON.stringify({
            companies,
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalCompanies: companies.length,
                hasNext: false,
                hasPrev: false
            }
        }, null, 2));
        
        console.log('\n🎉 Fixed API test completed!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testFixedAPI();