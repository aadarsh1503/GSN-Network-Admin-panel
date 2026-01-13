// Simple Quote Visibility Verification Script
// This script checks the specific accounts mentioned in the issue

import db from './config/db.js';

const TEST_ACCOUNTS = {
    old: {
        email: 'aadarshchauhan35@gmail.com',
        name: 'Old Account (Verified Company)'
    },
    new: {
        email: 'last@gmail.com', 
        name: 'New Account (Testing Visibility)'
    }
};

// Function to get user info by email
const getUserByEmail = async (email) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, role, country FROM users WHERE email = ?',
            [email]
        );
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error(`Error fetching user ${email}:`, error.message);
        return null;
    }
};

// Function to get company's verified/approved quotes (My Quotes logic)
const getCompanyVerifiedQuotes = async (companyId, companyName) => {
    console.log(`\n🔍 Checking ${companyName} - My Quotes (Verified/Approved)`);
    console.log('-'.repeat(60));
    
    try {
        // Use the same logic as MyQuotes component
        const [quotes] = await db.execute(`
            SELECT q.id,
                   qr.id as response_id,
                   qr.quote_id,
                   qr.company_id,
                   qr.price,
                   qr.transit_time,
                   qr.created_at as response_created_at,
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.shipping_mode,
                   q.arrival_date,
                   q.status,
                   q.created_at,
                   -- Customer information
                   u.name as user_name,
                   u.email as user_email,
                   u.phone as user_phone,
                   -- Quote status and payment info
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   CASE WHEN qr.requires_payment_proof = 1 THEN 1 ELSE 0 END as has_payment_proof,
                   pv.verification_status as payment_status,
                   pv.verification_date
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [companyId]);

        // Filter for active quotes (same logic as MyQuotes)
        const activeQuotes = quotes.filter(item => {
            return item.user_response_status === 'accepted' || 
                   item.payment_status === 'verified' ||
                   item.payment_proof_url; // Has payment proof uploaded
        });

        console.log(`📊 Total responses: ${quotes.length}`);
        console.log(`📊 Active quotes (accepted/verified/payment): ${activeQuotes.length}`);
        
        if (activeQuotes.length > 0) {
            console.log('\n📋 Active Quotes Details:');
            activeQuotes.slice(0, 5).forEach((quote, index) => {
                console.log(`\n${index + 1}. Quote ID: ${quote.id}`);
                console.log(`   Product: ${quote.product_description}`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Price: $${quote.price}`);
                console.log(`   Quote Status: ${quote.status}`);
                console.log(`   User Response: ${quote.user_response_status || 'N/A'}`);
                console.log(`   Payment Status: ${quote.payment_status || 'N/A'}`);
                console.log(`   Customer: ${quote.user_name} (${quote.user_email})`);
                
                if (quote.accepted_at) {
                    console.log(`   ✅ Accepted: ${new Date(quote.accepted_at).toLocaleString()}`);
                }
                if (quote.verification_date) {
                    console.log(`   ✅ Payment Verified: ${new Date(quote.verification_date).toLocaleString()}`);
                }
                if (quote.payment_proof_url) {
                    console.log(`   💳 Payment Proof: Uploaded`);
                }
            });
            
            if (activeQuotes.length > 5) {
                console.log(`   ... and ${activeQuotes.length - 5} more active quotes`);
            }
        } else {
            console.log(`   ℹ️  No active quotes found for ${companyName}`);
        }

        return activeQuotes;
    } catch (error) {
        console.error(`Error fetching verified quotes for ${companyName}:`, error.message);
        return [];
    }
};

