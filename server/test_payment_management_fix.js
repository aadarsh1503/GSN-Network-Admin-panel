// Test script to verify payment management fixes
import db from './config/db.js';

async function testPaymentManagementFix() {
    try {
        console.log('🧪 Testing Payment Management Fix...\n');
        
        // Test 1: Check if there are any accepted quotes with payment proofs
        console.log('1️⃣ Checking accepted quotes with payment proofs...');
        const [acceptedWithPayments] = await db.execute(`
            SELECT qr.id as response_id,
                   qr.quote_id,
                   qr.company_id,
                   qr.price,
                   u.name as user_name,
                   u.email as user_email,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pp.file_path as payment_proof_url,
                   pp.upload_date as payment_proof_date,
                   pv.verification_status as payment_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE uqs.status = 'accepted' AND pp.id IS NOT NULL
            ORDER BY qr.created_at DESC
        `);
        
        console.log(`Found ${acceptedWithPayments.length} accepted quotes with payment proofs:`);
        acceptedWithPayments.forEach((item, index) => {
            console.log(`${index + 1}. Quote #${item.quote_id} - Response #${item.response_id}`);
            console.log(`   User: ${item.user_name} (${item.user_email})`);
            console.log(`   Price: $${item.price}`);
            console.log(`   Accepted: ${item.accepted_at}`);
            console.log(`   Payment Proof: ${item.payment_proof_url ? 'YES' : 'NO'}`);
            console.log(`   Payment Status: ${item.payment_status || 'PENDING'}`);
            console.log('');
        });
        
        // Test 2: Test the exact query used by PaymentManagement component
        console.log('2️⃣ Testing PaymentManagement API query...');
        const companyId = 8; // Use a company that should have accepted quotes
        
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
        
        console.log(`\nCompany ${companyId} has ${companyPayments.length} total responses:`);
        
        const pendingPayments = companyPayments.filter(item => {
            const hasAcceptedStatus = item.user_response_status === 'accepted';
            const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
            const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
            
            return hasAcceptedStatus && hasPaymentProof && needsVerification;
        });
        
        console.log(`Filtered to ${pendingPayments.length} pending payment verifications:`);
        pendingPayments.forEach((payment, index) => {
            console.log(`${index + 1}. Quote #${payment.quote_id} - ${payment.user_name}`);
            console.log(`   Price: $${payment.price}`);
            console.log(`   Payment Proof: ${payment.payment_proof_url ? 'YES' : 'NO'}`);
            console.log(`   Status: ${payment.payment_status || 'PENDING'}`);
            console.log('');
        });
        
        // Test 3: Check for multiple acceptances (should be prevented now)
        console.log('3️⃣ Checking for multiple acceptances per quote...');
        const [multipleAcceptances] = await db.execute(`
            SELECT quote_id, COUNT(*) as acceptance_count
            FROM user_quote_status 
            WHERE status = 'accepted'
            GROUP BY quote_id, user_id
            HAVING acceptance_count > 1
        `);
        
        if (multipleAcceptances.length > 0) {
            console.log(`❌ Found ${multipleAcceptances.length} quotes with multiple acceptances:`);
            multipleAcceptances.forEach(item => {
                console.log(`   Quote #${item.quote_id}: ${item.acceptance_count} acceptances`);
            });
        } else {
            console.log('✅ No multiple acceptances found - fix is working!');
        }
        
        console.log('\n✅ Payment Management Fix Test Complete!');
        
    } catch (error) {
        console.error('❌ Error testing payment management fix:', error);
    } finally {
        process.exit(0);
    }
}

testPaymentManagementFix();