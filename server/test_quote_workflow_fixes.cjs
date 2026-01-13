const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testQuoteWorkflowFixes() {
    try {
        console.log('🧪 TESTING QUOTE WORKFLOW FIXES');
        console.log('===============================\n');

        console.log('✅ FIXES IMPLEMENTED:');
        console.log('1. Prevent multiple payment proof uploads per quote');
        console.log('2. Fix quote status updates when accepting responses');
        console.log('3. Update quote status when payment is verified');
        console.log('4. Hide payment upload for other companies once uploaded to one');

        // Test the validation query for multiple payment uploads
        console.log('\n🔍 Testing multiple payment upload prevention...');
        
        const testQuoteId = 52; // Known quote with multiple payment uploads
        const testUserId = 11;  // Testing-user

        const [existingPayments] = await db.execute(
            'SELECT pp.id, pp.company_id, c.name as company_name FROM payment_proofs pp JOIN users c ON pp.company_id = c.id WHERE pp.quote_id = ? AND pp.user_id = ?',
            [testQuoteId, testUserId]
        );

        console.log(`Found ${existingPayments.length} existing payment uploads for quote ${testQuoteId}:`);
        existingPayments.forEach((payment, index) => {
            console.log(`   ${index + 1}. Company: ${payment.company_name} (ID: ${payment.company_id})`);
        });

        if (existingPayments.length > 1) {
            console.log('⚠️  Multiple payment uploads detected - this should now be prevented by backend validation');
        } else if (existingPayments.length === 1) {
            console.log('✅ Single payment upload found - this is correct');
        } else {
            console.log('ℹ️  No payment uploads found for this quote');
        }

        // Test quote status logic
        console.log('\n🔍 Testing quote status logic...');
        
        const [quotes] = await db.execute(`
            SELECT q.id, q.status, q.product_description,
                   COUNT(qr.id) as response_count,
                   COUNT(CASE WHEN uqs.status = 'accepted' THEN 1 END) as accepted_count,
                   COUNT(CASE WHEN pp.id IS NOT NULL THEN 1 END) as payment_proof_count,
                   COUNT(CASE WHEN pv.verification_status = 'verified' THEN 1 END) as verified_payment_count
            FROM quotes q
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE q.id IN (52, 54)
            GROUP BY q.id
        `);

        quotes.forEach(quote => {
            console.log(`\nQuote ${quote.id}:`);
            console.log(`   Current Status: ${quote.status}`);
            console.log(`   Responses: ${quote.response_count}`);
            console.log(`   Accepted: ${quote.accepted_count}`);
            console.log(`   Payment Proofs: ${quote.payment_proof_count}`);
            console.log(`   Verified Payments: ${quote.verified_payment_count}`);

            // Determine expected status
            let expectedStatus = 'pending';
            if (quote.accepted_count > 0) {
                if (quote.verified_payment_count > 0) {
                    expectedStatus = 'approved';
                } else if (quote.payment_proof_count > 0) {
                    expectedStatus = 'payment_pending';
                } else {
                    expectedStatus = 'approved'; // No payment required
                }
            }

            console.log(`   Expected Status: ${expectedStatus}`);
            if (quote.status === expectedStatus) {
                console.log('   ✅ Status is correct');
            } else {
                console.log('   ⚠️  Status needs update');
            }
        });

        console.log('\n🎯 EXPECTED BEHAVIOR AFTER FIXES:');
        console.log('=' .repeat(50));
        console.log('1. Users can only upload payment proof to ONE company per quote');
        console.log('2. Quote status updates correctly when user accepts response');
        console.log('3. Quote status becomes "approved" when payment is verified');
        console.log('4. Frontend hides payment upload for other companies');
        console.log('5. Clear error messages when trying to upload multiple payments');

        console.log('\n📋 TESTING INSTRUCTIONS:');
        console.log('=' .repeat(50));
        console.log('1. Login as user: subodhchauhan1309@gmail.com / 222333');
        console.log('2. Go to a quote with multiple company responses');
        console.log('3. Try to upload payment proof to one company - should work');
        console.log('4. Try to upload payment proof to another company - should be blocked');
        console.log('5. Accept the quote - status should update correctly');
        console.log('6. Company verifies payment - quote should become "approved"');

    } catch (error) {
        console.error('❌ Error testing quote workflow fixes:', error);
    } finally {
        await db.end();
    }
}

testQuoteWorkflowFixes();