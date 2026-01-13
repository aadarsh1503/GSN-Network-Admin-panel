// Test the specific scenario: Company responds but user hasn't accepted yet
import db from './server/config/db.js';

async function testSpecificScenario() {
    try {
        console.log('🧪 Testing Specific Scenario: Company responds but user hasn\'t accepted\n');

        // 1. Create a fresh test quote
        const [quoteResult] = await db.execute(`
            INSERT INTO quotes (
                user_id, shipping_mode, arrival_date, departure_country, arrival_country, 
                product_description, status, created_at
            ) VALUES (1, 'sea', '2024-12-31', 'USA', 'Canada', 'Test Product for Multiple Responses', 'pending', NOW())
        `);
        
        const testQuoteId = quoteResult.insertId;
        console.log(`✅ Created fresh test quote #${testQuoteId}`);

        // 2. Get test companies
        const [companies] = await db.execute(`
            SELECT id, name, country
            FROM users 
            WHERE role IN ('company', 'business') 
            AND id != 1
            LIMIT 3
        `);

        if (companies.length < 2) {
            console.log('❌ Need at least 2 companies for testing');
            return;
        }

        const company1 = companies[0];
        const company2 = companies[1];
        
        console.log(`🏢 Company 1: ${company1.name} (ID: ${company1.id})`);
        console.log(`🏢 Company 2: ${company2.name} (ID: ${company2.id})\n`);

        // 3. Check initial state - both companies should see the quote
        console.log('📋 Step 1: Initial state - both companies should see the quote');
        
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
            `, [testQuoteId, companyId, companyId]);
            
            return result[0].count > 0;
        };

        const company1Initial = await checkAvailability(company1.id, company1.name);
        const company2Initial = await checkAvailability(company2.id, company2.name);
        
        console.log(`   ${company1.name}: ${company1Initial ? 'CAN SEE' : 'CANNOT SEE'} the quote`);
        console.log(`   ${company2.name}: ${company2Initial ? 'CAN SEE' : 'CANNOT SEE'} the quote`);
        
        if (company1Initial && company2Initial) {
            console.log('   ✅ Both companies can see the quote initially\n');
        } else {
            console.log('   ❌ Initial state is wrong\n');
            return;
        }

        // 4. Company 1 responds to the quote
        console.log('📋 Step 2: Company 1 responds to the quote');
        
        await db.execute(`
            INSERT INTO quote_responses (
                quote_id, company_id, price, transit_time, status, created_at
            ) VALUES (?, ?, 1500.00, '7-10 days', 'pending', NOW())
        `, [testQuoteId, company1.id]);
        
        console.log(`   ✅ ${company1.name} submitted response\n`);

        // 5. Check state after Company 1 responds - Company 2 should STILL see the quote
        console.log('📋 Step 3: After Company 1 responds - Company 2 should STILL see the quote');
        
        const company1AfterResponse = await checkAvailability(company1.id, company1.name);
        const company2AfterResponse = await checkAvailability(company2.id, company2.name);
        
        console.log(`   ${company1.name}: ${company1AfterResponse ? 'CAN SEE' : 'CANNOT SEE'} the quote (should be CANNOT SEE)`);
        console.log(`   ${company2.name}: ${company2AfterResponse ? 'CAN SEE' : 'CANNOT SEE'} the quote (should be CAN SEE)`);
        
        if (!company1AfterResponse && company2AfterResponse) {
            console.log('   ✅ CORRECT: Company 1 cannot see (already responded), Company 2 can still see\n');
        } else if (!company1AfterResponse && !company2AfterResponse) {
            console.log('   ❌ BUG CONFIRMED: Company 2 cannot see the quote even though they haven\'t responded\n');
            
            // Let's debug why Company 2 can't see it
            console.log('🔍 Debugging why Company 2 cannot see the quote:');
            
            // Check each condition
            const [quoteStatus] = await db.execute('SELECT status FROM quotes WHERE id = ?', [testQuoteId]);
            console.log(`   Quote status: ${quoteStatus[0].status} (should be pending/approved)`);
            
            const [company2Responded] = await db.execute(`
                SELECT COUNT(*) as count FROM quote_responses 
                WHERE quote_id = ? AND company_id = ?
            `, [testQuoteId, company2.id]);
            console.log(`   Company 2 has responded: ${company2Responded[0].count > 0 ? 'YES' : 'NO'} (should be NO)`);
            
            const [userAccepted] = await db.execute(`
                SELECT COUNT(*) as count FROM user_quote_status 
                WHERE quote_id = ? AND status = 'accepted'
            `, [testQuoteId]);
            console.log(`   User has accepted any response: ${userAccepted[0].count > 0 ? 'YES' : 'NO'} (should be NO)`);
            
            const [isOwner] = await db.execute('SELECT user_id FROM quotes WHERE id = ?', [testQuoteId]);
            console.log(`   Company 2 is quote owner: ${isOwner[0].user_id === company2.id ? 'YES' : 'NO'} (should be NO)`);
            
        } else {
            console.log('   ❓ Unexpected state\n');
        }

        // 6. Company 2 also responds
        console.log('📋 Step 4: Company 2 also responds to the quote');
        
        await db.execute(`
            INSERT INTO quote_responses (
                quote_id, company_id, price, transit_time, status, created_at
            ) VALUES (?, ?, 1200.00, '5-7 days', 'pending', NOW())
        `, [testQuoteId, company2.id]);
        
        console.log(`   ✅ ${company2.name} submitted response\n`);

        // 7. Check state after both respond - neither should see the quote
        console.log('📋 Step 5: After both companies respond - neither should see the quote');
        
        const company1Final = await checkAvailability(company1.id, company1.name);
        const company2Final = await checkAvailability(company2.id, company2.name);
        
        console.log(`   ${company1.name}: ${company1Final ? 'CAN SEE' : 'CANNOT SEE'} the quote (should be CANNOT SEE)`);
        console.log(`   ${company2.name}: ${company2Final ? 'CAN SEE' : 'CANNOT SEE'} the quote (should be CANNOT SEE)`);
        
        if (!company1Final && !company2Final) {
            console.log('   ✅ CORRECT: Neither company can see the quote after both responded\n');
        } else {
            console.log('   ❌ Something is wrong\n');
        }

        // 8. Show all responses for this quote
        console.log('📋 Final State - All responses for this quote:');
        const [allResponses] = await db.execute(`
            SELECT qr.id, u.name as company_name, qr.price, qr.status
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = ?
        `, [testQuoteId]);
        
        allResponses.forEach((response, index) => {
            console.log(`   ${index + 1}. ${response.company_name}: $${response.price} (${response.status})`);
        });

        // 9. Check user acceptance status
        const [acceptances] = await db.execute(`
            SELECT COUNT(*) as count FROM user_quote_status 
            WHERE quote_id = ? AND status = 'accepted'
        `, [testQuoteId]);
        
        console.log(`\n📋 User acceptance status: ${acceptances[0].count > 0 ? 'ACCEPTED' : 'NOT ACCEPTED YET'}`);
        
        if (acceptances[0].count === 0) {
            console.log('   ✅ Quote is still open for user to accept/reject responses');
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await db.execute('DELETE FROM quote_responses WHERE quote_id = ?', [testQuoteId]);
        await db.execute('DELETE FROM quotes WHERE id = ?', [testQuoteId]);
        console.log('   ✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Error testing specific scenario:', error);
    } finally {
        process.exit(0);
    }
}

testSpecificScenario();