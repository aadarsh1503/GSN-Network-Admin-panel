// Test script to simulate complete payment flow and verify fixes
import db from './config/db.js';

async function testCompletePaymentFlow() {
    try {
        console.log('🧪 Testing Complete Payment Flow...\n');
        
        // Step 1: Use existing users instead of creating new ones
        console.log('1️⃣ Finding existing test data...');
        
        // Find existing users
        const [users] = await db.execute('SELECT id, name, email, role FROM users LIMIT 10');
        console.log(`Found ${users.length} users in database`);
        
        let userId = null;
        let companyId = null;
        
        users.forEach(user => {
            if (user.role === 'user' && !userId) {
                userId = user.id;
                console.log(`Using user: ${user.name} (${user.email}) - ID: ${userId}`);
            }
            if (user.role === 'company' && !companyId) {
                companyId = user.id;
                console.log(`Using company: ${user.name} (${user.email}) - ID: ${companyId}`);
            }
        });
        
        if (!userId || !companyId) {
            console.log('❌ Need at least one user and one company in database to test');
            return;
        }
        
        // Create a test quote
        const [quoteResult] = await db.execute(
            `INSERT INTO quotes (user_id, product_description, departure_country, arrival_country, shipping_mode, status, arrival_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, 'Test Product for Payment Flow', 'USA', 'Canada', 'sea', 'pending', '2024-02-01']
        );
        const quoteId = quoteResult.insertId;
        
        // Create a quote response with bank details
        const [responseResult] = await db.execute(
            `INSERT INTO quote_responses (quote_id, company_id, price, transit_time, inclusions, terms, notes, requires_payment_proof) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [quoteId, companyId, 1500.00, '5-7 days', 'Test inclusions', 'Test terms', 'Enhanced quote response with bank details', true]
        );
        const responseId = responseResult.insertId;
        
        console.log(`✅ Created test quote ${quoteId} and response ${responseId}`);
        
        // Step 2: Simulate payment proof upload
        console.log('\n2️⃣ Simulating payment proof upload...');
        
        const [paymentProofResult] = await db.execute(
            `INSERT INTO payment_proofs 
             (quote_id, quote_response_id, user_id, company_id, file_name, file_path, file_size, file_type, notes, upload_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [quoteId, responseId, userId, companyId, 'test_payment_proof.jpg', 
             'https://example.com/test_payment_proof.jpg', 1024000, 'image/jpeg', 'Test payment proof upload', new Date()]
        );
        const paymentProofId = paymentProofResult.insertId;
        
        // Create payment verification record
        await db.execute(
            `INSERT INTO payment_verifications 
             (quote_id, quote_response_id, user_id, company_id, payment_proof_id, verification_status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [quoteId, responseId, userId, companyId, paymentProofId, 'pending']
        );
        
        console.log(`✅ Created payment proof with ID: ${paymentProofId}`);
        
        // Step 3: Simulate quote acceptance
        console.log('\n3️⃣ Simulating quote acceptance...');
        
        await db.execute(
            `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at, payment_proof_id, payment_verification_status) 
             VALUES (?, ?, ?, ?, 'accepted', NOW(), ?, 'pending')`,
            [quoteId, userId, companyId, responseId, paymentProofId]
        );
        
        // Update quote status
        await db.execute(
            'UPDATE quotes SET status = ? WHERE id = ?',
            ['payment_pending', quoteId]
        );
        
        // Update quote response status
        await db.execute(
            'UPDATE quote_responses SET status = ? WHERE id = ?',
            ['accepted', responseId]
        );
        
        console.log('✅ Quote accepted and payment pending');
        
        // Step 4: Test the PaymentManagement API query
        console.log('\n4️⃣ Testing PaymentManagement API query...');
        
        const [companyPayments] = await db.execute(`
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
        `, [companyId]);
        
        console.log(`Found ${companyPayments.length} responses for company ${companyId}:`);
        
        companyPayments.forEach((payment, index) => {
            console.log(`${index + 1}. Quote #${payment.quote_id} - Response #${payment.id}`);
            console.log(`   User: ${payment.user_name} (${payment.user_email})`);
            console.log(`   Price: $${payment.price}`);
            console.log(`   User Response Status: ${payment.user_response_status}`);
            console.log(`   Payment Proof Uploaded: ${payment.payment_proof_uploaded}`);
            console.log(`   Payment Proof URL: ${payment.payment_proof_url}`);
            console.log(`   Payment Status: ${payment.payment_status}`);
            console.log('');
        });
        
        // Filter for pending payments (what PaymentManagement component does)
        const pendingPayments = companyPayments.filter(item => {
            const hasAcceptedStatus = item.user_response_status === 'accepted';
            const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
            const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
            
            console.log(`Filtering item ${item.id}:`, {
                hasAcceptedStatus,
                hasPaymentProof,
                needsVerification,
                user_response_status: item.user_response_status,
                payment_proof_uploaded: item.payment_proof_uploaded,
                payment_status: item.payment_status
            });
            
            return hasAcceptedStatus && hasPaymentProof && needsVerification;
        });
        
        console.log(`✅ Filtered to ${pendingPayments.length} pending payment verifications`);
        
        if (pendingPayments.length > 0) {
            console.log('🎉 SUCCESS: PaymentManagement will now show payment data!');
            
            pendingPayments.forEach((payment, index) => {
                console.log(`${index + 1}. Quote #${payment.quote_id} - ${payment.user_name}`);
                console.log(`   Amount: $${payment.price}`);
                console.log(`   Payment Proof: ${payment.payment_proof_url}`);
                console.log(`   Status: ${payment.payment_status || 'PENDING'}`);
                console.log('');
            });
            
        } else {
            console.log('❌ ISSUE: No pending payments found - check the query logic');
        }
        
        // Clean up test data
        console.log('\n5️⃣ Cleaning up test data...');
        await db.execute('DELETE FROM payment_verifications WHERE payment_proof_id = ?', [paymentProofId]);
        await db.execute('DELETE FROM payment_proofs WHERE id = ?', [paymentProofId]);
        await db.execute('DELETE FROM user_quote_status WHERE quote_id = ?', [quoteId]);
        await db.execute('DELETE FROM quote_responses WHERE id = ?', [responseId]);
        await db.execute('DELETE FROM quotes WHERE id = ?', [quoteId]);
        
        console.log('✅ Test data cleaned up');
        
        console.log('\n🎉 Complete Payment Flow Test Finished!');
        
    } catch (error) {
        console.error('❌ Error testing complete payment flow:', error);
    } finally {
        process.exit(0);
    }
}

testCompletePaymentFlow();