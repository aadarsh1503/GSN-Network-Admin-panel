// Debug the specific test quote issue
import db from './config/db.js';

const debugTestQuoteIssue = async () => {
    console.log('🔍 Debugging Test Quote Issue');
    console.log('=' .repeat(60));

    try {
        const company1Id = 26; // aadarsh-comapny-3@testing.com
        const company2Id = 10; // aadarshchauhan35@gmail.com (responded to test quote)

        // Find the test quote (India → UAE)
        const [testQuotes] = await db.execute(`
            SELECT q.*, u.name as user_name
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.departure_country = 'India' 
            AND q.arrival_country = 'UAE'
            AND q.product_description LIKE '%Test Product%'
            ORDER BY q.created_at DESC
            LIMIT 5
        `);

        if (testQuotes.length === 0) {
            console.log('❌ No test quotes found');
            return;
        }

        console.log('📋 Found test quotes:');
        testQuotes.forEach((quote, index) => {
            console.log(`${index + 1}. Quote ID: ${quote.id}`);
            console.log(`   Status: ${quote.status}`);
            console.log(`   User: ${quote.user_name} (ID: ${quote.user_id})`);
            console.log(`   Product: ${quote.product_description}`);
            console.log(`   Created: ${quote.created_at}`);
            console.log('');
        });

        // Check the most recent test quote
        const testQuote = testQuotes[0];
        const testQuoteId = testQuote.id;

        console.log(`🔍 Analyzing Quote ID: ${testQuoteId}`);
        console.log('-'.repeat(40));

        // Check responses for this quote
        const [responses] = await db.execute(`
            SELECT qr.*, u.name as company_name, u.email as company_email
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [testQuoteId]);

        console.log('💬 Responses:');
        if (responses.length === 0) {
            console.log('No responses found');
        } else {
            responses.forEach((response, index) => {
                console.log(`${index + 1}. Company: ${response.company_name} (${response.company_email})`);
                console.log(`   Company ID: ${response.company_id}`);
                console.log(`   Price: ${response.price}`);
                console.log(`   Status: ${response.status}`);
                console.log(`   Date: ${response.created_at}`);
                console.log('');
            });
        }

        // Check user_quote_status for this quote
        const [userStatuses] = await db.execute(`
            SELECT uqs.*, u.name as user_name, c.name as company_name
            FROM user_quote_status uqs
            LEFT JOIN users u ON uqs.user_id = u.id
            LEFT JOIN users c ON uqs.company_id = c.id
            WHERE uqs.quote_id = ?
        `, [testQuoteId]);

        console.log('📊 User Quote Status:');
        if (userStatuses.length === 0) {
            console.log('No user status records found');
        } else {
            userStatuses.forEach((status, index) => {
                console.log(`${index + 1}. User: ${status.user_name} (ID: ${status.user_id})`);
                console.log(`   Company: ${status.company_name} (ID: ${status.company_id})`);
                console.log(`   Status: ${status.status}`);
                console.log(`   Accepted At: ${status.accepted_at}`);
                console.log(`   Rejected At: ${status.rejected_at}`);
                console.log('');
            });
        }

        // Test visibility for both companies using exact getAvailableQuotes logic
        const testVisibilityForCompany = async (companyId, companyName) => {
            console.log(`🔍 Testing visibility for ${companyName} (ID: ${companyId}):`);

            // Get company location
            const [companyLocation] = await db.execute(
                'SELECT country FROM users WHERE id = ?', 
                [companyId]
            );
            const country = companyLocation[0]?.country || '';

            // Use EXACT same query as getAvailableQuotes
            const quotesSql = `
                SELECT q.*, 
                       COALESCE(u.name, q.contact_name) as user_name, 
                       COALESCE(u.email, q.contact_email) as user_email,
                       q.contact_phone as user_phone,
                       u.country as user_country,
                       u.state as user_state,
                       u.city as user_city,
                       u.latitude as user_latitude,
                       u.longitude as user_longitude,
                       CASE 
                           WHEN (q.departure_country = ? AND q.arrival_country = ?) THEN 5
                           WHEN (q.departure_country = ? OR q.arrival_country = ?) THEN 4
                           ELSE 1
                       END as location_priority
                FROM quotes q 
                LEFT JOIN users u ON q.user_id = u.id 
                WHERE q.status IN ('pending', 'approved')
                AND (q.user_id != ? OR q.user_id IS NULL)
                AND NOT EXISTS (
                    SELECT 1 FROM quote_responses qr 
                    WHERE qr.quote_id = q.id AND qr.company_id = ?
                )
                AND NOT EXISTS (
                    SELECT 1 FROM user_quote_status uqs 
                    WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
                )
                AND (q.departure_country = ? OR q.arrival_country = ?)
                AND q.id = ?
                ORDER BY location_priority DESC, q.created_at DESC
            `;

            const finalParams = [
                country, country, // both departure and arrival same country
                country, country, // either departure or arrival same country
                companyId, companyId, // user exclusion and response check
                country, country, // location filter
                testQuoteId // specific quote filter
            ];

            const [quotes] = await db.execute(quotesSql, finalParams);

            console.log(`  Result: ${quotes.length > 0 ? '✅ CAN SEE' : '❌ CANNOT SEE'}`);
            
            if (quotes.length === 0) {
                // Debug why it's not visible
                console.log('  🔍 Debugging why not visible:');
                
                // Check each condition
                const statusOk = ['pending', 'approved'].includes(testQuote.status);
                console.log(`    Status (${testQuote.status}): ${statusOk ? '✅' : '❌'}`);
                
                const notOwner = testQuote.user_id !== companyId;
                console.log(`    Not owner: ${notOwner ? '✅' : '❌'}`);
                
                const [hasResponded] = await db.execute(
                    'SELECT 1 FROM quote_responses WHERE quote_id = ? AND company_id = ?',
                    [testQuoteId, companyId]
                );
                const hasntResponded = hasResponded.length === 0;
                console.log(`    Hasn't responded: ${hasntResponded ? '✅' : '❌'}`);
                
                const [isAccepted] = await db.execute(
                    'SELECT 1 FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                    [testQuoteId]
                );
                const notAccepted = isAccepted.length === 0;
                console.log(`    Not accepted: ${notAccepted ? '✅' : '❌'}`);
                
                const locationMatch = testQuote.departure_country === country || testQuote.arrival_country === country;
                console.log(`    Location match (${country}): ${locationMatch ? '✅' : '❌'}`);
            }
            console.log('');
        };

        await testVisibilityForCompany(company1Id, 'Company 1 (aadarsh-comapny-3)');
        await testVisibilityForCompany(company2Id, 'Company 2 (aadarshchauhan35@gmail.com)');

        // Check if there are any other companies that should see this quote
        console.log('🔍 Checking other companies that should see this quote:');
        const [otherCompanies] = await db.execute(`
            SELECT id, name, email, country
            FROM users 
            WHERE role = 'company' 
            AND country = 'India'
            AND id NOT IN (?, ?, ?)
            LIMIT 5
        `, [company1Id, company2Id, testQuote.user_id]);

        for (const company of otherCompanies) {
            await testVisibilityForCompany(company.id, `${company.name} (${company.email})`);
        }

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        await db.end();
    }
};

debugTestQuoteIssue();