// Debug script to specifically check Quote ID 31 visibility
import db from './config/db.js';

const debugQuote31 = async () => {
    console.log('🔍 Debugging Quote ID 31 Visibility');
    console.log('=' .repeat(50));

    try {
        const quoteId = 31;
        const company1Id = 26; // aadarsh-comapny-3
        const company2Id = 10; // Aadarsh-company

        // Get quote details
        const [quoteDetails] = await db.execute(`
            SELECT q.*, u.name as user_name
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
        `, [quoteId]);

        if (quoteDetails.length === 0) {
            console.log('❌ Quote not found');
            return;
        }

        const quote = quoteDetails[0];
        console.log('📋 Quote Details:');
        console.log(`ID: ${quote.id}`);
        console.log(`Status: ${quote.status}`);
        console.log(`User: ${quote.user_name} (ID: ${quote.user_id})`);
        console.log(`Route: ${quote.departure_country} → ${quote.arrival_country}`);
        console.log(`Product: ${quote.product_description}`);
        console.log('');

        // Check responses for this quote
        const [responses] = await db.execute(`
            SELECT qr.*, u.name as company_name
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [quoteId]);

        console.log('💬 Responses:');
        if (responses.length === 0) {
            console.log('No responses found');
        } else {
            responses.forEach((response, index) => {
                console.log(`${index + 1}. Company: ${response.company_name} (ID: ${response.company_id})`);
                console.log(`   Price: ${response.price}`);
                console.log(`   Status: ${response.status}`);
                console.log(`   Date: ${response.created_at}`);
            });
        }
        console.log('');

        // Check user_quote_status for this quote
        const [userStatuses] = await db.execute(`
            SELECT uqs.*, u.name as user_name, c.name as company_name
            FROM user_quote_status uqs
            LEFT JOIN users u ON uqs.user_id = u.id
            LEFT JOIN users c ON uqs.company_id = c.id
            WHERE uqs.quote_id = ?
        `, [quoteId]);

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
            });
        }
        console.log('');

        // Test visibility conditions for both companies
        const testVisibilityForCompany = async (companyId, companyName) => {
            console.log(`🔍 Testing visibility for ${companyName} (ID: ${companyId}):`);

            // Get company location
            const [companyLocation] = await db.execute(
                'SELECT country FROM users WHERE id = ?', 
                [companyId]
            );
            const country = companyLocation[0]?.country || '';

            // Test each condition individually
            console.log(`Company country: ${country}`);

            // Condition 1: Quote status
            const statusOk = ['pending', 'approved'].includes(quote.status);
            console.log(`✓ Status check (${quote.status}): ${statusOk ? '✅ PASS' : '❌ FAIL'}`);

            // Condition 2: Not quote owner
            const notOwner = quote.user_id !== companyId;
            console.log(`✓ Not owner check: ${notOwner ? '✅ PASS' : '❌ FAIL'}`);

            // Condition 3: Company hasn't responded
            const [hasResponded] = await db.execute(
                'SELECT 1 FROM quote_responses WHERE quote_id = ? AND company_id = ?',
                [quoteId, companyId]
            );
            const hasntResponded = hasResponded.length === 0;
            console.log(`✓ Hasn't responded check: ${hasntResponded ? '✅ PASS' : '❌ FAIL'}`);

            // Condition 4: Quote not accepted by any user
            const [isAccepted] = await db.execute(
                'SELECT 1 FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                [quoteId]
            );
            const notAccepted = isAccepted.length === 0;
            console.log(`✓ Not accepted check: ${notAccepted ? '✅ PASS' : '❌ FAIL'}`);

            // Condition 5: Location match
            const locationMatch = quote.departure_country === country || quote.arrival_country === country;
            console.log(`✓ Location match check: ${locationMatch ? '✅ PASS' : '❌ FAIL'}`);

            const shouldBeVisible = statusOk && notOwner && hasntResponded && notAccepted && locationMatch;
            console.log(`🎯 SHOULD BE VISIBLE: ${shouldBeVisible ? '✅ YES' : '❌ NO'}`);
            console.log('');
        };

        await testVisibilityForCompany(company1Id, 'Company 1 (aadarsh-comapny-3)');
        await testVisibilityForCompany(company2Id, 'Company 2 (Aadarsh-company)');

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        await db.end();
    }
};

debugQuote31();