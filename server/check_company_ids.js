import db from './config/db.js';

async function checkCompanyIds() {
    try {
        const [result] = await db.execute(`
            SELECT DISTINCT qr.company_id, u.name, u.email 
            FROM quote_responses qr 
            JOIN users u ON qr.company_id = u.id 
            JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id 
            WHERE uqs.status = 'accepted'
        `);
        
        console.log('Companies with accepted quotes:', result);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkCompanyIds();