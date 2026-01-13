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

async function debugActualData() {
    let connection;
    
    try {
        console.log('🔍 Debugging actual data format...\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully\n');
        
        // Get actual company data with subscription info
        console.log('1. Testing actual directory query...');
        const [companies] = await connection.execute(`
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
        
        console.log(`✅ Found ${companies.length} companies\n`);
        
        companies.forEach((company, index) => {
            console.log(`📋 Company ${index + 1}:`);
            console.log(`  ID: ${company.id}`);
            console.log(`  Name: ${company.name}`);
            console.log(`  Email: ${company.email || 'N/A'}`);
            console.log(`  Phone: ${company.phone || 'N/A'}`);
            console.log(`  Category: ${company.category}`);
            console.log(`  Location: ${company.city || 'N/A'}, ${company.state || 'N/A'}, ${company.country || 'N/A'}`);
            console.log(`  Website: ${company.website || 'N/A'}`);
            console.log(`  Services (raw): ${company.services}`);
            console.log(`  Services type: ${typeof company.services}`);
            console.log(`  Has Subscription: ${company.has_subscription}`);
            console.log(`  Plan Name: ${company.plan_name || 'N/A'}`);
            console.log(`  Average Rating: ${company.average_rating}`);
            console.log(`  Total Reviews: ${company.total_reviews}`);
            console.log(`  About: ${company.about_company ? company.about_company.substring(0, 100) + '...' : 'N/A'}`);
            
            // Try to parse services
            if (company.services) {
                console.log(`  Services buffer: ${Buffer.isBuffer(company.services)}`);
                
                let servicesString = company.services;
                if (Buffer.isBuffer(company.services)) {
                    servicesString = company.services.toString('utf8');
                }
                
                console.log(`  Services string: "${servicesString}"`);
                
                try {
                    const parsedServices = JSON.parse(servicesString);
                    console.log(`  Services (parsed as JSON): ${JSON.stringify(parsedServices)}`);
                } catch (e) {
                    console.log(`  Services (JSON parse error): ${e.message}`);
                    // Try splitting by comma
                    if (typeof servicesString === 'string') {
                        const splitServices = servicesString.split(',').map(s => s.trim()).filter(s => s);
                        console.log(`  Services (split by comma): ${JSON.stringify(splitServices)}`);
                    }
                }
            }
            console.log('  ---\n');
        });
        
        // Test specific company profile
        if (companies.length > 0) {
            const testId = companies[0].id;
            console.log(`2. Testing company profile for ID ${testId}...`);
            
            const [profileData] = await connection.execute(`
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
            `, [testId]);
            
            if (profileData.length > 0) {
                const profile = profileData[0];
                console.log('📋 Profile Data:');
                console.log(`  Full services data: "${profile.services}"`);
                console.log(`  Email: "${profile.email}"`);
                console.log(`  Phone: "${profile.phone}"`);
                console.log(`  Has subscription: ${profile.has_subscription}`);
                console.log(`  Plan name: ${profile.plan_name}`);
            }
        }
        
        console.log('\n🎉 Data debugging completed!');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the debug
debugActualData();