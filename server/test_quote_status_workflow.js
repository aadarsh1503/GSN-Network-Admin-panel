// Test script to verify the complete quote workflow
// This script helps verify that the quote status changes correctly through the workflow

import db from './config/db.js';

const testQuoteStatusWorkflow = async () => {
    try {
        console.log('🔍 Testing Quote Status Workflow...\n');

        // 1. Find a quote with accepted response and pending payment
        console.log('1. Looking for quotes with accepted responses and pending payments...');
        const [pendingQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.status as quote_status, q.user_id,
                   uqs.user_response_status, uqs.payment_verification_status,
                   pv.verification_status as payment_status,
                   u.name as user_name, u.email as user_email
            FROM quotes q
            JOIN user_quote_status uqs ON q.id = uqs.quote_id
            LEFT JOIN payment_verifications pv ON q.id = pv.quote_id AND uqs.quote_response_id = pv.quote_response_id
            JOIN users u ON q.user_id = u.id
            WHERE uqs.user_response_status = 'accepted'
            ORDER BY q.created_at DESC
            LIMIT 5
        `);

        if (pendingQuotes.length === 0) {
            console.log('❌ No quotes found with accepted responses');
            return;
        }

        console.log(`✅ Found ${pendingQuotes.length} quotes with accepted responses:\n`);
        
        pendingQuotes.forEach((quote, index) => {
            console.log(`${index + 1}. Quote #${quote.id} (${quote.user_name})`);
            console.log(`   - Quote Status: ${quote.quote_status}`);
            console.log(`   - User Response: ${quote.user_response_status}`);
            console.log(`   - Payment Status: ${quote.payment_status || 'No payment verification'}`);
            console.log(`   - Payment Verification Status: ${quote.payment_verification_status || 'None'}`);
            console.log('');
        });

        // 2. Check for payment verifications that need to be processed
        console.log('2. Checking payment verifications...');
        const [paymentVerifications] = await db.execute(`
            SELECT pv.*, q.status as quote_status, u.name as user_name, c.name as company_name
            FROM payment_verifications pv
            JOIN quotes q ON pv.quote_id = q.id
            JOIN users u ON pv.user_id = u.id
            JOIN users c ON pv.company_id = c.id
            WHERE pv.verification_status = 'pending'
            ORDER BY pv.created_at DESC
            LIMIT 5
        `);

        if (paymentVerifications.length > 0) {
            console.log(`✅ Found ${paymentVerifications.length} pending payment verifications:\n`);
            
            paymentVerifications.forEach((pv, index) => {
                console.log(`${index + 1}. Quote #${pv.quote_id} - ${pv.user_name} → ${pv.company_name}`);
                console.log(`   - Current Quote Status: ${pv.quote_status}`);
                console.log(`   - Payment Status: ${pv.verification_status}`);
                console.log(`   - Created: ${pv.created_at}`);
                console.log('');
            });
        } else {
            console.log('ℹ️  No pending payment verifications found');
        }

        // 3. Show the expected workflow
        console.log('\n📋 Expected Workflow:');
        console.log('1. User gives quote → Quote status: "pending"');
        console.log('2. Company adds prices and responds → Quote status: "pending"');
        console.log('3. User uploads payment proof → Quote status: "pending"');
        console.log('4. User accepts quote → Quote status: "pending", user_response_status: "accepted"');
        console.log('5. Company verifies payment → Quote status: "approved" ✅');
        console.log('6. Company accepts quote → Work begins');

        // 4. Check for quotes that should be approved but aren't
        console.log('\n4. Checking for quotes that should be approved...');
        const [shouldBeApproved] = await db.execute(`
            SELECT q.id, q.status, uqs.user_response_status, pv.verification_status,
                   u.name as user_name
            FROM quotes q
            JOIN user_quote_status uqs ON q.id = uqs.quote_id
            JOIN payment_verifications pv ON q.id = pv.quote_id AND uqs.quote_response_id = pv.quote_response_id
            JOIN users u ON q.user_id = u.id
            WHERE uqs.user_response_status = 'accepted' 
            AND pv.verification_status = 'verified'
            AND q.status != 'approved'
        `);

        if (shouldBeApproved.length > 0) {
            console.log(`⚠️  Found ${shouldBeApproved.length} quotes that should be approved but aren't:`);
            shouldBeApproved.forEach(quote => {
                console.log(`   - Quote #${quote.id} (${quote.user_name}): Status is "${quote.status}" but should be "approved"`);
            });
        } else {
            console.log('✅ All verified payments have correct quote status');
        }

        console.log('\n🔧 To test the fix:');
        console.log('1. Login as a user and create a quote');
        console.log('2. Login as a company and respond to the quote');
        console.log('3. Login as user, upload payment proof, and accept the quote');
        console.log('4. Login as company and verify the payment in Payment Management');
        console.log('5. Check that the quote status changes to "approved" in the user\'s quote details');

    } catch (error) {
        console.error('❌ Error testing quote workflow:', error);
    }
};

testQuoteStatusWorkflow();