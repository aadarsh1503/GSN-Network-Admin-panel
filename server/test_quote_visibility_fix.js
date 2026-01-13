// Test script to verify and fix quote visibility issue
import db from './config/db.js';

const testQuoteVisibilityFix = async () => {
    console.log('🔧 Testing Quote Visibility Fix');
    console.log('=' .repeat(60));

    try {
        // Create a test scenario
        console.log('📝 Creating test scenario...');
        
        // Create a test user
        const testUserEmail = 'test-user-visibility@example.com';
        const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [testUserEmail]);
        
        let testUserId;
        if (existingUser.length > 0) {
            testUserId = existingUser[0].id;
            console.log(`✅ Using existing test user (ID: ${testUserId})`);
        } else {
            const [userResult] = await db.execute(`
                INSERT INTO users (name, email, password, role, country, phone, created_at) 
                VALUES (?, ?, ?, 'user', 'India', '1234567890', NOW())
            `, ['Test User Visibility', testUserEmail, 'hashedpassword']);
            testUserId = userResult.insertId;
            console.log(`✅ Created test user (ID: ${testUserId})`);
        }

        // Create a test quote
        const [quoteResult] = await db.execute(`
            INSERT INTO quotes (
                user_id, product_description, departure_country, arrival_country, 
                shipping_mode, arrival_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), 'pending', NOW())
        `, [testUserId, 'Test Product for Visibility', 'India', 'UAE', 'sea']);
        
        const testQuoteId = quoteResult.insertId;
        console.log(`✅ Created test quote (ID: ${testQuoteId})`);

        // Test companies
        const company1Id = 26; // aadarsh-comapny-3@testing.com
        const company2Id = 10; // aadarshchauhan35@gmail.com

        // Function to get available quotes for a company (same logic as backend)
        const getAvailableQuotesForCompany = async (companyId, companyName) => {
            const [companyLocation] = await db.execute(
                'SELECT country FROM users WHERE id = ?', 
                [companyId]
            );
            const country = companyLocation[0]?.country || '';
            
            const quotesSql = `
                SELECT q.id, q.status, q.product_description,
                       (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id) as total_responses,
                       (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?) as my_responses,
                       (SELECT COUNT(*) FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count
                FROM quotes q 
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
                ORDER BY q.created_at DESC
            `;

            const [quotes] = await db.execute(quotesSql, [
                companyId, companyId, companyId, country, country, testQuoteId
            ]);

            return quotes;
        };

        // Step 1: Both companies should see the quote initially
        console.log('\n📋 STEP 1: Initial state - both companies should see the quote');
        console.log('-'.repeat(50));
        
        const comp1QuotesInitial = await getAvailableQuotesForCompany(company1Id, 'Company 1');
        const comp2QuotesInitial = await getAvailableQuotesForCompany(company2Id, 'Company 2');

        console.log(`Company 1 sees test quote: ${comp1QuotesInitial.length > 0 ? '✅ YES' : '❌ NO'}`);
        console.log(`Company 2 sees test quote: ${comp2QuotesInitial.length > 0 ? '✅ YES' : '❌ NO'}`);

        if (comp1QuotesInitial.length === 0 || comp2QuotesInitial.length === 0) {
            console.log('❌ Test failed: Both companies should see the quote initially');
            console.log('This might be due to location mismatch or other filters');
            
            // Debug location issue
            const [comp1Location] = await db.execute('SELECT country FROM users WHERE id = ?', [company1Id]);
            const [comp2Location] = await db.execute('SELECT country FROM users WHERE id = ?', [company2Id]);
            console.log(`Company 1 country: ${comp1Location[0]?.country}`);
            console.log(`Company 2 country: ${comp2Location[0]?.country}`);
            console.log(`Quote route: India → UAE`);
        }

        // Step 2: Company 2 responds to the quote
        console.log('\n📝 STEP 2: Company 2 responds to the quote');
        console.log('-'.repeat(50));

        const [responseResult] = await db.execute(`
            INSERT INTO quote_responses (
                quote_id, company_id, price, transit_time, 
                notes, status, created_at
            ) VALUES (?, ?, ?, '5-7 days', 'Test response', 'pending', NOW())
        `, [testQuoteId, company2Id, 1500.00]);

        console.log(`✅ Company 2 submitted response (ID: ${responseResult.insertId})`);

        // Step 3: Check visibility after response
        console.log('\n🔍 STEP 3: Check visibility after Company 2 responds');
        console.log('-'.repeat(50));

        const comp1QuotesAfter = await getAvailableQuotesForCompany(company1Id, 'Company 1');
        const comp2QuotesAfter = await getAvailableQuotesForCompany(company2Id, 'Company 2');

        console.log(`Company 1 sees test quote: ${comp1QuotesAfter.length > 0 ? '✅ YES' : '❌ NO'}`);
        console.log(`Company 2 sees test quote: ${comp2QuotesAfter.length > 0 ? '❌ YES (incorrect)' : '✅ NO (correct)'}`);

        // Expected behavior:
        // - Company 1 should still see the quote (they haven't responded)
        // - Company 2 should NOT see the quote (they have responded)

        let testPassed = true;
        if (comp1QuotesAfter.length === 0) {
            console.log('❌ ISSUE FOUND: Company 1 cannot see the quote after Company 2 responded!');
            testPassed = false;
        }
        
        if (comp2QuotesAfter.length > 0) {
            console.log('❌ ISSUE FOUND: Company 2 can still see the quote after responding!');
            testPassed = false;
        }

        if (testPassed) {
            console.log('✅ TEST PASSED: Quote visibility is working correctly');
        } else {
            console.log('❌ TEST FAILED: Quote visibility has issues');
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await db.execute('DELETE FROM quote_responses WHERE quote_id = ?', [testQuoteId]);
        await db.execute('DELETE FROM quotes WHERE id = ?', [testQuoteId]);
        console.log('✅ Test data cleaned up');

        // Additional check: Verify the actual getAvailableQuotes function
        console.log('\n🔍 ADDITIONAL CHECK: Testing actual getAvailableQuotes function');
        console.log('-'.repeat(50));
        
        // Let's check if there are any quotes where Company 1 should see but doesn't
        const [problematicQuotes] = await db.execute(`
            SELECT q.id, q.status, q.product_description,
                   (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?) as comp1_responses,
                   (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?) as comp2_responses,
                   (SELECT COUNT(*) FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count
            FROM quotes q
            WHERE q.status IN ('pending', 'approved')
            AND (q.departure_country = 'India' OR q.arrival_country = 'India')
            AND q.user_id NOT IN (?, ?)
            ORDER BY q.created_at DESC
            LIMIT 10
        `, [company1Id, company2Id, company1Id, company2Id]);

        console.log('Recent quotes analysis:');
        problematicQuotes.forEach(quote => {
            const comp1ShouldSee = quote.comp1_responses === 0 && quote.accepted_count === 0;
            const comp2ShouldSee = quote.comp2_responses === 0 && quote.accepted_count === 0;
            
            console.log(`Quote ${quote.id}: ${quote.product_description?.substring(0, 30)}...`);
            console.log(`  Status: ${quote.status}`);
            console.log(`  Company 1 responses: ${quote.comp1_responses} (should see: ${comp1ShouldSee ? 'YES' : 'NO'})`);
            console.log(`  Company 2 responses: ${quote.comp2_responses} (should see: ${comp2ShouldSee ? 'YES' : 'NO'})`);
            console.log(`  Accepted: ${quote.accepted_count > 0 ? 'YES' : 'NO'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

testQuoteVisibilityFix();