// Function to get available quotes for a company (Available Quotes logic)
const getAvailableQuotesForCompany = async (companyId, companyName) => {
    console.log(`\n🔍 Checking ${companyName} - Available Quotes`);
    console.log('-'.repeat(60));
    
    try {
        // Get company location
        const [companyLocation] = await db.execute(
            'SELECT country, state, city FROM users WHERE id = ?',
            [companyId]
        );

        if (companyLocation.length === 0) {
            console.log(`❌ Company location not found for ID: ${companyId}`);
            return [];
        }

        const location = companyLocation[0];
        console.log(`   📍 Company Location: ${location.city || 'N/A'}, ${location.state || 'N/A'}, ${location.country || 'N/A'}`);

        // Use the EXACT same query as getAvailableQuotes function
        let locationFilter = '';
        let locationParams = [];
        
        if (location.country) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [location.country, location.country];
        }

        const quotesSql = `
            SELECT q.*, 
                   COALESCE(u.name, q.contact_name) as user_name, 
                   COALESCE(u.email, q.contact_email) as user_email,
                   q.contact_phone as user_phone,
                   u.country as user_country,
                   -- Debug info: check why quotes might be visible
                   (SELECT COUNT(*) FROM user_quote_status uqs 
                    WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count,
                   (SELECT COUNT(*) FROM user_quote_status uqs2
                    JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                    WHERE uqs2.quote_id = q.id AND pp.id IS NOT NULL) as payment_proof_count,
                   (SELECT COUNT(*) FROM user_quote_status uqs3
                    JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                    JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                    WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified') as verified_count,
                   (SELECT COUNT(*) FROM quote_responses qr 
                    WHERE qr.quote_id = q.id AND qr.company_id = ?) as company_responses
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status IN ('pending', 'approved')
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            AND NOT EXISTS (
                SELECT 1 FROM user_quote_status uqs 
                WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
            )
            AND NOT EXISTS (
                SELECT 1 FROM user_quote_status uqs2
                JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                WHERE uqs2.quote_id = q.id AND pp.id IS NOT NULL
            )
            AND NOT EXISTS (
                SELECT 1 FROM user_quote_status uqs3
                JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified'
            )
            ${locationFilter}
            ORDER BY q.created_at DESC
            LIMIT 20
        `;

        const finalParams = [
            companyId, // for company_responses count
            companyId, companyId, // user exclusion and response check
            ...locationParams
        ];

        const [availableQuotes] = await db.execute(quotesSql, finalParams);
        
        console.log(`📊 Found ${availableQuotes.length} available quotes for ${companyName}`);
        
        if (availableQuotes.length > 0) {
            console.log('\n📋 Available Quotes Details:');
            availableQuotes.slice(0, 5).forEach((quote, index) => {
                console.log(`\n${index + 1}. Quote ID: ${quote.id}`);
                console.log(`   Product: ${quote.product_description}`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Status: ${quote.status}`);
                console.log(`   Customer: ${quote.user_name} (${quote.user_email})`);
                console.log(`   Debug - Accepted: ${quote.accepted_count}, Payments: ${quote.payment_proof_count}, Verified: ${quote.verified_count}`);
                console.log(`   Created: ${new Date(quote.created_at).toLocaleString()}`);
            });
            
            if (availableQuotes.length > 5) {
                console.log(`   ... and ${availableQuotes.length - 5} more quotes`);
            }
        } else {
            console.log(`   ℹ️  No available quotes found for ${companyName}`);
        }

        return availableQuotes;
    } catch (error) {
        console.error(`Error fetching available quotes for ${companyName}:`, error.message);
        return [];
    }
};

// Main verification function
const runVerification = async () => {
    console.log('🚀 Quote Visibility Verification - Issue Investigation');
    console.log('=' .repeat(80));
    console.log('Testing accounts:');
    console.log(`  Old Account: ${TEST_ACCOUNTS.old.email}`);
    console.log(`  New Account: ${TEST_ACCOUNTS.new.email}`);
    console.log('=' .repeat(80));
    
    try {
        // Step 1: Get both accounts
        console.log('\n📝 STEP 1: Fetching Account Information');
        console.log('-'.repeat(50));
        
        const oldAccount = await getUserByEmail(TEST_ACCOUNTS.old.email);
        const newAccount = await getUserByEmail(TEST_ACCOUNTS.new.email);
        
        if (!oldAccount) {
            console.log(`❌ Old account not found: ${TEST_ACCOUNTS.old.email}`);
            return;
        }
        
        if (!newAccount) {
            console.log(`❌ New account not found: ${TEST_ACCOUNTS.new.email}`);
            return;
        }
        
        console.log(`✅ Old Account: ${oldAccount.name} (ID: ${oldAccount.id}, Role: ${oldAccount.role})`);
        console.log(`✅ New Account: ${newAccount.name} (ID: ${newAccount.id}, Role: ${newAccount.role})`);
        
        // Step 2: Check old account's verified/approved quotes
        const oldAccountQuotes = await getCompanyVerifiedQuotes(oldAccount.id, oldAccount.name);
        
        // Step 3: Check new account's available quotes
        const newAccountQuotes = await getAvailableQuotesForCompany(newAccount.id, newAccount.name);
        
        // Step 4: Cross-reference analysis
        console.log('\n📝 STEP 4: Cross-Reference Analysis');
        console.log('-'.repeat(50));
        
        const oldQuoteIds = oldAccountQuotes.map(q => q.id);
        const newQuoteIds = newAccountQuotes.map(q => q.id);
        
        console.log(`\n🔍 Old Account Active Quote IDs: [${oldQuoteIds.join(', ')}]`);
        console.log(`🔍 New Account Available Quote IDs: [${newQuoteIds.join(', ')}]`);
        
        // Check for overlaps
        const overlappingQuotes = oldQuoteIds.filter(id => newQuoteIds.includes(id));
        
        if (overlappingQuotes.length > 0) {
            console.log(`\n⚠️  ISSUE DETECTED!`);
            console.log(`❌ ${overlappingQuotes.length} quotes verified by old account are still visible to new account:`);
            console.log(`   Problematic Quote IDs: [${overlappingQuotes.join(', ')}]`);
            
            // Detailed analysis of problematic quotes
            console.log(`\n🔍 Detailed Analysis of Problematic Quotes:`);
            for (const quoteId of overlappingQuotes) {
                console.log(`\n📋 Quote ID: ${quoteId}`);
                
                // Check quote status
                const [quoteInfo] = await db.execute(
                    'SELECT id, status, product_description FROM quotes WHERE id = ?',
                    [quoteId]
                );
                
                if (quoteInfo.length > 0) {
                    console.log(`   Quote Status: ${quoteInfo[0].status}`);
                    console.log(`   Product: ${quoteInfo[0].product_description}`);
                }
                
                // Check user_quote_status
                const [userStatus] = await db.execute(
                    'SELECT status, accepted_at, payment_proof_id FROM user_quote_status WHERE quote_id = ?',
                    [quoteId]
                );
                console.log(`   User Status Records: ${userStatus.length}`);
                userStatus.forEach(status => {
                    console.log(`     - Status: ${status.status}, Accepted: ${status.accepted_at}, Payment Proof ID: ${status.payment_proof_id}`);
                });
                
                // Check payment proofs
                const [paymentProofs] = await db.execute(`
                    SELECT pp.id, pp.file_path, pv.verification_status
                    FROM user_quote_status uqs
                    JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                    LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                    WHERE uqs.quote_id = ?
                `, [quoteId]);
                console.log(`   Payment Proofs: ${paymentProofs.length}`);
                paymentProofs.forEach(proof => {
                    console.log(`     - Proof ID: ${proof.id}, Status: ${proof.verification_status || 'pending'}`);
                });
            }
        } else {
            console.log(`\n✅ SYSTEM WORKING CORRECTLY`);
            console.log(`No verified quotes from old account are visible to new account`);
        }
        
        // Step 5: Summary
        console.log('\n📝 STEP 5: Summary');
        console.log('-'.repeat(50));
        
        console.log(`\n📊 VERIFICATION RESULTS:`);
        console.log(`   ${oldAccount.name}:`);
        console.log(`     - Active Quotes: ${oldAccountQuotes.length}`);
        console.log(`   ${newAccount.name}:`);
        console.log(`     - Available Quotes: ${newAccountQuotes.length}`);
        console.log(`   Cross-Reference:`);
        console.log(`     - Overlapping Quotes: ${overlappingQuotes.length}`);
        console.log(`     - System Status: ${overlappingQuotes.length === 0 ? '✅ Working Correctly' : '❌ Issue Detected'}`);
        
        if (overlappingQuotes.length > 0) {
            console.log(`\n🔧 RECOMMENDED ACTIONS:`);
            console.log(`   1. Check the filtering logic in getAvailableQuotes function`);
            console.log(`   2. Verify user_quote_status table data integrity`);
            console.log(`   3. Check payment_proofs and payment_verifications tables`);
            console.log(`   4. Review the NOT EXISTS clauses in the SQL query`);
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        console.log('\n🏁 Verification completed');
        console.log('=' .repeat(80));
        
        // Close database connection
        if (db && db.end) {
            await db.end();
        }
    }
};

// Run the verification
runVerification().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});