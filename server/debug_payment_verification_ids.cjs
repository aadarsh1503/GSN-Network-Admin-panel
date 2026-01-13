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

async function debugPaymentVerificationIds() {
    try {
        console.log('🔍 DEBUGGING PAYMENT VERIFICATION IDs');
        console.log('====================================\n');

        // Get company ID for aadarshchauhan35@gmail.com
        const [companyResult] = await db.execute(
            'SELECT id, name FROM users WHERE email = ? AND role = "company"',
            ['aadarshchauhan35@gmail.com']
        );

        if (companyResult.length === 0) {
            console.log('❌ Company not found');
            return;
        }

        const companyId = companyResult[0].id;
        console.log(`✅ Company: ${companyResult[0].name} (ID: ${companyId})`);

        // Get the same data as the API endpoint
        const [responses] = await db.execute(`
            SELECT qr.id as quote_response_id,
                   qr.quote_id,
                   qr.price,
                   q.product_description,
                   u.name as user_name,
                   u.email as user_email,
                   uqs.status as user_response_status,
                   pp.id as payment_proof_id,
                   pp.file_path as payment_proof_url,
                   pv.id as payment_verification_id,
                   pv.verification_status as payment_status,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            AND pp.id IS NOT NULL
            ORDER BY qr.created_at DESC
        `, [companyId]);

        console.log(`\n📋 Found ${responses.length} responses with payment proofs:`);

        responses.forEach((response, index) => {
            console.log(`\n   Response ${index + 1}:`);
            console.log(`   - Quote Response ID: ${response.quote_response_id} (❌ WRONG - this is what frontend is using)`);
            console.log(`   - Payment Verification ID: ${response.payment_verification_id} (✅ CORRECT - this is what we need)`);
            console.log(`   - Quote ID: ${response.quote_id}`);
            console.log(`   - User: ${response.user_name} (${response.user_email})`);
            console.log(`   - Amount: $${response.price}`);
            console.log(`   - Payment Status: ${response.payment_status || 'pending'}`);
            console.log(`   - Payment Proof ID: ${response.payment_proof_id}`);
        });

        // Check if payment_verifications table has the records
        console.log('\n🔍 Checking payment_verifications table directly:');
        const [verifications] = await db.execute(`
            SELECT pv.id, pv.quote_id, pv.quote_response_id, pv.user_id, pv.company_id, 
                   pv.payment_proof_id, pv.verification_status
            FROM payment_verifications pv
            WHERE pv.company_id = ?
        `, [companyId]);

        console.log(`\n📋 Found ${verifications.length} payment verifications:`);
        verifications.forEach((verification, index) => {
            console.log(`\n   Verification ${index + 1}:`);
            console.log(`   - Verification ID: ${verification.id} (✅ This should be used for API calls)`);
            console.log(`   - Quote ID: ${verification.quote_id}`);
            console.log(`   - Quote Response ID: ${verification.quote_response_id}`);
            console.log(`   - User ID: ${verification.user_id}`);
            console.log(`   - Company ID: ${verification.company_id}`);
            console.log(`   - Payment Proof ID: ${verification.payment_proof_id}`);
            console.log(`   - Status: ${verification.verification_status || 'pending'}`);
        });

        console.log('\n🎯 SOLUTION:');
        console.log('The frontend needs to use payment_verification_id instead of quote_response_id');
        console.log('Current API call: PUT /api/payments/verify-enhanced/48 (quote_response_id)');
        console.log(`Correct API call: PUT /api/payments/verify-enhanced/${verifications[0]?.id} (payment_verification_id)`);

    } catch (error) {
        console.error('❌ Error debugging payment verification IDs:', error);
    } finally {
        await db.end();
    }
}

debugPaymentVerificationIds();