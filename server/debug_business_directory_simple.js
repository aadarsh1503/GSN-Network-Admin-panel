import db from './config/db.js';

async function debugBusinessDirectory() {
    try {
        console.log('🔍 Testing simple business directory query...');
        
        // Simple query without parameters first
        const sql = `
            SELECT 
                id, name, email, category, country, state, city,
                about_company, logo, website, created_at
            FROM users 
            WHERE role = 'business'
            ORDER BY created_at DESC
            LIMIT 3
        `;
        
        console.log('📊 SQL:', sql);
        
        const [businesses] = await db.execute(sql);
        console.log('📊 Businesses found:', businesses.length);
        
        if (businesses.length > 0) {
            console.log('📋 Sample business:');
            console.log({
                id: businesses[0].id,
                name: businesses[0].name,
                category: businesses[0].category,
                country: businesses[0].country,
                city: businesses[0].city
            });
        }
        
        const result = {
            businesses,
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalBusinesses: businesses.length,
                hasNext: false,
                hasPrev: false
            }
        };
        
        console.log('✅ Success! Found', businesses.length, 'businesses');
        
    } catch (error) {
        console.error('❌ Error in debug:', error);
    }
    
    process.exit(0);
}

debugBusinessDirectory();