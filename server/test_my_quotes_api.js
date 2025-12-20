// Test MyQuotes API endpoint
import db from './config/db.js';

async function testMyQuotesAPI() {
    try {
        console.log('🧪 Testing MyQuotes API endpoint...\n');
        
        // Test the accepted quotes query directly
        const companyId = 8; // Company with accepted quotes
        
        console.log(`Testing for company ID: ${companyId}\n`);
        
        // This is the same query used in the API
        const sql = `
            SELECT q.*, 
                   qr.price, qr.transit_time, qr.created_at as response_date,
                   uqs.accepted_at, uqs.status as user_response_status,
                   u.name as user_name, u.email as user_email, u.phone as user_phone,
                   COUNT(qr2.id) as total_responses
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.status = 'accepted')
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
            WHERE qr.company_id = ?
            GROUP BY q.id, qr.id, uqs.id
            ORDER BY uqs.accepted_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        
        console.log(`📊 Found ${rows.length} accepted quotes for company ${companyId}:`);
        
        if (rows.length === 0) {
            console.log('❌ No accepted quotes found. This could mean:');
            console.log('   1. Company has not responded to any quotes');
            console.log('   2. No users have accepted this company\'s responses');
            console.log('   3. Company ID does not exist');
            
            // Let's check what data exists
            console.log('\n🔍 Checking available data...');
            
            // Check if company exists
            const [companyCheck] = await db.execute('SELECT id, name, email FROM users WHERE id = ? AND role = "company"', [companyId]);
            console.log(`Company exists: ${companyCheck.length > 0 ? 'YES' : 'NO'}`);
            if (companyCheck.length > 0) {
                console.log(`Company: ${companyCheck[0].name} (${companyCheck[0].email})`);
            }
            
            // Check quote responses by this company
            const [responseCheck] = await db.execute('SELECT COUNT(*) as count FROM quote_responses WHERE company_id = ?', [companyId]);
            console.log(`Quote responses by company: ${responseCheck[0].count}`);
            
            // Check accepted responses
            const [acceptedCheck] = await db.execute(`
                SELECT COUNT(*) as count 
                FROM user_quote_status uqs 
                JOIN quote_responses qr ON uqs.quote_response_id = qr.id 
                WHERE qr.company_id = ? AND uqs.status = 'accepted'
            `, [companyId]);
            console.log(`Accepted responses: ${acceptedCheck[0].count}`);
            
        } else {
            rows.forEach((quote, index) => {
                console.log(`\n${index + 1}. Quote #${quote.id}:`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Product: ${quote.product_description}`);
                console.log(`   Price: $${quote.price}`);
                console.log(`   User: ${quote.user_name || 'Guest'} (${quote.user_email || 'No email'})`);
                console.log(`   Accepted: ${quote.accepted_at ? new Date(quote.accepted_at).toLocaleDateString() : 'N/A'}`);
                console.log(`   Status: ${quote.status}`);
            });
        }
        
        // Let's also test with different company IDs
        console.log('\n🔍 Checking all companies with accepted quotes...');
        const [allAccepted] = await db.execute(`
            SELECT DISTINCT qr.company_id, u.name as company_name, COUNT(*) as accepted_count
            FROM quote_responses qr
            JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.status = 'accepted')
            JOIN users u ON qr.company_id = u.id
            GROUP BY qr.company_id, u.name
            ORDER BY accepted_count DESC
        `);
        
        if (allAccepted.length > 0) {
            console.log('Companies with accepted quotes:');
            allAccepted.forEach((company, index) => {
                console.log(`${index + 1}. ${company.company_name} (ID: ${company.company_id}) - ${company.accepted_count} accepted`);
            });
        } else {
            console.log('❌ No companies have any accepted quotes yet');
        }
        
    } catch (error) {
        console.error('❌ Error testing MyQuotes API:', error);
    } finally {
        process.exit(0);
    }
}

testMyQuotesAPI();