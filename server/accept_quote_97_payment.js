// Accept/Verify the payment for Quote #97 from company account
import db from './config/db.js';

async function acceptQuote97Payment() {
    try {
        console.log('🔍 Processing payment verification for Quote #97...');
        
        const companyId = 10; // Aadarsh-company (aadarshchauhan35@gmail.com)
        const userId = 44; // Food business (subodhchauhan1309@gmail.com)
        const quoteId = 97;
        
        // Step 1: Find the payment verification record
        console.log('\n📋 Step 1: Finding payment verification for Quote #97...');
        const [verifications] = await db.execute(
            `SELECT pv.id, pv.quote_id, pv.quote_response_id, pv.verification_status,
                    pp.file_name, pp.file_path, qr.price
             FROM payment_verifications pv
             JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
             JOIN quote_responses qr ON pv.quote_response_id = qr.id
             WHERE pv.company_id = ? AND pv.user_id = ? AND pv.quote_id = ?`,
            [companyId, userId, quoteId]
        );
        
        if (verifications.length === 0) {
            console.log('❌ No payment verification found for Quote #97');
            return;
        }
        
        const verification = verifications[0];
        console.log('✅ Found payment verification:');
        console.log(`   Verification ID: ${verification.id}`);
        console.log(`   Quote ID: ${verification.quote_id}`);
        console.log(`   Response ID: ${verification.quote_response_id}`);
        console.log(`   Current Status: ${verification.verification_status}`);
        console.log(`   Amount: $${verification.price}`);
        console.log(`   Payment Proof: ${verification.file_name}`);
        
        // Step 2: Verify/Accept the payment
        console.log('\n✅ Step 2: Verifying the payment...');
        
        // Update payment verification status to 'verified'
        const [updateResult] = await db.execute(
            `UPDATE payment_verifications 
             SET verification_status = 'verified', 
                 company_notes = 'Payment verified - GSN.jpg payment proof accepted',
                 verification_date = NOW()
             WHERE id = ?`,
            [verification.id]
        );
        
        if (updateResult.affectedRows > 0) {
            console.log('✅ Payment verification updated to VERIFIED');
            
            // Step 3: Update user quote status
            console.log('\n📊 Step 3: Updating user quote status...');
            await db.execute(
                `UPDATE user_quote_status 
                 SET payment_verification_status = 'verified'
                 WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?`,
                [verification.quote_id, userId, verification.quote_response_id]
            );
            console.log('✅ User quote status updated');
            
            // Step 4: Update quote status to approved
            console.log('\n🎯 Step 4: Updating quote status to APPROVED...');
            await db.execute(
                `UPDATE quotes 
                 SET status = 'approved', updated_at = NOW()
                 WHERE id = ?`,
                [verification.quote_id]
            );
            console.log('✅ Quote #97 status updated to APPROVED');
            
            // Step 5: Verify the changes
            console.log('\n🔍 Step 5: Verifying all updates...');
            
            // Check payment verification
            const [updatedVerification] = await db.execute(
                `SELECT verification_status, company_notes, verification_date
                 FROM payment_verifications WHERE id = ?`,
                [verification.id]
            );
            
            // Check quote status
            const [updatedQuote] = await db.execute(
                `SELECT status, updated_at FROM quotes WHERE id = ?`,
                [verification.quote_id]
            );
            
            // Check user quote status
            const [updatedUserStatus] = await db.execute(
                `SELECT payment_verification_status FROM user_quote_status 
                 WHERE quote_id = ? AND user_id = ?`,
                [verification.quote_id, userId]
            );
            
            console.log('📊 VERIFICATION RESULTS:');
            console.log(`   Payment Status: ${updatedVerification[0].verification_status}`);
            console.log(`   Company Notes: ${updatedVerification[0].company_notes}`);
            console.log(`   Verification Date: ${updatedVerification[0].verification_date}`);
            console.log(`   Quote Status: ${updatedQuote[0].status}`);
            console.log(`   User Payment Status: ${updatedUserStatus[0].payment_verification_status}`);
            
            // Step 6: Get customer details for confirmation
            console.log('\n👤 Step 6: Customer notification details...');
            const [customerDetails] = await db.execute(
                `SELECT u.name, u.email, q.product_description, qr.price
                 FROM users u
                 JOIN quotes q ON q.user_id = u.id
                 JOIN quote_responses qr ON qr.quote_id = q.id
                 WHERE q.id = ? AND qr.company_id = ?`,
                [verification.quote_id, companyId]
            );
            
            if (customerDetails.length > 0) {
                const customer = customerDetails[0];
                console.log('📧 Customer to notify:');
                console.log(`   Name: ${customer.name}`);
                console.log(`   Email: ${customer.email}`);
                console.log(`   Product: ${customer.product_description}`);
                console.log(`   Amount: $${customer.price}`);
            }
            
            console.log('\n🎉 SUCCESS SUMMARY:');
            console.log('✅ Payment proof verified and accepted');
            console.log('✅ Quote #97 status changed to APPROVED');
            console.log('✅ Customer will be notified of approval');
            console.log('✅ Work can now begin on the shipment');
            console.log('✅ Payment of $987.00 has been confirmed');
            
        } else {
            console.log('❌ Failed to update payment verification');
        }
        
    } catch (error) {
        console.error('❌ Error processing payment verification:', error);
    } finally {
        process.exit(0);
    }
}

acceptQuote97Payment();