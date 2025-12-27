import db from './config/db.js';

async function testFullDirectoryQuery() {
    try {
        console.log('Testing full directory query with pagination...');
        
        const page = 1;
        const limit = 12;
        
        let sql = `
            SELECT u.id, u.name, u.email, u.phone, u.logo, u.about_company,
                   u.category, u.country, u.state, u.city, u.services,
                   u.website, u.facebook, u.twitter, u.instagram, u.linkedin,
                   AVG(r.rating) as average_rating,
                   COUNT(r.id) as total_reviews
            FROM users u
            LEFT JOIN reviews r ON u.id = r.company_id AND r.status = 'approved'
            WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
        `;

        sql += ` GROUP BY u.id ORDER BY average_rating DESC, total_reviews DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ` LIMIT ? OFFSET ?`;

        console.log('Executing SQL:', sql);
        console.log('Parameters:', [parseInt(limit), parseInt(offset)]);

        const [rows] = await db.execute(sql, [parseInt(limit), parseInt(offset)]);
        
        console.log('Raw results:', rows);

        // Test JSON parsing
        const companies = rows.map(company => {
            console.log('Processing company:', company.name);
            console.log('Services raw:', company.services);
            
            let parsedServices = [];
            if (company.services) {
                try {
                    parsedServices = JSON.parse(company.services);
                    console.log('Parsed services:', parsedServices);
                } catch (error) {
                    console.error('JSON parse error for services:', error);
                    parsedServices = [];
                }
            }
            
            return {
                ...company,
                services: parsedServices,
                average_rating: company.average_rating ? Math.round(company.average_rating * 10) / 10 : 0
            };
        });

        console.log('Final processed companies:', companies);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error testing full directory query:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

testFullDirectoryQuery();