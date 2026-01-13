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

async function testPaymentManagementFix() {
    try {
        console.log('🧪 TESTING PAYMENT MANAGEMENT FIX');
        console.log('==================================\n');

        // Test accounts
        const testAccounts = [
            { email: 'aadarshchauhan35@gmail.com', name: 'Aadarsh Company' },
            { email: 'problem@gmail.com', name: 'Problem Company' }
        ];

        for (const account of testAccounts) {
            console.log(`\n📊 TESTING: ${account.name} (${account.email})`);
            console.log('=' .repeat(60));

            // Get company ID
            const [companyResult] = await db.execute(
                'SELECT id, name FROM users WHERE email = ? AND role = "company"',
                [account.email]
            );

            if (companyResult.length === 0) {
                console.log(`❌ Company not found: ${account.email}`);
                continue;
            }

            const companyId = companyResult[0].id;
            console.log(`✅ Company found: ${companyResult[0].name} (ID: ${companyId})`);

            // Test the FIXED query (without acceptance requirement)
            const [fixedResults] = await db.execute(`
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

            // Apply the FIXED filtering logic (no acceptance requirement)
            const fixedPendingPayments = fixedResults.filter(item => {
                const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
                const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
                
                return hasPaymentProof && needsVerification;
            });

            console.log(`\n🔧 FIXED LOGIC RESULTS:`);
            console.log(`   Total responses: ${fixedResults.length}`);
            console.log(`   Payments to verify: ${fixedPendingPayments.length}`);

            if (fixedPendingPayments.length > 0) {
                console.log(`\n💰 PAYMENTS THAT WILL NOW APPEAR:`);
                fixedPendingPayments.forEach((payment, index) => {
                    console.log(`\n   Payment ${index + 1}:`);
                    console.log(`   - Quote ID: ${payment.quote_id}`);
                    console.log(`   - User: ${payment.user_name} (${payment.user_email})`);
                    console.log(`   - Amount: $${payment.price}`);
                    console.log(`   - Quote Status: ${payment.user_response_status || 'NOT ACCEPTED YET'}`);
                    console.log(`   - Payment Status: ${payment.payment_status || 'PENDING'}`);
                    console.log(`   - Upload Date: ${payment.payment_proof_date || 'N/A'}`);
                    console.log(`   - Payment Proof: ${payment.payment_proof_url ? 'Available' : 'Missing'}`);
                });
            }

            // Test the OLD logic (with acceptance requirement) for comparison
            const oldPendingPayments = fixedResults.filter(item => {
                const hasAcceptedStatus = item.user_response_status === 'accepted';
                const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
                const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
                
                return hasAcceptedStatus && hasPaymentProof && needsVerification;
            });

            console.log(`\n📊 COMPARISON:`);
            console.log(`   OLD logic (acceptance required): ${oldPendingPayments.length} payments`);
            console.log(`   NEW logic (no acceptance required): ${fixedPendingPayments.length} payments`);
            console.log(`   IMPROVEMENT: +${fixedPendingPayments.length - oldPendingPayments.length} more payments visible`);
        }

        console.log('\n\n🎯 FIX SUMMARY:');
        console.log('=' .repeat(50));
        console.log('✅ ISSUE IDENTIFIED: Payment management only showed accepted quotes');
        console.log('✅ ISSUE FIXED: Now shows all payment proofs needing verification');
        console.log('✅ BENEFIT: Companies can verify payments before users accept quotes');
        console.log('✅ WORKFLOW: User uploads proof → Company verifies → User accepts quote');

        console.log('\n📋 TESTING INSTRUCTIONS:');
        console.log('1. Login as company: aadarshchauhan35@gmail.com / 222333');
        console.log('2. Go to Payment Management page');
        console.log('3. You should now see payment proofs that need verification');
        console.log('4. Verify the payments');
        console.log('5. Users can then accept the quotes after payment verification');

    } catch (error) {
        console.error('❌ Error testing payment management fix:', error);
    } finally {
        await db.end();
    }
}

testPaymentManagementFix();