import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function investigateQuote66() {
    console.log('🔍 Investigating Quote 66 -> 70 Issue');
    console.log('=====================================');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database:', process.env.DB_NAME);
        
        // 1. Check Quote 66 details
        console.log('\n1. Checking Quote 66 details...');
        const [quote66] = await connection.execute(`
            SELECT q.*, u.name as user_name, u.email as user_email 
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.id = 66
        `);
        
        if (quote66.length > 0) {
            console.log('✅ Quote 66 found:');
            console.table(quote66.map(q => ({
                id: q.id,
                user_email: q.user_email,
                departure: q.departure_country,
                arrival: q.arrival_country,
                product: q.product_description,
                status: q.status,
                created: q.created_at
            })));
        }
        
        // 2. Check quote responses for Quote 66
        console.log('\n2. Checking quote responses for Quote 66...');
        const [responses66] = await connection.execute(`
            SELECT qr.*, u.name as company_name, u.email as company_email 
            FROM quote_responses qr 
            LEFT JOIN users u ON qr.company_id = u.id 
            WHERE qr.quote_id = 66
        `);
        
        if (responses66.length > 0) {
            console.log('✅ Quote responses for Quote 66:');
            console.table(responses66.map(r => ({
                response_id: r.id,
                quote_id: r.quote_id,
                company_email: r.company_email,
                price: r.price,
                created: r.created_at
            })));
        }
        
        // 3. Check the latest quotes and responses
        console.log('\n3. Checking latest quotes and responses...');
        const [latestData] = await connection.execute(`
            SELECT q.id as quote_id, qr.id as response_id, q.product_description, u.email as user_email
            FROM quotes q 
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id >= 65
            ORDER BY q.id DESC, qr.id DESC
        `);
        
        console.log('📋 Latest quotes and responses:');
        console.table(latestData);
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

investigateQuote66().catch(console.error);