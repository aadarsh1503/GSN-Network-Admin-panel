import db from './config/db.js';

async function testDirectoryQuery() {
    try {
        console.log('Testing directory query...');
        
        // Test basic query
        const [users] = await db.execute(`
            SELECT COUNT(*) as total FROM users WHERE role = 'company'
        `);
        console.log('Total companies:', users[0].total);
        
        // Test the full query
        const [companies] = await db.execute(`
            SELECT u.id, u.name, u.email, u.role, u.status, u.is_blacklisted
            FROM users u
            WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
            LIMIT 5
        `);
        console.log('Sample companies:', companies);
        
        // Test with reviews join
        const [companiesWithReviews] = await db.execute(`
            SELECT u.id, u.name, u.email, u.phone, u.logo, u.about_company,
                   u.category, u.country, u.state, u.city, u.services,
                   u.website, u.facebook, u.twitter, u.instagram, u.linkedin,
                   AVG(r.rating) as average_rating,
                   COUNT(r.id) as total_reviews
            FROM users u
            LEFT JOIN reviews r ON u.id = r.company_id AND r.status = 'approved'
            WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
            GROUP BY u.id 
            ORDER BY average_rating DESC, total_reviews DESC
            LIMIT 3
        `);
        console.log('Companies with reviews:', companiesWithReviews);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error testing directory query:', error);
        process.exit(1);
    }
}

testDirectoryQuery();