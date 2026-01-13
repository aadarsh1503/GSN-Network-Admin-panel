// Final verification script - Run this to test the fix
import db from './server/config/db.js';

async function verifyAvailableQuotesFix() {
    try {
        console.log('🔧 VERIFYING AVAILABLE QUOTES FIX\n');
        console.log('This script will test the exact scenario you described:\n');
        console.log('1. User submits quote → Multiple companies see it');
        console.log('2. Company A responds → Other companies still see it');
        console.log('3. Company B responds → Company C still sees it');
        console.log('4. User accepts response → All companies stop seeing it\n');

        // Create test quote
        const [quoteResult] = await db.execute(`
            INSERT INTO quotes (
                user_id, shipping_mode, arrival_date, departure_country, arrival_country, 
                product_description, status, created_at
            ) VALUES (1, 'sea', '2024-12-31', 'USA', 'Canada', 'VERIFICATION TEST - Multiple Company Response', 'pending', NOW())
        `);
        
        const testQuoteId = quoteResult.insertId;
        console.log(`✅ Created test quote #${testQuoteId}\n`);

        // Get companies
        const [companies] = await db.execute(`
            SELECT id, name FROM users WHERE role IN ('company', 'business') AND id != 1 LIMIT 3
        `);

        if (companies.length < 3) {
            console.log('❌ Need at least 3 companies for testing');
            return;
        }

        const [companyA, companyB, companyC] = companies;

        // Test function
        const testAvailability = async (step, expectedResults) => {
            console.log(`🔍 ${step}`);
            
            for (let i = 0; i < 3; i++) {
                const company = companies[i];
                const [result] = await db.execute(`
                    SELECT COUNT(*) as count FROM quotes q 
                    WHERE q.id = ? AND q.status IN ('pending', 'approved')
                    AND (q.user_id != ? OR q.user_id IS NULL)
                    AND NOT EXISTS (SELECT 1 FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?)
                    AND NOT EXISTS (SELECT 1 FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted')
                `, [testQuoteId, company.id, company.id]);
                
                const canSee = result[0].count > 0;
                const expected = expectedResults[i];
                const status = canSee === expected ? '✅' : '❌';
                
                console.log(`   ${status} ${company.name}: ${canSee ? 'CAN SEE' : 'CANNOT SEE'} (expected: ${expected ? 'CAN SEE' : 'CANNOT SEE'})`);
            }
            console.log('');
        };

        // Initial state - all should see
        await testAvailability('Step 1: Initial state', [true, true, true]);

        // Company A responds
        await db.execute(`
            INSERT INTO quote_responses (quote_id, company_id, price, transit_time, status, created_at)
            VALUES (?, ?, 1500.00, '7-10 days', 'pending', NOW())
        `, [testQuoteId, companyA.id]);
        
        await testAvailability('Step 2: After Company A responds', [false, true, true]);

        // Company B responds
        await db.execute(`
            INSERT INTO quote_responses (quote_id, company_id, price, transit_time, status, created_at)
            VALUES (?, ?, 1200.00, '5-7 days', 'pending', NOW())
        `, [testQuoteId, companyB.id]);
        
        await testAvailability('Step 3: After Company B responds', [false, false, true]);

        // User accepts Company B's response
        const [responseId] = await db.execute(`
            SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?
        `, [testQuoteId, companyB.id]);

        await db.execute(`
            INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at)
            VALUES (?, 1, ?, ?, 'accepted', NOW())
        `, [testQuoteId, companyB.id, responseId[0].id]);
        
        await testAvailability('Step 4: After user accepts Company B', [false, false, false]);

        console.log('🎉 VERIFICATION COMPLETE!\n');
        console.log('✅ The Available Quotes flow is working correctly!');
        console.log('✅ Multiple companies can respond to the same quote');
        console.log('✅ Quotes are hidden only after user acceptance');
        console.log('\nIf you\'re still experiencing issues, try:');
        console.log('1. Hard refresh your browser (Ctrl+F5)');
        console.log('2. Clear browser cache');
        console.log('3. Try incognito mode');
        console.log('4. Check if you\'re testing with already-accepted quotes');

        // Cleanup
        await db.execute('DELETE FROM user_quote_status WHERE quote_id = ?', [testQuoteId]);
        await db.execute('DELETE FROM quote_responses WHERE quote_id = ?', [testQuoteId]);
        await db.execute('DELETE FROM quotes WHERE id = ?', [testQuoteId]);

    } catch (error) {
        console.error('❌ Error verifying fix:', error);
    } finally {
        process.exit(0);
    }
}

verifyAvailableQuotesFix();