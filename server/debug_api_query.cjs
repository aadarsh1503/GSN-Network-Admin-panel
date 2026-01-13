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

async function debugApiQuery() {
    try {
        console.log('🔍 DEBUGGING API QUERY FOR QUOTE RESPONSES');
        console.log('==========================================\n');

        const testQuoteId = 52;
        const testUserId = 11;

        // Test the exact API query
        console.log('Testing the exact API query used by frontend...');
        const [responses] = await db.execute(`
            SELECT qr.*, 
                   u.name as company_name, 
                   u.email as company_email,
                   u.phone as company_phone,
                   u.logo as company_logo,
                   cbd.bank_name,
                   cbd.branch_name,
                   cbd.branch_address,
                   cbd.ifsc_code,
                   cbd.account_number,
                   cbd.account_holder_name,
                   cbd.swift_code,
                   cbd.routing_number,
                   cbd.instructions as bank_instructions,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at,
                   uqs.payment_verification_status,
                   pp.file_name as payment_proof_file,
                   pp.upload_date as payment_proof_date,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_company_notes
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [testUserId, testQuoteId]);

        console.log(`\nFound ${responses.length} responses:`);

        responses.forEach((response, index) => {
            console.log(`\n📋 Response ${index + 1}:`);
            console.log(`   - Response ID: ${response.id}`);
            console.log(`   - Company: ${response.company_name} (${response.company_email})`);
            console.log(`   - Price: $${response.price}`);
            console.log(`   - User Response Status: ${response.user_response_status || 'NULL'}`);
            console.log(`   - Payment Proof Uploaded: ${response.payment_proof_uploaded}`);
            console.log(`   - Payment Proof URL: ${response.payment_proof_url || 'NULL'}`);
            console.log(`   - Payment Status: ${response.payment_status || 'NULL'}`);
            console.log(`   - Bank Name: ${response.bank_name || 'NULL'}`);
            console.log(`   - Account Number: ${response.account_number || 'NULL'}`);
        });

        // Check payment_proofs table directly
        console.log('\n\n🔍 CHECKING payment_proofs TABLE DIRECTLY:');
        const [paymentProofs] = await db.execute(`
            SELECT pp.*, c.name as company_name
            FROM payment_proofs pp
            LEFT JOIN users c ON pp.company_id = c.id
            WHERE pp.quote_id = ? AND pp.user_id = ?
        `, [testQuoteId, testUserId]);

        console.log(`Found ${paymentProofs.length} payment proofs:`);
        paymentProofs.forEach((proof, index) => {
            console.log(`\n   Proof ${index + 1}:`);
            console.log(`   - ID: ${proof.id}`);
            console.log(`   - Quote Response ID: ${proof.quote_response_id}`);
            console.log(`   - Company: ${proof.company_name} (ID: ${proof.company_id})`);
            console.log(`   - File Path: ${proof.file_path}`);
            console.log(`   - Upload Date: ${proof.upload_date}`);
        });

        // Check user_quote_status table with payment_proof_id
        console.log('\n\n🔍 CHECKING user_quote_status WITH payment_proof_id:');
        const [userStatus] = await db.execute(`
            SELECT uqs.*, c.name as company_name
            FROM user_quote_status uqs
            LEFT JOIN users c ON uqs.company_id = c.id
            WHERE uqs.quote_id = ? AND uqs.user_id = ?
        `, [testQuoteId, testUserId]);

        console.log(`Found ${userStatus.length} user quote status records:`);
        userStatus.forEach((status, index) => {
            console.log(`\n   Status ${index + 1}:`);
            console.log(`   - Quote Response ID: ${status.quote_response_id}`);
            console.log(`   - Company: ${status.company_name} (ID: ${status.company_id})`);
            console.log(`   - Status: ${status.status}`);
            console.log(`   - Payment Proof ID: ${status.payment_proof_id || 'NULL'}`);
            console.log(`   - Accepted At: ${status.accepted_at || 'NULL'}`);
        });

        console.log('\n🎯 ANALYSIS:');
        console.log('=' .repeat(40));
        
        const responsesWithPaymentProof = responses.filter(r => r.payment_proof_uploaded === 1);
        console.log(`Responses with payment proof uploaded: ${responsesWithPaymentProof.length}`);
        
        if (responsesWithPaymentProof.length > 0) {
            console.log('✅ Payment proofs are being returned by API');
            responsesWithPaymentProof.forEach(r => {
                console.log(`   - ${r.company_name}: payment_proof_uploaded = ${r.payment_proof_uploaded}`);
            });
        } else {
            console.log('❌ Payment proofs are NOT being returned by API');
            console.log('   This means the JOIN is not working correctly');
        }

        const acceptedResponses = responses.filter(r => r.user_response_status === 'accepted');
        console.log(`\nAccepted responses: ${acceptedResponses.length}`);
        
        if (acceptedResponses.length === 0) {
            console.log('❌ No accepted responses found');
            console.log('   User needs to click "Accept Quote" button');
        }

    } catch (error) {
        console.error('❌ Error debugging API query:', error);
    } finally {
        await db.end();
    }
}

debugApiQuery();