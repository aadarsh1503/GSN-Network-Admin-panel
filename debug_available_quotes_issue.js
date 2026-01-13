// Debug script to check the actual available quotes issue
import db from './server/config/db.js';

async function debugAvailableQuotesIssue() {
    try {
        console.log('🔍 Debugging Available Quotes Issue...\n');

        // 1. Get a test quote
        const [quotes] = await db.execute(`
            SELECT id, status, departure_country, arrival_country, user_id
            FROM quotes 
            WHERE status IN ('pending', 'approved') 
            ORDER BY created_at DESC
            LIMIT 1
        `);

        if (quotes.length === 0) {
            console.log('❌ No quotes found. Creating a test quote...');
            
            const [result] = await db.execute(`
                INSERT INTO quotes (
                    user_id, shipping_mode, arrival_date, departure_country, arrival_country, 
                    product_description, status, created_at
                ) VALUES (1, 'sea', '2024-12-31', 'USA', 'Canada', 'Test Product', 'pending', NOW())
            `);
            
            console.log(`✅ Created test quote #${result.insertId}`);
            quotes.push({
                id: result.insertId,
                status: 'pending',
                departure_country: 'USA',
                arrival_country: 'Canada',
                user_id: 1
            });
        }

        const testQuote = quotes[0];
        console.log(`📋 Test Quote: #${testQuote.id} (Status: ${testQuote.status})`);
        console.log(`   From: ${testQuote.departure_country} → To: ${testQuote.arrival_country}`);
        console.log(`   User ID: ${testQuote.user_id}\n`);

        // 2. Get test companies
        const [companies] = await db.execute(`
            SELECT id, name, country, role
            FROM users 
            WHERE role IN ('company', 'business') 
            AND id != ?
            LIMIT 3
        `, [testQuote.user_id]);

        if (companies.length < 2) {
            console.log('❌ Need at least 2 companies for testing');
            return;
        }

        console.log('🏢 Test Companies:');
        companies.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} (ID: ${company.id}, Country: ${company.country})`);
        });
        console.log('');

        // 3. Check current responses for this quote
        const [existingResponses] = await db.execute(`
            SELECT qr.id, qr.company_id, u.name as company_name, qr.status, qr.price
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = ?
        `, [testQuote.id]);

        console.log('📝 Existing Responses:');
        if (existingResponses.length === 0) {
            console.log('   No responses yet');
        } else {
            existingResponses.forEach((response, index) => {
                console.log(`   ${index + 1}. ${response.company_name} - $${response.price} (${response.status})`);
            });
        }
        console.log('');

        // 4. Check user acceptance status
        const [acceptanceStatus] = await db.execute(`
            SELECT uqs.*, u.name as company_name
            FROM user_quote_status uqs
            JOIN users u ON uqs.company_id = u.id
            WHERE uqs.quote_id = ?
        `, [testQuote.id]);

        console.log('✅ User Acceptance Status:');
        if (acceptanceStatus.length === 0) {
            console.log('   No user responses yet (quote still open)');
        } else {
            acceptanceStatus.forEach((status, index) => {
                console.log(`   ${index + 1}. ${status.company_name} - ${status.status} (${status.accepted_at || status.rejected_at})`);
            });
        }
        console.log('');

        // 5. Test the available quotes query for each company
        console.log('🔍 Testing Available Quotes Query for Each Company:');
        
        for (let i = 0; i < Math.min(companies.length, 3); i++) {
            const company = companies[i];
            
            console.log(`\n--- ${company.name} (ID: ${company.id}) ---`);
            
            // Test the exact query from the controller
            const [availableQuotes] = await db.execute(`
                SELECT q.id, q.status,
                       CASE 
                           WHEN (q.departure_country = ? AND q.arrival_country = ?) THEN 5
                           WHEN (q.departure_country = ? OR q.arrival_country = ?) THEN 4
                           ELSE 1
                       END as location_priority
                FROM quotes q 
                WHERE q.status IN ('pending', 'approved')
                AND q.id = ?
                AND (q.user_id != ? OR q.user_id IS NULL)
                AND NOT EXISTS (
                    SELECT 1 FROM quote_responses qr 
                    WHERE qr.quote_id = q.id AND qr.company_id = ?
                )
                AND NOT EXISTS (
                    SELECT 1 FROM user_quote_status uqs 
                    WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
                )
            `, [
                company.country || '', company.country || '',
                company.country || '', company.country || '',
                testQuote.id,
                company.id,
                company.id
            ]);

            console.log(`Available quotes: ${availableQuotes.length}`);
            
            if (availableQuotes.length === 0) {
                // Check why it's excluded
                console.log('Checking exclusion reasons:');
                
                // Check if company already responded
                const [hasResponded] = await db.execute(`
                    SELECT id FROM quote_responses 
                    WHERE quote_id = ? AND company_id = ?
                `, [testQuote.id, company.id]);
                
                if (hasResponded.length > 0) {
                    console.log('   ❌ Company has already responded');
                } else {
                    console.log('   ✅ Company has not responded yet');
                }
                
                // Check if user accepted any response
                const [isAccepted] = await db.execute(`
                    SELECT id FROM user_quote_status 
                    WHERE quote_id = ? AND status = 'accepted'
                `, [testQuote.id]);
                
                if (isAccepted.length > 0) {
                    console.log('   ❌ User has already accepted a response');
                } else {
                    console.log('   ✅ No user acceptance yet');
                }
                
                // Check quote status
                if (!['pending', 'approved'].includes(testQuote.status)) {
                    console.log(`   ❌ Quote status is '${testQuote.status}' (not pending/approved)`);
                } else {
                    console.log(`   ✅ Quote status is '${testQuote.status}'`);
                }
                
                // Check if it's the quote owner
                if (testQuote.user_id === company.id) {
                    console.log('   ❌ Company is the quote owner');
                } else {
                    console.log('   ✅ Company is not the quote owner');
                }
            } else {
                console.log('   ✅ Quote is available for this company');
            }
        }

        // 6. Simulate the issue scenario
        console.log('\n🧪 Simulating the Issue Scenario:');
        
        const company1 = companies[0];
        const company2 = companies[1];
        
        // Check if company1 has already responded
        const [company1Response] = await db.execute(`
            SELECT id FROM quote_responses 
            WHERE quote_id = ? AND company_id = ?
        `, [testQuote.id, company1.id]);
        
        if (company1Response.length === 0) {
            console.log(`\n1. ${company1.name} submitting response...`);
            await db.execute(`
                INSERT INTO quote_responses (
                    quote_id, company_id, price, transit_time, status, created_at
                ) VALUES (?, ?, 1500.00, '7-10 days', 'pending', NOW())
            `, [testQuote.id, company1.id]);
            console.log('   ✅ Response submitted');
        } else {
            console.log(`\n1. ${company1.name} has already responded`);
        }
        
        // Now check if company2 can still see the quote
        console.log(`\n2. Checking if ${company2.name} can still see the quote...`);
        
        const [company2Available] = await db.execute(`
            SELECT COUNT(*) as count
            FROM quotes q 
            WHERE q.status IN ('pending', 'approved')
            AND q.id = ?
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            AND NOT EXISTS (
                SELECT 1 FROM user_quote_status uqs 
                WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
            )
        `, [testQuote.id, company2.id, company2.id]);
        
        console.log(`   ${company2.name} can see quote: ${company2Available[0].count > 0 ? 'YES' : 'NO'}`);
        
        if (company2Available[0].count === 0) {
            console.log('   🔍 This is the BUG! Company2 should be able to see the quote.');
        } else {
            console.log('   ✅ This is correct! Company2 can still see the quote.');
        }

    } catch (error) {
        console.error('❌ Error debugging available quotes:', error);
    } finally {
        process.exit(0);
    }
}

debugAvailableQuotesIssue();