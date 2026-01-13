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

async function debugQuoteStatusFlow() {
    try {
        console.log('🔍 DEBUGGING QUOTE STATUS FLOW ISSUES');
        console.log('====================================\n');

        // Find a test quote that has responses
        const [quotes] = await db.execute(`
            SELECT q.id, q.status, q.product_description, q.user_id,
                   u.name as user_name, u.email as user_email,
                   COUNT(qr.id) as response_count
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            WHERE q.id IN (52, 54) -- Test quotes we know have issues
            GROUP BY q.id
            ORDER BY q.id DESC
        `);

        for (const quote of quotes) {
            console.log(`\n📋 ANALYZING QUOTE #${quote.id}:`);
            console.log(`   User: ${quote.user_name} (${quote.user_email})`);
            console.log(`   Product: ${quote.product_description}`);
            console.log(`   Current Status: ${quote.status}`);
            console.log(`   Response Count: ${quote.response_count}`);

            // Get all responses for this quote
            const [responses] = await db.execute(`
                SELECT qr.id, qr.company_id, qr.price, qr.status as response_status,
                       c.name as company_name, c.email as company_email,
                       uqs.status as user_response_status,
                       uqs.accepted_at,
                       pp.id as payment_proof_id,
                       pp.file_path as payment_proof_url,
                       pv.verification_status as payment_status
                FROM quote_responses qr
                LEFT JOIN users c ON qr.company_id = c.id
                LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
                LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id)
                LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id)
                WHERE qr.quote_id = ?
                ORDER BY qr.created_at DESC
            `, [quote.user_id, quote.id]);

            console.log(`\n   📊 RESPONSES (${responses.length}):`);
            responses.forEach((response, index) => {
                console.log(`\n   Response ${index + 1}:`);
                console.log(`     - Company: ${response.company_name} (${response.company_email})`);
                console.log(`     - Price: $${response.price}`);
                console.log(`     - Response Status: ${response.response_status || 'NULL'}`);
                console.log(`     - User Response Status: ${response.user_response_status || 'NULL'}`);
                console.log(`     - Accepted At: ${response.accepted_at || 'NULL'}`);
                console.log(`     - Has Payment Proof: ${response.payment_proof_id ? 'YES' : 'NO'}`);
                console.log(`     - Payment Status: ${response.payment_status || 'NULL'}`);
            });

            // Check if there are accepted responses
            const acceptedResponses = responses.filter(r => r.user_response_status === 'accepted');
            console.log(`\n   ✅ ACCEPTED RESPONSES: ${acceptedResponses.length}`);

            if (acceptedResponses.length > 0) {
                console.log(`   ⚠️  ISSUE: Quote status is "${quote.status}" but should be "approved" since there are accepted responses`);
                
                acceptedResponses.forEach((response, index) => {
                    console.log(`\n   Accepted Response ${index + 1}:`);
                    console.log(`     - Company: ${response.company_name}`);
                    console.log(`     - Accepted At: ${response.accepted_at}`);
                    console.log(`     - Has Payment Proof: ${response.payment_proof_id ? 'YES' : 'NO'}`);
                    
                    if (response.payment_proof_id) {
                        console.log(`     - Payment Status: ${response.payment_status || 'PENDING'}`);
                    }
                });
            }

            // Check for multiple payment proofs (this shouldn't happen)
            const paymentProofs = responses.filter(r => r.payment_proof_id);
            if (paymentProofs.length > 1) {
                console.log(`\n   ❌ CRITICAL ISSUE: User has uploaded payment proofs to ${paymentProofs.length} companies!`);
                paymentProofs.forEach((proof, index) => {
                    console.log(`     Payment Proof ${index + 1}: Company ${proof.company_name}`);
                });
            }
        }

        console.log('\n\n🎯 ISSUES IDENTIFIED:');
        console.log('=' .repeat(50));
        console.log('1. Quote status not updating when user accepts response');
        console.log('2. Users can upload payment proofs to multiple companies');
        console.log('3. Need to prevent multiple payment uploads once one is accepted');

        console.log('\n🔧 FIXES NEEDED:');
        console.log('=' .repeat(50));
        console.log('1. Fix quote status update in acceptQuoteResponse function');
        console.log('2. Add validation to prevent multiple payment uploads');
        console.log('3. Hide payment upload option for other companies once one is accepted');

    } catch (error) {
        console.error('❌ Error debugging quote status flow:', error);
    } finally {
        await db.end();
    }
}

debugQuoteStatusFlow();