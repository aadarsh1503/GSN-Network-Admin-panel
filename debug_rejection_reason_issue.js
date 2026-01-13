// Debug script to investigate why existing rejected quotes don't show rejection reasons
import db from './server/config/db.js';

const debugRejectionReasons = async () => {
    console.log('🔍 Debugging Rejection Reason Display Issue...\n');

    try {
        // 1. Check if there are any rejected payments in the system
        console.log('1️⃣ Checking for rejected payments in payment_verifications table:');
        const [rejectedPayments] = await db.execute(`
            SELECT 
                pv.id as verification_id,
                pv.quote_id,
                pv.user_id,
                pv.company_id,
                pv.verification_status,
                pv.company_notes,
                pv.verification_date,
                pv.created_at,
                q.status as quote_status,
                u.name as user_name,
                c.name as company_name
            FROM payment_verifications pv
            JOIN quotes q ON pv.quote_id = q.id
            JOIN users u ON pv.user_id = u.id
            JOIN users c ON pv.company_id = c.id
            WHERE pv.verification_status = 'rejected'
            ORDER BY pv.verification_date DESC
            LIMIT 10
        `);

        if (rejectedPayments.length === 0) {
            console.log('❌ No rejected payments found in payment_verifications table');
            console.log('   This means no payments have been rejected yet.');
        } else {
            console.log(`✅ Found ${rejectedPayments.length} rejected payments:`);
            rejectedPayments.forEach((payment, index) => {
                console.log(`   ${index + 1}. Quote #${payment.quote_id} - ${payment.user_name} → ${payment.company_name}`);
                console.log(`      Status: ${payment.verification_status}`);
                console.log(`      Reason: ${payment.company_notes || 'NO REASON PROVIDED'}`);
                console.log(`      Rejected: ${payment.verification_date}`);
                console.log(`      Quote Status: ${payment.quote_status}`);
                console.log('');
            });
        }

        // 2. Check specific quote #92 if it exists
        console.log('\n2️⃣ Checking specific quote #92:');
        const [quote92] = await db.execute(`
            SELECT 
                q.id,
                q.user_id,
                q.status as quote_status,
                q.product_description,
                u.name as user_name,
                u.email as user_email
            FROM quotes q
            JOIN users u ON q.user_id = u.id
            WHERE q.id = 92
        `);

        if (quote92.length === 0) {
            console.log('❌ Quote #92 not found');
        } else {
            const quote = quote92[0];
            console.log(`✅ Quote #92 found:`);
            console.log(`   User: ${quote.user_name} (${quote.user_email})`);
            console.log(`   Status: ${quote.quote_status}`);
            console.log(`   Product: ${quote.product_description}`);

            // Check quote responses for quote #92
            console.log('\n   📋 Quote Responses for Quote #92:');
            const [responses92] = await db.execute(`
                SELECT 
                    qr.id as response_id,
                    qr.company_id,
                    qr.price,
                    c.name as company_name,
                    uqs.status as user_response_status,
                    uqs.accepted_at,
                    pp.id as payment_proof_id,
                    pp.file_path as payment_proof_url,
                    pv.id as verification_id,
                    pv.verification_status as payment_status,
                    pv.company_notes as payment_company_notes,
                    pv.verification_date
                FROM quote_responses qr
                JOIN users c ON qr.company_id = c.id
                LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
                LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE qr.quote_id = 92
                ORDER BY qr.created_at DESC
            `, [quote.user_id]);

            if (responses92.length === 0) {
                console.log('   ❌ No responses found for Quote #92');
            } else {
                console.log(`   ✅ Found ${responses92.length} responses:`);
                responses92.forEach((response, index) => {
                    console.log(`      ${index + 1}. Company: ${response.company_name}`);
                    console.log(`         Response ID: ${response.response_id}`);
                    console.log(`         Price: $${response.price}`);
                    console.log(`         User Response: ${response.user_response_status || 'No response'}`);
                    console.log(`         Payment Proof: ${response.payment_proof_id ? 'Uploaded' : 'Not uploaded'}`);
                    console.log(`         Payment Status: ${response.payment_status || 'No verification'}`);
                    console.log(`         Rejection Reason: ${response.payment_company_notes || 'No reason'}`);
                    console.log(`         Verification Date: ${response.verification_date || 'Not verified'}`);
                    console.log('');
                });
            }
        }

        // 3. Test the exact API call that the frontend makes
        console.log('\n3️⃣ Testing API call for Quote #92:');
        const [apiResponse] = await db.execute(`
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
                   cbd.iban_number,
                   cbd.swift_code,
                   cbd.routing_number,
                   cbd.payment_instructions as bank_instructions,
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
                   pv.company_notes as payment_company_notes,
                   CASE WHEN pv.verification_status = 'rejected' THEN pv.verification_date ELSE NULL END as rejection_date
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE qr.quote_id = 92
            ORDER BY qr.created_at DESC
        `, [quote92.length > 0 ? quote92[0].user_id : 0]);

        console.log(`   API would return ${apiResponse.length} responses:`);
        apiResponse.forEach((response, index) => {
            console.log(`      ${index + 1}. Company: ${response.company_name}`);
            console.log(`         Payment Status: ${response.payment_status || 'null'}`);
            console.log(`         Payment Company Notes: ${response.payment_company_notes || 'null'}`);
            console.log(`         Rejection Date: ${response.rejection_date || 'null'}`);
            console.log(`         User Response Status: ${response.user_response_status || 'null'}`);
            console.log('');
        });

        // 4. Check for data inconsistencies
        console.log('\n4️⃣ Checking for potential data issues:');
        
        // Check for quotes with rejected status but no payment verification
        const [orphanedRejected] = await db.execute(`
            SELECT q.id, q.status, q.user_id, u.name as user_name
            FROM quotes q
            JOIN users u ON q.user_id = u.id
            WHERE q.status = 'rejected' 
            AND NOT EXISTS (
                SELECT 1 FROM payment_verifications pv 
                WHERE pv.quote_id = q.id AND pv.verification_status = 'rejected'
            )
            LIMIT 5
        `);

        if (orphanedRejected.length > 0) {
            console.log(`   ⚠️  Found ${orphanedRejected.length} quotes with 'rejected' status but no payment verification:`);
            orphanedRejected.forEach(quote => {
                console.log(`      Quote #${quote.id} - ${quote.user_name} (Status: ${quote.status})`);
            });
        } else {
            console.log('   ✅ No orphaned rejected quotes found');
        }

        // Check for payment verifications without proper linking
        const [unlinkedVerifications] = await db.execute(`
            SELECT pv.id, pv.quote_id, pv.verification_status, pv.company_notes
            FROM payment_verifications pv
            WHERE pv.verification_status = 'rejected'
            AND (pv.company_notes IS NULL OR pv.company_notes = '')
            LIMIT 5
        `);

        if (unlinkedVerifications.length > 0) {
            console.log(`   ⚠️  Found ${unlinkedVerifications.length} rejected payments without rejection reasons:`);
            unlinkedVerifications.forEach(verification => {
                console.log(`      Verification #${verification.id} - Quote #${verification.quote_id}`);
            });
        } else {
            console.log('   ✅ All rejected payments have rejection reasons');
        }

        // 5. Provide recommendations
        console.log('\n5️⃣ Recommendations:');
        
        if (rejectedPayments.length === 0) {
            console.log('   💡 No rejected payments exist yet. To test:');
            console.log('      1. Have a business user upload payment proof');
            console.log('      2. Have a company reject the payment with a reason');
            console.log('      3. Then check the business quote details page');
        } else {
            const hasReasonsCount = rejectedPayments.filter(p => p.company_notes).length;
            console.log(`   📊 ${hasReasonsCount}/${rejectedPayments.length} rejected payments have reasons`);
            
            if (hasReasonsCount < rejectedPayments.length) {
                console.log('   💡 Some rejected payments are missing reasons. This could be because:');
                console.log('      - They were rejected before the reason field was implemented');
                console.log('      - The company didn\'t provide a reason when rejecting');
            }
        }

        console.log('\n✅ Debug analysis complete!');

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        process.exit(0);
    }
};

// Run the debug script
debugRejectionReasons();