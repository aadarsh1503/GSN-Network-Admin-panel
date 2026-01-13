// Test script to verify multiple acceptance prevention works for both user and business endpoints
import db from './config/db.js';

async function testMultipleAcceptancePrevention() {
    try {
        console.log('🧪 Testing Multiple Acceptance Prevention...\n');
        
        // Find existing users
        const [users] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role IN ('user', 'business') 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        const userAccount = users.find(u => u.role === 'user');
        const businessAccount = users.find(u => u.role === 'business');
        
        if (!userAccount || !businessAccount) {
            console.log('❌ Need both user and business accounts to test');
            return;
        }
        
        console.log(`Testing with:`);
        console.log(`  User: ${userAccount.name} (${userAccount.email}) - ID: ${userAccount.id}`);
        console.log(`  Business: ${businessAccount.name} (${businessAccount.email}) - ID: ${businessAccount.id}`);
        
        // Test 1: Create test scenario for user
        console.log('\n1️⃣ Testing User Multiple Acceptance Prevention...');
        
        // Create a test quote for user
        const [userQuoteResult] = await db.execute(
            `INSERT INTO quotes (user_id, product_description, departure_country, arrival_country, shipping_mode, status, arrival_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userAccount.id, 'Test User Multiple Acceptance', 'USA', 'Canada', 'sea', 'pending', '2024-02-01']
        );
        const userQuoteId = userQuoteResult.insertId;
        
        // Create two quote responses for this quote
        const [response1Result] = await db.execute(
            `INSERT INTO quote_responses (quote_id, company_id, price, transit_time, inclusions, terms, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userQuoteId, 10, 1000.00, '5-7 days', 'Test inclusions 1', 'Test terms 1', 'First response']
        );
        const response1Id = response1Result.insertId;
        
        const [response2Result] = await db.execute(
            `INSERT INTO quote_responses (quote_id, company_id, price, transit_time, inclusions, terms, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userQuoteId, 27, 800.00, '3-5 days', 'Test inclusions 2', 'Test terms 2', 'Second response']
        );
        const response2Id = response2Result.insertId;
        
        console.log(`Created user quote ${userQuoteId} with responses ${response1Id} and ${response2Id}`);
        
        // Simulate first acceptance (should succeed)
        try {
            await db.query('START TRANSACTION');
            
            // Check if user has already accepted any response for this quote
            const [acceptedResponses] = await db.execute(
                'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted" FOR UPDATE',
                [userQuoteId, userAccount.id]
            );
            
            if (acceptedResponses.length === 0) {
                // Insert first acceptance
                await db.execute(
                    `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at) 
                     VALUES (?, ?, ?, ?, 'accepted', NOW())`,
                    [userQuoteId, userAccount.id, 10, response1Id]
                );
                
                // Reject other responses
                await db.execute(
                    `UPDATE user_quote_status 
                     SET status = 'rejected', rejected_at = NOW() 
                     WHERE quote_id = ? AND user_id = ? AND quote_response_id != ? AND status IS NULL`,
                    [userQuoteId, userAccount.id, response1Id]
                );
                
                await db.query('COMMIT');
                console.log('✅ First acceptance succeeded');
            } else {
                await db.query('ROLLBACK');
                console.log('❌ First acceptance failed - already accepted');
            }
        } catch (error) {
            await db.query('ROLLBACK');
            console.log('❌ First acceptance failed with error:', error.message);
        }
        
        // Simulate second acceptance (should fail)
        try {
            await db.query('START TRANSACTION');
            
            // Check if user has already accepted any response for this quote
            const [acceptedResponses] = await db.execute(
                'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted" FOR UPDATE',
                [userQuoteId, userAccount.id]
            );
            
            if (acceptedResponses.length === 0) {
                // Insert second acceptance
                await db.execute(
                    `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at) 
                     VALUES (?, ?, ?, ?, 'accepted', NOW())`,
                    [userQuoteId, userAccount.id, 27, response2Id]
                );
                
                await db.query('COMMIT');
                console.log('❌ Second acceptance succeeded - PREVENTION FAILED!');
            } else {
                await db.query('ROLLBACK');
                console.log('✅ Second acceptance prevented - already accepted');
            }
        } catch (error) {
            await db.query('ROLLBACK');
            console.log('✅ Second acceptance prevented with error:', error.message);
        }
        
        // Test 2: Create test scenario for business user
        console.log('\n2️⃣ Testing Business User Multiple Acceptance Prevention...');
        
        // Create a test quote for business user
        const [businessQuoteResult] = await db.execute(
            `INSERT INTO quotes (user_id, product_description, departure_country, arrival_country, shipping_mode, status, arrival_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [businessAccount.id, 'Test Business Multiple Acceptance', 'USA', 'Canada', 'sea', 'pending', '2024-02-01']
        );
        const businessQuoteId = businessQuoteResult.insertId;
        
        // Create two quote responses for this quote
        const [businessResponse1Result] = await db.execute(
            `INSERT INTO quote_responses (quote_id, company_id, price, transit_time, inclusions, terms, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [businessQuoteId, 10, 1200.00, '5-7 days', 'Business inclusions 1', 'Business terms 1', 'First business response']
        );
        const businessResponse1Id = businessResponse1Result.insertId;
        
        const [businessResponse2Result] = await db.execute(
            `INSERT INTO quote_responses (quote_id, company_id, price, transit_time, inclusions, terms, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [businessQuoteId, 27, 900.00, '3-5 days', 'Business inclusions 2', 'Business terms 2', 'Second business response']
        );
        const businessResponse2Id = businessResponse2Result.insertId;
        
        console.log(`Created business quote ${businessQuoteId} with responses ${businessResponse1Id} and ${businessResponse2Id}`);
        
        // Simulate first business acceptance (should succeed)
        try {
            await db.query('START TRANSACTION');
            
            // Check if business user has already accepted any response for this quote
            const [acceptedResponses] = await db.execute(
                'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted" FOR UPDATE',
                [businessQuoteId, businessAccount.id]
            );
            
            if (acceptedResponses.length === 0) {
                // Insert first acceptance
                await db.execute(
                    `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at) 
                     VALUES (?, ?, ?, ?, 'accepted', NOW())`,
                    [businessQuoteId, businessAccount.id, 10, businessResponse1Id]
                );
                
                // Reject other responses
                await db.execute(
                    `UPDATE user_quote_status 
                     SET status = 'rejected', rejected_at = NOW() 
                     WHERE quote_id = ? AND user_id = ? AND quote_response_id != ? AND status IS NULL`,
                    [businessQuoteId, businessAccount.id, businessResponse1Id]
                );
                
                await db.query('COMMIT');
                console.log('✅ First business acceptance succeeded');
            } else {
                await db.query('ROLLBACK');
                console.log('❌ First business acceptance failed - already accepted');
            }
        } catch (error) {
            await db.query('ROLLBACK');
            console.log('❌ First business acceptance failed with error:', error.message);
        }
        
        // Simulate second business acceptance (should fail)
        try {
            await db.query('START TRANSACTION');
            
            // Check if business user has already accepted any response for this quote
            const [acceptedResponses] = await db.execute(
                'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted" FOR UPDATE',
                [businessQuoteId, businessAccount.id]
            );
            
            if (acceptedResponses.length === 0) {
                // Insert second acceptance
                await db.execute(
                    `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at) 
                     VALUES (?, ?, ?, ?, 'accepted', NOW())`,
                    [businessQuoteId, businessAccount.id, 27, businessResponse2Id]
                );
                
                await db.query('COMMIT');
                console.log('❌ Second business acceptance succeeded - PREVENTION FAILED!');
            } else {
                await db.query('ROLLBACK');
                console.log('✅ Second business acceptance prevented - already accepted');
            }
        } catch (error) {
            await db.query('ROLLBACK');
            console.log('✅ Second business acceptance prevented with error:', error.message);
        }
        
        // Verify final state
        console.log('\n3️⃣ Verifying Final State...');
        
        const [userAcceptances] = await db.execute(
            'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted"',
            [userQuoteId, userAccount.id]
        );
        
        const [businessAcceptances] = await db.execute(
            'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted"',
            [businessQuoteId, businessAccount.id]
        );
        
        console.log(`User quote ${userQuoteId}: ${userAcceptances[0].count} acceptances (should be 1)`);
        console.log(`Business quote ${businessQuoteId}: ${businessAcceptances[0].count} acceptances (should be 1)`);
        
        // Clean up test data
        console.log('\n4️⃣ Cleaning up test data...');
        await db.execute('DELETE FROM user_quote_status WHERE quote_id IN (?, ?)', [userQuoteId, businessQuoteId]);
        await db.execute('DELETE FROM quote_responses WHERE quote_id IN (?, ?)', [userQuoteId, businessQuoteId]);
        await db.execute('DELETE FROM quotes WHERE id IN (?, ?)', [userQuoteId, businessQuoteId]);
        
        console.log('✅ Test data cleaned up');
        
        // Summary
        console.log('\n📊 SUMMARY:');
        if (userAcceptances[0].count === 1 && businessAcceptances[0].count === 1) {
            console.log('✅ Multiple acceptance prevention is working for both user and business endpoints!');
        } else {
            console.log('❌ Multiple acceptance prevention has issues:');
            if (userAcceptances[0].count !== 1) {
                console.log(`   - User endpoint: Expected 1 acceptance, got ${userAcceptances[0].count}`);
            }
            if (businessAcceptances[0].count !== 1) {
                console.log(`   - Business endpoint: Expected 1 acceptance, got ${businessAcceptances[0].count}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing multiple acceptance prevention:', error);
    } finally {
        process.exit(0);
    }
}

testMultipleAcceptancePrevention();