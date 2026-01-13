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

async function debugPaymentManagementIssue() {
    try {
        console.log('🔍 DEBUGGING PAYMENT MANAGEMENT ISSUE');
        console.log('=====================================\n');

        // Test accounts
        const testAccounts = [
            { email: 'aadarshchauhan35@gmail.com', type: 'company' },
            { email: 'problem@gmail.com', type: 'company' }
        ];

        for (const account of testAccounts) {
            console.log(`\n📊 ANALYZING ACCOUNT: ${account.email}`);
            console.log('=' .repeat(50));

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
            const companyName = companyResult[0].name;
            console.log(`✅ Company found: ${companyName} (ID: ${companyId})`);

            // Check payment management data using the same query as frontend
            const [responses] = await db.execute(`
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

            console.log(`\n📋 Total quote responses: ${responses.length}`);

            // Filter for accepted quotes with payment proofs that need verification
            const pendingPayments = responses.filter(item => {
                const hasAcceptedStatus = item.user_response_status === 'accepted';
                const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
                const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
                
                return hasAcceptedStatus && hasPaymentProof && needsVerification;
            });

            console.log(`💰 Pending payments to verify: ${pendingPayments.length}`);

            if (pendingPayments.length > 0) {
                console.log('\n🔍 PENDING PAYMENT DETAILS:');
                pendingPayments.forEach((payment, index) => {
                    console.log(`\n   Payment ${index + 1}:`);
                    console.log(`   - Quote ID: ${payment.quote_id}`);
                    console.log(`   - Response ID: ${payment.id}`);
                    console.log(`   - User: ${payment.user_name} (${payment.user_email})`);
                    console.log(`   - Amount: $${payment.price}`);
                    console.log(`   - Service: ${payment.product_description}`);
                    console.log(`   - User Response Status: ${payment.user_response_status}`);
                    console.log(`   - Payment Proof Uploaded: ${payment.payment_proof_uploaded}`);
                    console.log(`   - Payment Proof URL: ${payment.payment_proof_url ? 'Yes' : 'No'}`);
                    console.log(`   - Payment Status: ${payment.payment_status || 'PENDING'}`);
                    console.log(`   - Upload Date: ${payment.payment_proof_date || 'N/A'}`);
                });
            }

            // Check all responses with payment proofs (regardless of status)
            const allPaymentProofs = responses.filter(item => 
                item.payment_proof_uploaded === 1 || item.payment_proof_url
            );

            console.log(`\n📎 All responses with payment proofs: ${allPaymentProofs.length}`);

            if (allPaymentProofs.length > 0) {
                console.log('\n🔍 ALL PAYMENT PROOF DETAILS:');
                allPaymentProofs.forEach((payment, index) => {
                    console.log(`\n   Payment Proof ${index + 1}:`);
                    console.log(`   - Quote ID: ${payment.quote_id}`);
                    console.log(`   - Response ID: ${payment.id}`);
                    console.log(`   - User: ${payment.user_name} (${payment.user_email})`);
                    console.log(`   - User Response Status: ${payment.user_response_status || 'NOT SET'}`);
                    console.log(`   - Payment Proof URL: ${payment.payment_proof_url ? 'Yes' : 'No'}`);
                    console.log(`   - Payment Status: ${payment.payment_status || 'PENDING'}`);
                    console.log(`   - Accepted At: ${payment.accepted_at || 'NOT ACCEPTED'}`);
                });
            }

            // Check for cross-company payment proof issues
            console.log('\n🔍 CHECKING FOR CROSS-COMPANY ISSUES...');
            const [crossCompanyCheck] = await db.execute(`
                SELECT pp.id, pp.quote_id, pp.company_id as proof_company_id, 
                       qr.company_id as response_company_id,
                       u.email as user_email,
                       c1.name as proof_company_name,
                       c2.name as response_company_name
                FROM payment_proofs pp
                JOIN quote_responses qr ON pp.quote_response_id = qr.id
                JOIN users u ON pp.user_id = u.id
                LEFT JOIN users c1 ON pp.company_id = c1.id
                LEFT JOIN users c2 ON qr.company_id = c2.id
                WHERE pp.company_id != qr.company_id
            `);

            if (crossCompanyCheck.length > 0) {
                console.log(`⚠️  FOUND ${crossCompanyCheck.length} CROSS-COMPANY PAYMENT PROOF ISSUES:`);
                crossCompanyCheck.forEach((issue, index) => {
                    console.log(`\n   Issue ${index + 1}:`);
                    console.log(`   - Payment Proof ID: ${issue.id}`);
                    console.log(`   - Quote ID: ${issue.quote_id}`);
                    console.log(`   - User: ${issue.user_email}`);
                    console.log(`   - Payment Proof Company: ${issue.proof_company_name} (ID: ${issue.proof_company_id})`);
                    console.log(`   - Quote Response Company: ${issue.response_company_name} (ID: ${issue.response_company_id})`);
                });
            } else {
                console.log('✅ No cross-company payment proof issues found');
            }
        }

        // Check for users who can respond to multiple companies
        console.log('\n\n🔍 CHECKING FOR UI CROSS-COMPANY RESPONSE ISSUES...');
        console.log('=' .repeat(60));

        const [userResponseIssues] = await db.execute(`
            SELECT u.email, u.name,
                   COUNT(DISTINCT qr.company_id) as companies_responded_to,
                   GROUP_CONCAT(DISTINCT c.name) as company_names
            FROM users u
            JOIN user_quote_status uqs ON u.id = uqs.user_id
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            JOIN users c ON qr.company_id = c.id
            GROUP BY u.id, u.email, u.name
            HAVING companies_responded_to > 1
        `);

        if (userResponseIssues.length > 0) {
            console.log(`⚠️  FOUND ${userResponseIssues.length} USERS RESPONDING TO MULTIPLE COMPANIES:`);
            userResponseIssues.forEach((issue, index) => {
                console.log(`\n   User ${index + 1}:`);
                console.log(`   - Email: ${issue.email}`);
                console.log(`   - Name: ${issue.name}`);
                console.log(`   - Companies responded to: ${issue.companies_responded_to}`);
                console.log(`   - Company names: ${issue.company_names}`);
            });
        } else {
            console.log('✅ No users found responding to multiple companies');
        }

        console.log('\n\n🎯 SUMMARY AND RECOMMENDATIONS:');
        console.log('=' .repeat(50));
        console.log('1. Check if payment proofs are being linked to correct companies');
        console.log('2. Verify user_quote_status records are properly created');
        console.log('3. Ensure payment_verifications are linked correctly');
        console.log('4. Check frontend filtering logic in PaymentManagement.jsx');

    } catch (error) {
        console.error('❌ Error debugging payment management:', error);
    } finally {
        await db.end();
    }
}

debugPaymentManagementIssue();