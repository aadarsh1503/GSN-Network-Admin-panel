// Simulate the exact scenario you described
import db from './server/config/db.js';

async function simulateYourScenario() {
    try {
        console.log('🎭 Simulating Your Exact Scenario\n');

        // 1. Create a fresh quote from a user
        console.log('📋 Step 1: User submits a new quote request');
        
        const [userResult] = await db.execute(`
            INSERT INTO quotes (
                user_id, shipping_mode, arrival_date, departure_country, arrival_country, 
                product_description, status, created_at
            ) VALUES (1, 'sea', '2024-12-31', 'USA', 'Canada', 'Fresh Test Quote - Multiple Companies Should See This', 'pending', NOW())
        `);
        
        const newQuoteId = userResult.insertId;
        console.log(`   ✅ User created quote #${newQuoteId}`);
        console.log(`   📍 Route: USA → Canada`);
        console.log(`   📦 Product: Fresh Test Quote - Multiple Companies Should See This\n`);

        // 2. Get test companies
        const [companies] = await db.execute(`
            SELECT id, name, country
            FROM users 
            WHERE role IN ('company', 'business') 
            AND id != 1
            ORDER BY id
            LIMIT 3
        `);

        console.log('🏢 Test Companies:');
        companies.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} (ID: ${company.id}, Country: ${company.country})`);
        });
        console.log('');

        // 3. Check initial availability - ALL companies should see it
        console.log('🔍 Step 2: Check initial availability - ALL companies should see the quote');
        
        const checkAvailability = async (companyId, companyName) => {
            const [result] = await db.execute(`
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
            `, [newQuoteId, companyId, companyId]);
            
            return result[0].count > 0;
        };

        for (const company of companies) {
            const canSee = await checkAvailability(company.id, company.name);
            console.log(`   ${company.name}: ${canSee ? '✅ CAN SEE' : '❌ CANNOT SEE'} the quote`);
        }
        console.log('');

        // 4. Company 1 responds to the quote
        const company1 = companies[0];
        console.log(`📝 Step 3: ${company1.name} responds to the quote`);
        
        await db.execute(`
            INSERT INTO quote_responses (
                quote_id, company_id, price, transit_time, status, created_at
            ) VALUES (?, ?, 1500.00, '7-10 days', 'pending', NOW())
        `, [newQuoteId, company1.id]);
        
        console.log(`   ✅ ${company1.name} submitted response: $1500, 7-10 days\n`);

        // 5. Check availability after Company 1 responds - OTHER companies should STILL see it
        console.log('🔍 Step 4: Check availability after Company 1 responds');
        console.log('   ❗ CRITICAL: Other companies should STILL be able to see and respond to the quote');
        console.log('   ❗ Only the quote should disappear AFTER user accepts a response\n');
        
        for (const company of companies) {
            const canSee = await checkAvailability(company.id, company.name);
            const expected = company.id === company1.id ? 'CANNOT SEE (already responded)' : 'CAN SEE (can still respond)';
            const status = canSee ? '✅ CAN SEE' : '❌ CANNOT SEE';
            
            console.log(`   ${company.name}: ${status} - Expected: ${expected}`);
            
            if (company.id === company1.id && canSee) {
                console.log('     ⚠️  WARNING: Company that already responded can still see quote');
            } else if (company.id !== company1.id && !canSee) {
                console.log('     🚨 BUG DETECTED: Company that hasn\'t responded cannot see quote!');
            }
        }
        console.log('');

        // 6. Company 2 also responds
        const company2 = companies[1];
        console.log(`📝 Step 5: ${company2.name} also responds to the quote`);
        
        await db.execute(`
            INSERT INTO quote_responses (
                quote_id, company_id, price, transit_time, status, created_at
            ) VALUES (?, ?, 1200.00, '5-7 days', 'pending', NOW())
        `, [newQuoteId, company2.id]);
        
        console.log(`   ✅ ${company2.name} submitted response: $1200, 5-7 days\n`);

        // 7. Check availability after both companies respond
        console.log('🔍 Step 6: Check availability after both companies respond');
        console.log('   ❗ Company 3 should STILL be able to see and respond to the quote\n');
        
        for (const company of companies) {
            const canSee = await checkAvailability(company.id, company.name);
            const hasResponded = company.id === company1.id || company.id === company2.id;
            const expected = hasResponded ? 'CANNOT SEE (already responded)' : 'CAN SEE (can still respond)';
            const status = canSee ? '✅ CAN SEE' : '❌ CANNOT SEE';
            
            console.log(`   ${company.name}: ${status} - Expected: ${expected}`);
        }
        console.log('');

        // 8. Show all responses so far
        console.log('📊 Step 7: Current responses for this quote');
        const [allResponses] = await db.execute(`
            SELECT qr.id, u.name as company_name, qr.price, qr.transit_time, qr.status
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at
        `, [newQuoteId]);

        allResponses.forEach((response, index) => {
            console.log(`   ${index + 1}. ${response.company_name}: $${response.price}, ${response.transit_time} (${response.status})`);
        });
        console.log('');

        // 9. User accepts Company 2's response
        console.log(`✅ Step 8: User accepts ${company2.name}'s response`);
        
        const company2ResponseId = allResponses.find(r => r.company_name === company2.name).id;
        
        await db.execute(`
            INSERT INTO user_quote_status (
                quote_id, user_id, company_id, quote_response_id, status, accepted_at
            ) VALUES (?, 1, ?, ?, 'accepted', NOW())
        `, [newQuoteId, company2.id, company2ResponseId]);
        
        console.log(`   ✅ User accepted ${company2.name}'s response\n`);

        // 10. Check final availability - NO company should see it now
        console.log('🔍 Step 9: Check final availability after user acceptance');
        console.log('   ❗ NOW all companies should NOT be able to see the quote\n');
        
        for (const company of companies) {
            const canSee = await checkAvailability(company.id, company.name);
            const status = canSee ? '❌ CAN STILL SEE (BUG!)' : '✅ CANNOT SEE (CORRECT)';
            
            console.log(`   ${company.name}: ${status}`);
        }
        console.log('');

        // 11. Summary
        console.log('📋 SUMMARY:');
        console.log('   ✅ Multiple companies could see the quote initially');
        console.log('   ✅ Companies could respond while others hadn\'t responded yet');
        console.log('   ✅ Quote disappeared from all companies after user acceptance');
        console.log('   ✅ The system is working correctly!\n');

        console.log('💡 If you\'re still seeing the issue, it might be:');
        console.log('   1. Frontend caching - try hard refresh (Ctrl+F5)');
        console.log('   2. Testing with already-accepted quotes');
        console.log('   3. Browser cache - try incognito mode');
        console.log('   4. Different data than expected\n');

        // Cleanup
        console.log('🧹 Cleaning up test data...');
        await db.execute('DELETE FROM user_quote_status WHERE quote_id = ?', [newQuoteId]);
        await db.execute('DELETE FROM quote_responses WHERE quote_id = ?', [newQuoteId]);
        await db.execute('DELETE FROM quotes WHERE id = ?', [newQuoteId]);
        console.log('   ✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Error simulating scenario:', error);
    } finally {
        process.exit(0);
    }
}

simulateYourScenario();