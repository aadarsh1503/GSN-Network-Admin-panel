// Test script to verify the real user flow with actual credentials
import db from './config/db.js';

async function testRealUserFlow() {
    try {
        console.log('🧪 Testing Real User Payment Flow...\n');
        
        // Step 1: Find the actual users from the credentials provided
        console.log('1️⃣ Finding users with provided credentials...');
        
        const [users] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE email IN (?, ?, ?, ?)
        `, [
            'subodhchauhan1309@gmail.com', // User panel (corrected email)
            'a@gmail.com',                 // Business panel  
            'aadarshchauhan35@gmail.com',  // Company panel 1
            'problem@gmail.com'            // Company panel 2
        ]);
        
        console.log('Found users:');
        users.forEach(user => {
            console.log(`  ${user.role}: ${user.name} (${user.email}) - ID: ${user.id}`);
        });
        
        // Step 2: Check existing quotes and responses
        console.log('\n2️⃣ Checking existing quotes and responses...');
        
        const userAccount = users.find(u => u.email === 'subodhchauhan1309@gmail.com');
        const companyAccount = users.find(u => u.email === 'aadarshchauhan35@gmail.com');
        
        if (!userAccount || !companyAccount) {
            console.log('❌ Required user or company account not found');
            return;
        }
        
        // Find recent quotes from this user
        const [userQuotes] = await db.execute(`
            SELECT q.*, COUNT(qr.id) as response_count
            FROM quotes q
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            WHERE q.user_id = ?
            GROUP BY q.id
            ORDER BY q.created_at DESC
            LIMIT 5
        `, [userAccount.id]);
        
        console.log(`User ${userAccount.name} has ${userQuotes.length} recent quotes:`);
        userQuotes.forEach(quote => {
            console.log(`  Quote #${quote.id}: ${quote.product_description} - Status: ${quote.status} - Responses: ${quote.response_count}`);
        });
        
        // Find responses from the company
        const [companyResponses] = await db.execute(`
            SELECT qr.*, q.product_description, u.name as user_name,
                   uqs.status as user_response_status,
                   pp.file_path as payment_proof_url,
                   pv.verification_status as payment_status
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
        
        console.log(`\nCompany ${companyAccount.name} has ${companyResponses.length} responses:`);
        companyResponses.forEach(response => {
            console.log(`  Response #${response.id} for Quote #${response.quote_id}`);
            console.log(`    User: ${response.user_name}`);
            console.log(`    Price: $${response.price}`);
            console.log(`    User Response: ${response.user_response_status || 'No response yet'}`);
            console.log(`    Payment Proof: ${response.payment_proof_url ? 'YES' : 'NO'}`);
            console.log(`    Payment Status: ${response.payment_status || 'N/A'}`);
            console.log('');
        });
        
        // Step 3: Test the PaymentManagement query for this company
        console.log('3️⃣ Testing PaymentManagement query for company...');
        
        const [paymentManagementData] = await db.execute(`
            SELECT qr.*, 
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.shipping_mode,
                   u.name as user_name,
                   u.email as user_email,
                   u.phone as user_phone,
                   cbd.bank_name,
                   cbd.account_holder_name,
                   cbd.account_number,
                   cbd.routing_number,
                   cbd.swift_code,
                   cbd.ifsc_code,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.payment_verification_status,
                   pp.file_name as payment_proof_file,
                   pp.upload_date as payment_proof_date,
                   pp.notes as payment_notes,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_company_notes
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [companyAccount.id]);
        
        // Filter for what should appear in PaymentManagement
        const pendingPayments = paymentManagementData.filter(item => {
            const hasAcceptedStatus = item.user_response_status === 'accepted';
            const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
            const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
            
            return hasAcceptedStatus && hasPaymentProof && needsVerification;
        });
        
        console.log(`PaymentManagement will show ${pendingPayments.length} items:`);
        pendingPayments.forEach((payment, index) => {
            console.log(`${index + 1}. Quote #${payment.quote_id} - ${payment.user_name}`);
            console.log(`   Email: ${payment.user_email}`);
            console.log(`   Amount: $${payment.price}`);
            console.log(`   Payment Proof: ${payment.payment_proof_url}`);
            console.log(`   Upload Date: ${payment.payment_proof_date}`);
            console.log(`   Status: ${payment.payment_status || 'PENDING VERIFICATION'}`);
            console.log('');
        });
        
        // Step 4: Check user's perspective - what they should see after uploading payment proof
        console.log('4️⃣ Checking user perspective for payment status messages...');
        
        const [userAcceptedQuotes] = await db.execute(`
            SELECT q.id as quote_id, q.status as quote_status, q.product_description,
                   qr.id as response_id, qr.price, qr.company_id,
                   u.name as company_name,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pp.file_path as payment_proof_url,
                   pp.upload_date as payment_proof_date,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = q.user_id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id)
            WHERE q.user_id = ? AND uqs.status = 'accepted'
            ORDER BY uqs.accepted_at DESC
        `, [userAccount.id]);
        
        console.log(`User ${userAccount.name} has ${userAcceptedQuotes.length} accepted quotes:`);
        userAcceptedQuotes.forEach(quote => {
            console.log(`  Quote #${quote.quote_id}: ${quote.product_description}`);
            console.log(`    Company: ${quote.company_name}`);
            console.log(`    Price: $${quote.price}`);
            console.log(`    Accepted: ${quote.accepted_at}`);
            console.log(`    Payment Proof: ${quote.payment_proof_url ? 'Uploaded' : 'Not uploaded'}`);
            console.log(`    Payment Status: ${quote.payment_status || 'Pending verification'}`);
            
            // This is what the user should see
            if (quote.payment_proof_url && !quote.payment_status) {
                console.log(`    ✅ USER SHOULD SEE: "Please wait, your payment is being verified by the company"`);
            } else if (quote.payment_status === 'pending') {
                console.log(`    ✅ USER SHOULD SEE: "Payment verification in progress"`);
            } else if (quote.payment_status === 'verified') {
                console.log(`    ✅ USER SHOULD SEE: "Payment verified! Work will begin as scheduled"`);
            } else if (quote.payment_status === 'rejected') {
                console.log(`    ❌ USER SHOULD SEE: "Payment verification failed. Please contact company or upload clearer proof"`);
            }
            console.log('');
        });
        
        // Step 5: Summary and recommendations
        console.log('5️⃣ Flow Analysis Summary:');
        console.log('\n📋 CURRENT STATE:');
        console.log(`   - User account: ${userAccount.name} (${userAccount.email})`);
        console.log(`   - Company account: ${companyAccount.name} (${companyAccount.email})`);
        console.log(`   - User has ${userQuotes.length} quotes`);
        console.log(`   - Company has ${companyResponses.length} responses`);
        console.log(`   - ${pendingPayments.length} payments need verification`);
        console.log(`   - ${userAcceptedQuotes.length} quotes accepted by user`);
        
        console.log('\n🔄 EXPECTED WORKFLOW:');
        console.log('   1. User views company quote response');
        console.log('   2. User uploads payment proof');
        console.log('   3. User sees "Payment being verified" message');
        console.log('   4. Company sees payment in Payment Management panel');
        console.log('   5. Company verifies/rejects payment');
        console.log('   6. Quote status updates to approved/rejected');
        console.log('   7. User sees updated status');
        
        if (pendingPayments.length > 0) {
            console.log('\n✅ GOOD: Company will see payments to verify');
        } else {
            console.log('\n⚠️  NOTE: No pending payments found - test by having user upload payment proof');
        }
        
        console.log('\n🎯 TO TEST COMPLETE FLOW:');
        console.log('   1. Login as user: subodhchauhan1309@gmail.com / 222333');
        console.log('   2. Find a quote with company response');
        console.log('   3. Upload payment proof');
        console.log('   4. Accept the quote');
        console.log('   5. Login as company: aadarshchauhan35@gmail.com / 222333');
        console.log('   6. Go to Payment Management');
        console.log('   7. Verify the payment');
        console.log('   8. Check quote status changes');
        
    } catch (error) {
        console.error('❌ Error testing real user flow:', error);
    } finally {
        process.exit(0);
    }
}

testRealUserFlow();