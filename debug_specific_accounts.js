// Debug script for the specific accounts mentioned
import db from './server/config/db.js';

async function debugSpecificAccounts() {
    try {
        console.log('🔍 Debugging Specific Test Accounts\n');

        // 1. Find the test accounts
        const [accounts] = await db.execute(`
            SELECT id, name, email, role, country
            FROM users 
            WHERE email IN ('aadarsh-comapny-3@testing.com', 'aadarshchauhan35@gmail.com')
            ORDER BY email
        `);

        if (accounts.length < 2) {
            console.log('❌ Could not find both test accounts');
            console.log('Available accounts with similar emails:');
            
            const [similarAccounts] = await db.execute(`
                SELECT id, name, email, role
                FROM users 
                WHERE email LIKE '%aadarsh%' OR email LIKE '%testing%'
            `);
            
            similarAccounts.forEach(account => {
                console.log(`   ${account.email} (ID: ${account.id}, Role: ${account.role})`);
            });
            return;
        }

        console.log('👥 Found Test Accounts:');
        accounts.forEach((account, index) => {
            console.log(`   ${index + 1}. ${account.name} (${account.email})`);
            console.log(`      ID: ${account.id}, Role: ${account.role}, Country: ${account.country}`);
        });
        console.log('');

        const company1 = accounts[0]; // aadarsh-comapny-3@testing.com
        const company2 = accounts[1]; // aadarshchauhan35@gmail.com

        // 2. Find quotes that both companies should be able to see
        console.log('📋 Finding quotes that both companies should see...\n');

        // Get quotes that are pending/approved and not owned by either company
        const [availableQuotes] = await db.execute(`
            SELECT q.id, q.status, q.product_description, q.departure_country, q.arrival_country, q.user_id,
                   u.name as user_name, u.email as user_email
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.status IN ('pending', 'approved')
            AND q.user_id NOT IN (?, ?)
            ORDER BY q.created_at DESC
            LIMIT 5
        `, [company1.id, company2.id]);

        if (availableQuotes.length === 0) {
            console.log('❌ No quotes available for testing. Creating a test quote...');
            
            // Create a test quote
            const [quoteResult] = await db.execute(`
                INSERT INTO quotes (
                    user_id, shipping_mode, arrival_date, departure_country, arrival_country, 
                    product_description, status, created_at
                ) VALUES (1, 'sea', '2024-12-31', 'USA', 'Canada', 'DEBUG TEST - Both Companies Should See This', 'pending', NOW())
            `);
            
            const newQuoteId = quoteResult.insertId;
            console.log(`✅ Created test quote #${newQuoteId}\n`);
            
            availableQuotes.push({
                id: newQuoteId,
                status: 'pending',
                product_description: 'DEBUG TEST - Both Companies Should See This',
                departure_country: 'USA',
                arrival_country: 'Canada',
                user_id: 1,
                user_name: 'Test User',
                user_email: 'test@example.com'
            });
        }

        console.log('📋 Available Quotes for Testing:');
        availableQuotes.forEach((quote, index) => {
            console.log(`   ${index + 1}. Quote #${quote.id} - ${quote.product_description}`);
            console.log(`      Status: ${quote.status}, Route: ${quote.departure_country} → ${quote.arrival_country}`);
            console.log(`      Owner: ${quote.user_name} (${quote.user_email})`);
        });
        console.log('');

        // 3. Test each quote with both companies
        for (const quote of availableQuotes) {
            console.log(`\n🔍 Testing Quote #${quote.id} with both companies:`);
            
            // Check existing responses
            const [existingResponses] = await db.execute(`
                SELECT qr.id, qr.company_id, u.name as company_name, qr.price, qr.status
                FROM quote_responses qr
                JOIN users u ON qr.company_id = u.id
                WHERE qr.quote_id = ?
            `, [quote.id]);

            console.log(`   Existing responses: ${existingResponses.length}`);
            existingResponses.forEach((response, index) => {
                console.log(`     ${index + 1}. ${response.company_name} - $${response.price} (${response.status})`);
            });

            // Check user acceptance status
            const [acceptances] = await db.execute(`
                SELECT uqs.*, u.name as company_name
                FROM user_quote_status uqs
                JOIN users u ON uqs.company_id = u.id
                WHERE uqs.quote_id = ?
            `, [quote.id]);

            console.log(`   User acceptance status: ${acceptances.length > 0 ? 'ACCEPTED/REJECTED' : 'PENDING'}`);
            acceptances.forEach((acceptance, index) => {
                console.log(`     ${index + 1}. ${acceptance.company_name} - ${acceptance.status}`);
            });

            // Test availability for both companies using the exact query from the controller
            console.log('   Availability test:');
            
            for (const company of [company1, company2]) {
                const [result] = await db.execute(`
                    SELECT q.id
                    FROM quotes q 
                    LEFT JOIN users u ON q.user_id = u.id 
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
                `, [quote.id, company.id, company.id]);

                const canSee = result.length > 0;
                console.log(`     ${company.name}: ${canSee ? '✅ CAN SEE' : '❌ CANNOT SEE'}`);

                if (!canSee) {
                    // Debug why they can't see it
                    const [hasResponded] = await db.execute(`
                        SELECT COUNT(*) as count FROM quote_responses 
                        WHERE quote_id = ? AND company_id = ?
                    `, [quote.id, company.id]);

                    const [isAccepted] = await db.execute(`
                        SELECT COUNT(*) as count FROM user_quote_status 
                        WHERE quote_id = ? AND status = 'accepted'
                    `, [quote.id]);

                    const reasons = [];
                    if (hasResponded[0].count > 0) reasons.push('already responded');
                    if (isAccepted[0].count > 0) reasons.push('user accepted another response');
                    if (quote.user_id === company.id) reasons.push('owns the quote');

                    console.log(`       Reason: ${reasons.join(', ') || 'unknown'}`);
                }
            }
        }

        // 4. Simulate the exact scenario you described
        console.log('\n🎭 Simulating Your Exact Scenario:');
        
        // Find a quote that both companies can currently see
        let testQuote = null;
        for (const quote of availableQuotes) {
            const [company1Can] = await db.execute(`
                SELECT COUNT(*) as count FROM quotes q 
                WHERE q.id = ? AND q.status IN ('pending', 'approved')
                AND (q.user_id != ? OR q.user_id IS NULL)
                AND NOT EXISTS (SELECT 1 FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?)
                AND NOT EXISTS (SELECT 1 FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted')
            `, [quote.id, company1.id, company1.id]);

            const [company2Can] = await db.execute(`
                SELECT COUNT(*) as count FROM quotes q 
                WHERE q.id = ? AND q.status IN ('pending', 'approved')
                AND (q.user_id != ? OR q.user_id IS NULL)
                AND NOT EXISTS (SELECT 1 FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?)
                AND NOT EXISTS (SELECT 1 FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted')
            `, [quote.id, company2.id, company2.id]);

            if (company1Can[0].count > 0 && company2Can[0].count > 0) {
                testQuote = quote;
                break;
            }
        }

        if (!testQuote) {
            console.log('❌ No suitable quote found for testing. Creating one...');
            
            const [newQuoteResult] = await db.execute(`
                INSERT INTO quotes (
                    user_id, shipping_mode, arrival_date, departure_country, arrival_country, 
                    product_description, status, created_at
                ) VALUES (1, 'sea', '2024-12-31', 'USA', 'Canada', 'SCENARIO TEST - Company Response Issue', 'pending', NOW())
            `);
            
            testQuote = {
                id: newQuoteResult.insertId,
                status: 'pending',
                product_description: 'SCENARIO TEST - Company Response Issue',
                departure_country: 'USA',
                arrival_country: 'Canada',
                user_id: 1
            };
            
            console.log(`✅ Created test quote #${testQuote.id}`);
        }

        console.log(`\nUsing Quote #${testQuote.id} for scenario test:`);
        console.log(`Product: ${testQuote.product_description}`);
        console.log(`Route: ${testQuote.departure_country} → ${testQuote.arrival_country}\n`);

        // Step 1: Verify both can see initially
        console.log('Step 1: Initial state - both companies should see the quote');
        
        const checkBothCompanies = async (stepName) => {
            for (const company of [company1, company2]) {
                const [result] = await db.execute(`
                    SELECT COUNT(*) as count FROM quotes q 
                    WHERE q.id = ? AND q.status IN ('pending', 'approved')
                    AND (q.user_id != ? OR q.user_id IS NULL)
                    AND NOT EXISTS (SELECT 1 FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?)
                    AND NOT EXISTS (SELECT 1 FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted')
                `, [testQuote.id, company.id, company.id]);

                const canSee = result[0].count > 0;
                console.log(`   ${company.name}: ${canSee ? '✅ CAN SEE' : '❌ CANNOT SEE'}`);
            }
        };

        await checkBothCompanies('Initial');

        // Step 2: Company 2 responds
        console.log(`\nStep 2: ${company2.name} responds to the quote`);
        
        // Check if company2 already responded
        const [existingResponse] = await db.execute(`
            SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?
        `, [testQuote.id, company2.id]);

        if (existingResponse.length === 0) {
            await db.execute(`
                INSERT INTO quote_responses (
                    quote_id, company_id, price, transit_time, status, created_at
                ) VALUES (?, ?, 1500.00, '7-10 days', 'pending', NOW())
            `, [testQuote.id, company2.id]);
            
            console.log(`   ✅ ${company2.name} submitted response: $1500, 7-10 days`);
        } else {
            console.log(`   ℹ️  ${company2.name} already has a response`);
        }

        // Step 3: Check availability after company2 responds
        console.log(`\nStep 3: After ${company2.name} responds - ${company1.name} should STILL see the quote`);
        await checkBothCompanies('After Company 2 Response');

        console.log('\n🔍 DIAGNOSIS:');
        console.log('If Company 1 cannot see the quote after Company 2 responds,');
        console.log('then there might be an issue with the query or data.');
        console.log('\nTo fix this in the frontend:');
        console.log('1. Clear browser cache completely');
        console.log('2. Try incognito mode');
        console.log('3. Check network tab for API responses');

    } catch (error) {
        console.error('❌ Error debugging specific accounts:', error);
    } finally {
        process.exit(0);
    }
}

debugSpecificAccounts();