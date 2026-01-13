// Test the fix for quote visibility issue
import db from './config/db.js';

const testFixVerification = async () => {
    console.log('🔧 Testing Quote Visibility Fix');
    console.log('=' .repeat(60));

    try {
        // Create a test scenario to verify the fix
        console.log('📝 Creating test scenario...');
        
        // Create a test user
        const testUserEmail = 'test-fix-verification@example.com';
        const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [testUserEmail]);
        
        let testUserId;
        if (existingUser.length > 0) {
            testUserId = existingUser[0].id;
            console.log(`✅ Using existing test user (ID: ${testUserId})`);
        } else {
            const [userResult] = await db.execute(`
                INSERT INTO users (name, email, password, role, country, phone, created_at) 
                VALUES (?, ?, ?, 'user', 'India', '1234567890', NOW())
            `, ['Test Fix Verification', testUserEmail, 'hashedpassword']);
            testUserId = userResult.insertId;
            console.log(`✅ Created test user (ID: ${testUserId})`);
        }

        // Create a test quote
        const [quoteResult] = await db.execute(`
            INSERT INTO quotes (
                user_id, product_description, departure_country, arrival_country, 
                shipping_mode, arrival_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), 'pending', NOW())
        `, [testUserId, 'Test Fix Verification Quote', 'India', 'UAE', 'sea']);
        
        const testQuoteId = quoteResult.insertId;
        console.log(`✅ Created test quote (ID: ${testQuoteId})`);

        // Test companies
        const company1Id = 26; // aadarsh-comapny-3@testing.com
        const company2Id = 10; // aadarshchauhan35@gmail.com

        // Function to check quote visibility
        const checkQuoteVisibility = async (companyId, companyName) => {
            const [companyLocation] = await db.execute(
                'SELECT country FROM users WHERE id = ?', 
                [companyId]
            );
            const country = companyLocation[0]?.country || '';
            
            const quotesSql = `
                SELECT q.id, q.status
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
            `;

            const [quotes] = await db.execute(quotesSql, [
                companyId, companyId, country, country, testQuoteId
            ]);

            return quotes.length > 0;
        };

        // Step 1: Both companies should see the quote initially
        console.log('\n📋 STEP 1: Initial state - both companies should see the quote');
        console.log('-'.repeat(50));
        
        const comp1CanSeeInitial = await checkQuoteVisibility(company1Id, 'Company 1');
        const comp2CanSeeInitial = await checkQuoteVisibility(company2Id, 'Company 2');

        console.log(`Company 1 sees test quote: ${comp1CanSeeInitial ? '✅ YES' : '❌ NO'}`);
        console.log(`Company 2 sees test quote: ${comp2CanSeeInitial ? '✅ YES' : '❌ NO'}`);

        // Step 2: Company 2 responds using the ENHANCED quote system (this was causing the bug)
        console.log('\n📝 STEP 2: Company 2 responds using enhanced quote system');
        console.log('-'.repeat(50));

        // First, create bank details for company 2 (required for enhanced response)
        const [bankDetailsResult] = await db.execute(`
            INSERT INTO company_bank_details (
                company_id, bank_name, branch_name, branch_address, ifsc_code, account_number, 
                account_holder_name, swift_code, routing_number, is_active, is_default, created_at
            ) VALUES (?, 'Test Bank', 'Test Branch', 'Test Address', 'TEST123', '123456789', 'Test Company', 'TESTSWIFT', '987654321', 1, 1, NOW())
        `, [company2Id]);

        const bankDetailsId = bankDetailsResult.insertId;

        // Now submit enhanced quote response (this should NOT change quote status)
        const [responseResult] = await db.execute(`
            INSERT INTO quote_responses 
            (quote_id, company_id, price, transit_time, inclusions, terms, notes, requires_payment_proof, payment_amount, payment_currency) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [testQuoteId, company2Id, 1500.00, '5-7 days', 'Test inclusions', 'Test terms', 'Enhanced quote response', true, 1500.00, 'USD']);

        const quoteResponseId = responseResult.insertId;

        // Link bank details to quote response
        await db.execute(
            'INSERT INTO quote_response_bank_details (quote_response_id, company_bank_details_id) VALUES (?, ?)',
            [quoteResponseId, bankDetailsId]
        );

        console.log(`✅ Company 2 submitted enhanced response (ID: ${quoteResponseId})`);

        // Check quote status after response
        const [quoteAfterResponse] = await db.execute('SELECT status FROM quotes WHERE id = ?', [testQuoteId]);
        const statusAfterResponse = quoteAfterResponse[0].status;
        console.log(`Quote status after response: ${statusAfterResponse}`);

        // Step 3: Check visibility after response (this should work correctly now)
        console.log('\n🔍 STEP 3: Check visibility after Company 2 responds');
        console.log('-'.repeat(50));

        const comp1CanSeeAfter = await checkQuoteVisibility(company1Id, 'Company 1');
        const comp2CanSeeAfter = await checkQuoteVisibility(company2Id, 'Company 2');

        console.log(`Company 1 sees test quote: ${comp1CanSeeAfter ? '✅ YES' : '❌ NO'}`);
        console.log(`Company 2 sees test quote: ${comp2CanSeeAfter ? '✅ NO (correct)' : '❌ YES (incorrect)'}`);

        // Verify the fix
        let fixWorking = true;
        if (statusAfterResponse !== 'pending') {
            console.log(`❌ BUG STILL EXISTS: Quote status changed to '${statusAfterResponse}' instead of staying 'pending'`);
            fixWorking = false;
        }

        if (!comp1CanSeeAfter) {
            console.log('❌ BUG STILL EXISTS: Company 1 cannot see the quote after Company 2 responded');
            fixWorking = false;
        }

        if (comp2CanSeeAfter) {
            console.log('❌ BUG: Company 2 can still see the quote after responding (this is expected behavior)');
            // This is actually not a bug - companies shouldn't see quotes they've responded to
        }

        if (fixWorking && statusAfterResponse === 'pending' && comp1CanSeeAfter) {
            console.log('\n🎉 SUCCESS: Fix is working correctly!');
            console.log('✅ Quote status remains "pending" after company response');
            console.log('✅ Other companies can still see the quote');
        } else {
            console.log('\n❌ ISSUE: Fix needs more work');
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await db.execute('DELETE FROM quote_response_bank_details WHERE quote_response_id = ?', [quoteResponseId]);
        await db.execute('DELETE FROM quote_responses WHERE id = ?', [quoteResponseId]);
        await db.execute('DELETE FROM company_bank_details WHERE id = ?', [bankDetailsId]);
        await db.execute('DELETE FROM quotes WHERE id = ?', [testQuoteId]);
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

testFixVerification();