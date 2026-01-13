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

async function testMyQuotesPaymentStatus() {
    try {
        console.log('🧪 TESTING MY QUOTES WITH PAYMENT STATUS');
        console.log('========================================\n');

        // Test company account
        const companyEmail = 'aadarshchauhan35@gmail.com';

        // Get company ID
        const [companyResult] = await db.execute(
            'SELECT id, name FROM users WHERE email = ? AND role = "company"',
            [companyEmail]
        );

        if (companyResult.length === 0) {
            console.log(`❌ Company not found: ${companyEmail}`);
            return;
        }

        const companyId = companyResult[0].id;
        console.log(`✅ Testing for company: ${companyResult[0].name} (ID: ${companyId})`);

        // Test the updated SQL query (same as the updated backend)
        const sql = `
            SELECT q.*, 
                   qr.price, qr.transit_time, qr.created_at as response_date,
                   uqs.accepted_at, uqs.status as user_response_status,
                   u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
                   COUNT(qr2.id) as total_responses,
                   pp.id as payment_proof_id,
                   pp.file_path as payment_proof_url,
                   pp.upload_date as payment_proof_date,
                   pv.id as payment_verification_id,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_notes,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.status = 'accepted')
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            GROUP BY q.id, qr.id, uqs.id, pp.id, pv.id
            ORDER BY uqs.accepted_at DESC
        `;

        const [quotes] = await db.execute(sql, [companyId]);

        console.log(`\n📋 Found ${quotes.length} accepted quotes with payment information:`);

        if (quotes.length === 0) {
            console.log('\n⚠️  No accepted quotes found. This means:');
            console.log('   - No users have accepted this company\'s responses yet');
            console.log('   - Test by having a user accept a quote response');
            return;
        }

        quotes.forEach((quote, index) => {
            console.log(`\n📊 Quote ${index + 1}:`);
            console.log(`   - Quote ID: ${quote.id}`);
            console.log(`   - Customer: ${quote.user_name} (${quote.user_email})`);
            console.log(`   - Product: ${quote.product_description}`);
            console.log(`   - Price: $${quote.price}`);
            console.log(`   - Route: ${quote.departure_country} → ${quote.arrival_country}`);
            console.log(`   - Accepted on: ${quote.accepted_at ? new Date(quote.accepted_at).toLocaleDateString() : 'N/A'}`);
            
            // Payment status analysis
            console.log(`   - Has Payment Proof: ${quote.has_payment_proof ? 'Yes' : 'No'}`);
            
            if (!quote.has_payment_proof) {
                console.log(`   - Payment Status: 🔘 No Payment Required`);
            } else if (quote.payment_status === 'verified') {
                console.log(`   - Payment Status: ✅ Payment Verified`);
                console.log(`   - Verified on: ${new Date(quote.verification_date).toLocaleDateString()}`);
            } else if (quote.payment_status === 'rejected') {
                console.log(`   - Payment Status: ❌ Payment Rejected`);
                if (quote.payment_notes) {
                    console.log(`   - Rejection Notes: ${quote.payment_notes}`);
                }
            } else if (quote.payment_proof_url) {
                console.log(`   - Payment Status: ⏳ Payment Pending Verification`);
                console.log(`   - Proof uploaded: ${new Date(quote.payment_proof_date).toLocaleDateString()}`);
            } else {
                console.log(`   - Payment Status: 💳 Awaiting Payment Proof`);
            }
        });

        // Analyze payment status distribution
        const statusCounts = {
            noPaymentRequired: quotes.filter(q => !q.has_payment_proof).length,
            verified: quotes.filter(q => q.payment_status === 'verified').length,
            rejected: quotes.filter(q => q.payment_status === 'rejected').length,
            pendingVerification: quotes.filter(q => q.payment_proof_url && !q.payment_status).length,
            awaitingProof: quotes.filter(q => q.has_payment_proof && !q.payment_proof_url).length
        };

        console.log('\n📊 PAYMENT STATUS SUMMARY:');
        console.log('=' .repeat(40));
        console.log(`🔘 No Payment Required: ${statusCounts.noPaymentRequired}`);
        console.log(`✅ Payment Verified: ${statusCounts.verified}`);
        console.log(`❌ Payment Rejected: ${statusCounts.rejected}`);
        console.log(`⏳ Pending Verification: ${statusCounts.pendingVerification}`);
        console.log(`💳 Awaiting Payment Proof: ${statusCounts.awaitingProof}`);

        console.log('\n🎯 FRONTEND DISPLAY LOGIC:');
        console.log('=' .repeat(40));
        quotes.forEach((quote, index) => {
            let badgeText = '';
            let badgeColor = '';
            
            if (!quote.has_payment_proof) {
                badgeText = 'No Payment Required';
                badgeColor = 'gray';
            } else if (quote.payment_status === 'verified') {
                badgeText = '✓ Payment Verified';
                badgeColor = 'green';
            } else if (quote.payment_status === 'rejected') {
                badgeText = '✗ Payment Rejected';
                badgeColor = 'red';
            } else if (quote.payment_proof_url) {
                badgeText = '⏳ Payment Pending Verification';
                badgeColor = 'yellow';
            } else {
                badgeText = '💳 Awaiting Payment Proof';
                badgeColor = 'blue';
            }
            
            console.log(`Quote ${index + 1}: [${badgeColor.toUpperCase()}] ${badgeText}`);
        });

        console.log('\n✅ TESTING COMPLETE!');
        console.log('The My Quotes page will now show:');
        console.log('- Payment verification status for each quote');
        console.log('- Quick action buttons to verify payments');
        console.log('- Clear indicators of payment workflow progress');

    } catch (error) {
        console.error('❌ Error testing My Quotes payment status:', error);
    } finally {
        await db.end();
    }
}

testMyQuotesPaymentStatus();