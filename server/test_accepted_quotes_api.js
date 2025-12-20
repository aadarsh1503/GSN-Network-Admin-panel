// Test the accepted quotes API to see why quotes aren't showing
import db from './config/db.js';

async function testAcceptedQuotesAPI() {
    try {
        console.log('🧪 Testing Accepted Quotes API...\n');
        
        // Test for company ID 8 (the one that should have accepted quotes)
        const companyId = 8;
        
        console.log(`Testing for company ID: ${companyId}\n`);
        
        // 1. Check if company has any quote responses
        console.log('1️⃣ Checking company quote responses...');
        const [responses] = await db.execute(`
            SELECT qr.*, q.product_description, q.departure_country, q.arrival_country
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [companyId]);
        
        console.log(`Found ${responses.length} quote responses:`);
        responses.forEach(resp => {
            console.log(`  - Quote #${resp.quote_id}: ${resp.departure_country} → ${resp.arrival_country}, Status: ${resp.status}, Price: $${resp.price}`);
        });
        
        // 2. Check user_quote_status table for accepted responses
        console.log('\n2️⃣ Checking user_quote_status for accepted responses...');
        const [userStatuses] = await db.execute(`
            SELECT uqs.*, qr.company_id, q.product_description
            FROM user_quote_status uqs
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            JOIN quotes q ON uqs.quote_id = q.id
            WHERE qr.company_id = ? AND uqs.status = 'accepted'
            ORDER BY uqs.accepted_at DESC
        `, [companyId]);
        
        console.log(`Found ${userStatuses.length} accepted responses:`);
        userStatuses.forEach(status => {
            console.log(`  - Quote #${status.quote_id}: User ${status.user_id} accepted response ${status.quote_response_id} on ${status.accepted_at}`);
        });
        
        // 3. Run the exact API query
        console.log('\n3️⃣ Running the exact API query...');
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
        
        const [apiResults] = await db.execute(sql, [companyId]);
        
        console.log(`API query returned ${apiResults.length} results:`);
        apiResults.forEach(result => {
            console.log(`  - Quote #${result.id}: ${result.departure_country} → ${result.arrival_country}`);
            console.log(`    Price: $${result.price}, User: ${result.user_name}, Accepted: ${result.accepted_at}`);
        });
        
        // 4. Check recent quote acceptances
        console.log('\n4️⃣ Checking recent quote acceptances (last 24 hours)...');
        const [recentAcceptances] = await db.execute(`
            SELECT uqs.*, qr.company_id, q.product_description, u.name as user_name
            FROM user_quote_status uqs
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            JOIN quotes q ON uqs.quote_id = q.id
            LEFT JOIN users u ON uqs.user_id = u.id
            WHERE uqs.status = 'accepted' 
            AND uqs.accepted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY uqs.accepted_at DESC
        `);
        
        console.log(`Found ${recentAcceptances.length} recent acceptances:`);
        recentAcceptances.forEach(acc => {
            console.log(`  - Quote #${acc.quote_id}: User ${acc.user_name} (ID: ${acc.user_id}) accepted company ${acc.company_id}'s response`);
            console.log(`    Accepted at: ${acc.accepted_at}`);
        });
        
        // 5. Check if Quote #10 exists and its status
        console.log('\n5️⃣ Checking Quote #10 specifically...');
        const [quote10] = await db.execute(`
            SELECT q.*, qr.company_id, qr.price, qr.status as response_status, uqs.status as user_status, uqs.accepted_at
            FROM quotes q
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            WHERE q.id = 10
        `);
        
        console.log(`Quote #10 details:`);
        quote10.forEach(q => {
            console.log(`  - Quote Status: ${q.status}`);
            console.log(`  - Company ID: ${q.company_id}, Price: $${q.price}`);
            console.log(`  - Response Status: ${q.response_status}`);
            console.log(`  - User Status: ${q.user_status}`);
            console.log(`  - Accepted At: ${q.accepted_at}`);
        });
        
    } catch (error) {
        console.error('❌ Error testing accepted quotes API:', error);
    } finally {
        process.exit(0);
    }
}

testAcceptedQuotesAPI();