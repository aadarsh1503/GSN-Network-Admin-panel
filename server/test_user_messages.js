// Test script to verify user sees correct payment status messages
import db from './config/db.js';

async function testUserMessages() {
    try {
        console.log('🧪 Testing User Payment Status Messages...\n');
        
        // Get the actual user and company
        const [users] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE email IN (?, ?)
        `, ['subodhchauhan1309@gmail.com', 'aadarshchauhan35@gmail.com']);
        
        const userAccount = users.find(u => u.role === 'user');
        const companyAccount = users.find(u => u.role === 'company');
        
        console.log(`User: ${userAccount.name} (${userAccount.email})`);
        console.log(`Company: ${companyAccount.name} (${companyAccount.email})`);
        
        // Check what the user should see for each scenario
        console.log('\n📱 USER INTERFACE MESSAGES TEST:\n');
        
        // Scenario 1: Quote response with bank details, no payment proof uploaded
        console.log('1️⃣ SCENARIO: Quote response with bank details, no payment uploaded');
        console.log('   USER SHOULD SEE: "Payment Required - Please make payment and upload proof"');
        console.log('   BUTTON: "Upload Payment Proof"');
        console.log('   COLOR: Blue background\n');
        
        // Scenario 2: Payment proof uploaded, not accepted yet
        console.log('2️⃣ SCENARIO: Payment proof uploaded, quote not accepted yet');
        console.log('   USER SHOULD SEE: "Payment Proof Uploaded ✓ - You can now accept this quote"');
        console.log('   BUTTON: "Accept Quote" (enabled)');
        console.log('   COLOR: Green background\n');
        
        // Scenario 3: Quote accepted, payment verification pending
        console.log('3️⃣ SCENARIO: Quote accepted, payment verification pending');
        console.log('   USER SHOULD SEE: "Payment Verification Pending - Your payment proof is being verified"');
        console.log('   BUTTON: None (waiting state)');
        console.log('   COLOR: Orange background\n');
        
        // Scenario 4: Payment verified by company
        console.log('4️⃣ SCENARIO: Payment verified by company');
        console.log('   USER SHOULD SEE: "Payment Verified ✓ - Service will begin as scheduled"');
        console.log('   BUTTON: None (completed state)');
        console.log('   COLOR: Green background\n');
        
        // Scenario 5: Payment rejected by company
        console.log('5️⃣ SCENARIO: Payment rejected by company');
        console.log('   USER SHOULD SEE: "Payment Verification Failed - Contact company or upload clearer proof"');
        console.log('   BUTTON: "Upload New Payment Proof"');
        console.log('   COLOR: Red background\n');
        
        // Check actual data for these scenarios
        console.log('📊 ACTUAL DATA ANALYSIS:\n');
        
        const [quoteResponses] = await db.execute(`
            SELECT qr.id as response_id, qr.quote_id, qr.price, qr.company_id,
                   u.name as company_name,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pp.file_path as payment_proof_url,
                   pp.upload_date as payment_proof_date,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes,
                   cbd.bank_name,
                   cbd.account_number
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = q.user_id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id)
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            WHERE q.user_id = ? AND qr.company_id = ?
            ORDER BY qr.created_at DESC
            LIMIT 5
        `, [userAccount.id, companyAccount.id]);
        
        quoteResponses.forEach((response, index) => {
            console.log(`Response ${index + 1}: Quote #${response.quote_id} - Response #${response.response_id}`);
            console.log(`  Price: $${response.price}`);
            console.log(`  Company: ${response.company_name}`);
            console.log(`  Has Bank Details: ${response.bank_name ? 'YES' : 'NO'}`);
            console.log(`  User Response Status: ${response.user_response_status || 'No response'}`);
            console.log(`  Payment Proof: ${response.payment_proof_url ? 'Uploaded' : 'Not uploaded'}`);
            console.log(`  Payment Status: ${response.payment_status || 'N/A'}`);
            
            // Determine what message user should see
            let userMessage = '';
            let buttonText = '';
            let backgroundColor = '';
            
            if (response.user_response_status === 'accepted') {
                if (response.payment_status === 'verified') {
                    userMessage = '✅ Payment Verified - Service will begin as scheduled';
                    backgroundColor = 'GREEN';
                } else if (response.payment_status === 'rejected') {
                    userMessage = '❌ Payment Verification Failed - Contact company or upload clearer proof';
                    backgroundColor = 'RED';
                    buttonText = 'Upload New Payment Proof';
                } else if (response.payment_proof_url) {
                    userMessage = '🟡 Payment Verification Pending - Your payment is being verified';
                    backgroundColor = 'ORANGE';
                } else {
                    userMessage = '🔵 Payment Required - Please make payment and upload proof';
                    backgroundColor = 'BLUE';
                    buttonText = 'Upload Payment Proof';
                }
            } else {
                // Quote not accepted yet
                if (response.payment_proof_url && response.bank_name) {
                    userMessage = '🟢 Payment Proof Uploaded ✓ - You can now accept this quote';
                    backgroundColor = 'GREEN';
                    buttonText = 'Accept Quote';
                } else if (response.bank_name) {
                    userMessage = '🔵 Payment Required First - Upload payment proof before accepting';
                    backgroundColor = 'BLUE';
                    buttonText = 'Upload Payment Proof';
                } else {
                    userMessage = '⚪ Regular Quote - No payment required';
                    backgroundColor = 'WHITE';
                    buttonText = 'Accept Quote';
                }
            }
            
            console.log(`  👤 USER SEES: ${userMessage}`);
            console.log(`  🎨 BACKGROUND: ${backgroundColor}`);
            if (buttonText) {
                console.log(`  🔘 BUTTON: ${buttonText}`);
            }
            console.log('');
        });
        
        // Test company perspective
        console.log('🏢 COMPANY PERSPECTIVE:\n');
        
        const [companyPayments] = await db.execute(`
            SELECT qr.id as response_id, qr.quote_id, qr.price,
                   u.name as user_name, u.email as user_email,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pp.file_path as payment_proof_url,
                   pp.upload_date as payment_proof_date,
                   pv.verification_status as payment_status,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
            LIMIT 10
        `, [companyAccount.id]);
        
        const pendingPayments = companyPayments.filter(item => {
            const hasAcceptedStatus = item.user_response_status === 'accepted';
            const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
            const needsVerification = !item.payment_status || item.payment_status === 'pending';
            
            return hasAcceptedStatus && hasPaymentProof && needsVerification;
        });
        
        console.log(`Company will see ${pendingPayments.length} payments to verify in Payment Management:`);
        pendingPayments.forEach((payment, index) => {
            console.log(`${index + 1}. Quote #${payment.quote_id} - ${payment.user_name}`);
            console.log(`   Amount: $${payment.price}`);
            console.log(`   Accepted: ${payment.accepted_at}`);
            console.log(`   Payment Proof: ${payment.payment_proof_url ? 'YES' : 'NO'}`);
            console.log(`   Status: ${payment.payment_status || 'PENDING VERIFICATION'}`);
        });
        
        if (pendingPayments.length === 0) {
            console.log('ℹ️  No payments to verify. This means:');
            console.log('   - No users have accepted quotes with payment proofs, OR');
            console.log('   - All payments have already been verified/rejected');
        }
        
        console.log('\n🎯 TESTING INSTRUCTIONS:');
        console.log('1. Login as user: subodhchauhan1309@gmail.com / 222333');
        console.log('2. Go to "My Quotes" and find a quote with company response');
        console.log('3. If it has bank details, upload payment proof first');
        console.log('4. Then accept the quote');
        console.log('5. Check that you see "Payment Verification Pending" message');
        console.log('6. Login as company: aadarshchauhan35@gmail.com / 222333');
        console.log('7. Go to Payment Management - you should see the payment');
        console.log('8. Verify or reject the payment');
        console.log('9. Login back as user and check updated status');
        
    } catch (error) {
        console.error('❌ Error testing user messages:', error);
    } finally {
        process.exit(0);
    }
}

testUserMessages();