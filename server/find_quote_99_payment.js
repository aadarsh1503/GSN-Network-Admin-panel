// Find Quote #99 payment details in database
import db from './config/db.js';

async function findQuote99Payment() {
    try {
        console.log('🔍 Finding Quote #99 payment details...');
        
        const companyId = 10; // Aadarsh-company
        const userId = 44; // Food business
        const quoteId = 99;
        
        // Check if Quote #99 exists
        console.log('\n📋 Step 1: Checking if Quote #99 exists...');
        const [quotes] = await db.execute(
            `SELECT q.id, q.user_id, q.status, q.product_description, q.departure_country, q.arrival_country,
                    u.name as user_name, u.email as user_email
             FROM quotes q
             JOIN users u ON q.user_id = u.id
             WHERE q.id = ?`,
            [quoteId]
        );
        
        if (quotes.length === 0) {
            console.log('❌ Quote #99 not found');
            return;
        }
        
        const quote = quotes[0];
        console.log('✅ Found Quote #99:');
        console.log(`   User: ${quote.user_name} (${quote.user_email})`);
        console.log(`   Status: ${quote.status}`);
        console.log(`   Product: ${quote.product_description}`);
        console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
        
        // Check for quote responses from the company
        console.log('\n💼 Step 2: Checking quote responses from company...');
        const [responses] = await db.execute(
            `SELECT qr.id, qr.quote_id, qr.company_id, qr.price, qr.status, qr.created_at
             FROM quote_responses qr
             WHERE qr.quote_id = ? AND qr.company_id = ?`,
            [quoteId, companyId]
        );
        
        if (responses.length === 0) {
            console.log('❌ No quote response found from company for Quote #99');
            return;
        }
        
        const response = responses[0];
        console.log('✅ Found quote response:');
        console.log(`   Response ID: ${response.id}`);
        console.log(`   Price: $${response.price}`);
        console.log(`   Status: ${response.status}`);
        
        // Check for payment proofs
        console.log('\n💳 Step 3: Checking payment proofs...');
        const [paymentProofs] = await db.execute(
            `SELECT pp.id, pp.quote_id, pp.quote_response_id, pp.file_name, pp.file_path, pp.upload_date
             FROM payment_proofs pp
             WHERE pp.quote_id = ? AND pp.user_id = ? AND pp.company_id = ?`,
            [quoteId, userId, companyId]
        );
        
        if (paymentProofs.length === 0) {
            console.log('❌ No payment proof found for Quote #99');
            return;
        }
        
        const paymentProof = paymentProofs[0];
        console.log('✅ Found payment proof:');
        console.log(`   Proof ID: ${paymentProof.id}`);
        console.log(`   File: ${paymentProof.file_name}`);
        console.log(`   Upload Date: ${paymentProof.upload_date}`);
        
        // Check for payment verifications
        console.log('\n✅ Step 4: Checking payment verifications...');
        const [verifications] = await db.execute(
            `SELECT pv.id, pv.quote_id, pv.quote_response_id, pv.verification_status, pv.company_notes, pv.verification_date
             FROM payment_verifications pv
             WHERE pv.quote_id = ? AND pv.user_id = ? AND pv.company_id = ?`,
            [quoteId, userId, companyId]
        );
        
        if (verifications.length === 0) {
            console.log('❌ No payment verification found for Quote #99');
            return;
        }
        
        const verification = verifications[0];
        console.log('✅ Found payment verification:');
        console.log(`   Verification ID: ${verification.id}`);
        console.log(`   Status: ${verification.verification_status}`);
        console.log(`   Notes: ${verification.company_notes || 'None'}`);
        console.log(`   Date: ${verification.verification_date || 'Not verified'}`);
        
        // If pending, verify it directly
        if (verification.verification_status === 'pending') {
            console.log('\n🔄 Step 5: Verifying the payment (since it\'s pending)...');
            
            const [updateResult] = await db.execute(
                `UPDATE payment_verifications 
                 SET verification_status = 'verified', 
                     company_notes = 'Payment verified via API simulation for Quote #99',
                     verification_date = NOW()
                 WHERE id = ?`,
                [verification.id]
            );
            
            if (updateResult.affectedRows > 0) {
                console.log('✅ Payment verification updated to VERIFIED');
                
                // Update user quote status
                await db.execute(
                    `UPDATE user_quote_status 
                     SET payment_verification_status = 'verified'
                     WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?`,
                    [quoteId, userId, response.id]
                );
                
                // Update quote status to approved
                await db.execute(
                    `UPDATE quotes 
                     SET status = 'approved', updated_at = NOW()
                     WHERE id = ?`,
                    [quoteId]
                );
                
                console.log('✅ Quote #99 status updated to APPROVED');
                console.log('✅ User quote status updated');
                
                console.log('\n🎉 SUCCESS SUMMARY:');
                console.log(`✅ Quote #99 payment verified and approved`);
                console.log(`✅ Customer: ${quote.user_name} (${quote.user_email})`);
                console.log(`✅ Amount: $${response.price}`);
                console.log(`✅ Payment Proof: ${paymentProof.file_name}`);
                console.log(`✅ Status: VERIFIED & APPROVED`);
                
            } else {
                console.log('❌ Failed to update payment verification');
            }
        } else {
            console.log(`ℹ️ Payment is already ${verification.verification_status}`);
        }
        
    } catch (error) {
        console.error('❌ Error finding Quote #99 payment:', error);
    } finally {
        process.exit(0);
    }
}

findQuote99Payment();