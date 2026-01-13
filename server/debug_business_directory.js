import db from './config/db.js';

async function debugBusinessDirectory() {
    try {
        console.log('🔍 Debugging business directory query...');
        
        // Test the exact query from the controller
        let whereClause = `WHERE role = 'business'`;
        let queryParams = [];
        
        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        console.log('📊 Count SQL:', countSql);
        console.log('📊 Count Params:', queryParams);
        
        const [countResult] = await db.execute(countSql, queryParams);
        console.log('📊 Count Result:', countResult);
        const totalBusinesses = countResult[0].total;
        console.log('📊 Total businesses:', totalBusinesses);
        
        // Get businesses
        const sql = `
            SELECT 
                id, name, email, category, country, state, city,
                about_company, logo, website, created_at
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const limit = 3;
        const offset = 0;
        queryParams.push(parseInt(limit), offset);
        
        console.log('📊 Main SQL:', sql);
        console.log('📊 Main Params:', queryParams);
        
        const [businesses] = await db.execute(sql, queryParams);
        console.log('📊 Businesses found:', businesses.length);
        
        if (businesses.length > 0) {
            console.log('📋 Sample business:');
            console.log(businesses[0]);
        }
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalBusinesses / parseInt(limit));
        const currentPage = 1;

        const result = {
            businesses,
            pagination: {
                currentPage,
                totalPages,
                totalBusinesses,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            }
        };
        
        console.log('✅ Final result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error in debug:', error);
    }
    
    process.exit(0);
}

debugBusinessDirectory();