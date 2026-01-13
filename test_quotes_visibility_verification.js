// Comprehensive Quote Visibility & Approval Logic Verification Script
// This script tests the specific scenario described in the issue

import db from './server/config/db.js';
import bcrypt from 'bcryptjs';

const TEST_ACCOUNTS = {
    old: {
        email: 'aadarshchauhan35@gmail.com',
        password: '222333',
        name: 'Aadarsh Chauhan Company'
    },
    new: {
        email: 'last@gmail.com', 
        password: '222333',
        name: 'Last Company'
    }
};

// Helper function to authenticate and get user info
const authenticateUser = async (email, password) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, password, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log(`❌ User not found: ${email}`);
            return null;
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log(`❌ Invalid password for: ${email}`);
            return null;
        }

        console.log(`✅ Authenticated: ${user.name} (${user.email}) - Role: ${user.role}`);
        return user;
    } catch (error) {
        console.error(`Error authenticating ${email}:`, error.message);
        return null;
    }
};

// Function to get quotes that a company has verified/approved
const getCompanyVerifiedQuotes = async (companyId, companyName) => {
    console.log(`\n🔍 Checking verified/approved quotes for ${companyName} (ID: ${companyId})`);
    
    try {
        // Get quotes where this company has responses that were accepted and verified
        const [verifiedQuotes] = await db.execute(`
            SELECT DISTINCT
                q.id as quote_id,
                q.product_description,
                q.departure_country,
                q.arrival_country,
                q.status as quote_status,
                qr.id as response_id,
                qr.price,
                qr.created_at as response_date,
                uqs.status as user_response_status,
                uqs.accepted_at,
                pp.id as payment_proof_id,
                pp.file_path as payment_proof_url,
                pv.verification_status as payment_status,
                pv.verification_date,
                pv.company_notes as payment_notes,
                u.name as customer_name,
                u.email as customer_email
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.company_id = ?
            AND (
                uqs.status = 'accepted' 
                OR pv.verification_status = 'verified'
                OR pp.id IS NOT NULL
            )
            ORDER BY qr.created_at DESC
        `, [companyId]);

        console.log(`📊 Found ${verifiedQuotes.length} verified/approved quotes for ${companyName}`);
        
        if (verifiedQuotes.length > 0) {
            console.log('\n📋 Verified/Approved Quotes Details:');
            verifiedQuotes.forEach((quote, index) => {
                console.log(`\n${index + 1}. Quote ID: ${quote.quote_id}`);
                console.log(`   Product: ${quote.product_description}`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Price: $${quote.price}`);
                console.log(`   Quote Status: ${quote.quote_status}`);
                console.log(`   User Response: ${quote.user_response_status || 'N/A'}`);
                console.log(`   Payment Status: ${quote.payment_status || 'N/A'}`);
                console.log(`   Customer: ${quote.customer_name} (${quote.customer_email})`);
                
                if (quote.accepted_at) {
                    console.log(`   ✅ Accepted: ${new Date(quote.accepted_at).toLocaleString()}`);
                }
                if (quote.verification_date) {
                    console.log(`   ✅ Payment Verified: ${new Date(quote.verification_date).toLocaleString()}`);
                }
                if (quote.payment_proof_url) {
                    console.log(`   💳 Payment Proof: ${quote.payment_proof_url ? 'Uploaded' : 'None'}`);
                }
            });
        } else {
            console.log(`   ℹ️  No verified/approved quotes found for ${companyName}`);
        }

        return verifiedQuotes;
    } catch (error) {
        console.error(`Error fetching verified quotes for ${companyName}:`, error.message);
        return [];
    }
};

// Function to get available quotes for a company (same logic as backend)
const getAvailableQuotesForCompany = async (companyId, companyName) => {
    console.log(`\n🔍 Checking available quotes for ${companyName} (ID: ${companyId})`);
    
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
        console.log(`   📍 Company Location: ${location.city}, ${location.state}, ${location.country}`);

        // Use the EXACT same query as getAvailableQuotes function
        let locationFilter = '';
        let locationParams = [];
        
        if (location.country) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [location.country, location.country];
        }

        const quotesSql = `
            SELECT q.id, q.product_description, q.departure_country, q.arrival_country, 
                   q.status, q.created_at,
                   COALESCE(u.name, q.contact_name) as user_name, 
                   COALESCE(u.email, q.contact_email) as user_email,
                   -- Check if quote has accepted responses
                   (SELECT COUNT(*) FROM user_quote_status uqs 
                    WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count,
                   -- Check if quote has payment proofs
                   (SELECT COUNT(*) FROM user_quote_status uqs2
                    JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                    WHERE uqs2.quote_id = q.id) as payment_proof_count,
                   -- Check if quote has verified payments
                   (SELECT COUNT(*) FROM user_quote_status uqs3
                    JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                    JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                    WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified') as verified_count
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
        `;

        const finalParams = [
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
                console.log(`   Accepted Responses: ${quote.accepted_count}`);
                console.log(`   Payment Proofs: ${quote.payment_proof_count}`);
                console.log(`   Verified Payments: ${quote.verified_count}`);
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

// Function to check database state for specific quotes
const checkQuoteStates = async (quoteIds) => {
    if (quoteIds.length === 0) return;
    
    console.log(`\n🔍 Checking database state for quotes: ${quoteIds.join(', ')}`);
    
    try {
        for (const quoteId of quoteIds.slice(0, 3)) { // Check first 3 quotes
            console.log(`\n📋 Quote ID: ${quoteId}`);
            
            // Check quote basic info
            const [quoteInfo] = await db.execute(
                'SELECT id, status, product_description, user_id FROM quotes WHERE id = ?',
                [quoteId]
            );
            
            if (quoteInfo.length > 0) {
                console.log(`   Status: ${quoteInfo[0].status}`);
                console.log(`   User ID: ${quoteInfo[0].user_id}`);
            }
            
            // Check responses
            const [responses] = await db.execute(
                'SELECT id, company_id, price, created_at FROM quote_responses WHERE quote_id = ?',
                [quoteId]
            );
            console.log(`   Responses: ${responses.length}`);
            
            // Check user quote status
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
                SELECT pp.id, pp.file_path, pv.verification_status, pv.verification_date
                FROM user_quote_status uqs
                JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE uqs.quote_id = ?
            `, [quoteId]);
            console.log(`   Payment Proofs: ${paymentProofs.length}`);
            paymentProofs.forEach(proof => {
                console.log(`     - Proof ID: ${proof.id}, Status: ${proof.verification_status || 'pending'}, Date: ${proof.verification_date || 'N/A'}`);
            });
        }
    } catch (error) {
        console.error('Error checking quote states:', error.message);
    }
};

// Main verification function
const runVerification = async () => {
    console.log('🚀 Starting Quotes Visibility & Approval Logic Verification');
    console.log('=' .repeat(80));
    
    try {
        // Step 1: Authenticate both accounts
        console.log('\n📝 STEP 1: Authenticating Test Accounts');
        console.log('-'.repeat(50));
        
        const oldAccount = await authenticateUser(TEST_ACCOUNTS.old.email, TEST_ACCOUNTS.old.password);
        const newAccount = await authenticateUser(TEST_ACCOUNTS.new.email, TEST_ACCOUNTS.new.password);
        
        if (!oldAccount || !newAccount) {
            console.log('❌ Failed to authenticate one or both accounts. Exiting...');
            return;
        }
        
        // Step 2: Check old account's verified/approved quotes
        console.log('\n📝 STEP 2: Checking Old Account - My Quotes Page');
        console.log('-'.repeat(50));
        
        const oldAccountVerifiedQuotes = await getCompanyVerifiedQuotes(oldAccount.id, oldAccount.name);
        
        // Step 3: Check new account's available quotes
        console.log('\n📝 STEP 3: Checking New Account - Available Quotes');
        console.log('-'.repeat(50));
        
        const newAccountAvailableQuotes = await getAvailableQuotesForCompany(newAccount.id, newAccount.name);
        
        // Step 4: Cross-reference and analyze
        console.log('\n📝 STEP 4: Cross-Reference Analysis');
        console.log('-'.repeat(50));
        
        if (oldAccountVerifiedQuotes.length > 0) {
            const verifiedQuoteIds = oldAccountVerifiedQuotes.map(q => q.quote_id);
            const availableQuoteIds = newAccountAvailableQuotes.map(q => q.id);
            
            console.log(`\n🔍 Old Account Verified Quote IDs: [${verifiedQuoteIds.join(', ')}]`);
            console.log(`🔍 New Account Available Quote IDs: [${availableQuoteIds.join(', ')}]`);
            
            // Check for overlaps
            const overlappingQuotes = verifiedQuoteIds.filter(id => availableQuoteIds.includes(id));
            
            if (overlappingQuotes.length > 0) {
                console.log(`\n⚠️  POTENTIAL ISSUE FOUND!`);
                console.log(`❌ ${overlappingQuotes.length} quotes verified by old account are still visible to new account:`);
                console.log(`   Quote IDs: [${overlappingQuotes.join(', ')}]`);
                
                // Check database state for these problematic quotes
                await checkQuoteStates(overlappingQuotes);
            } else {
                console.log(`\n✅ GOOD: No verified quotes from old account are visible to new account`);
            }
        } else {
            console.log(`\nℹ️  Old account has no verified quotes to check against`);
        }
        
        // Step 5: Additional database consistency checks
        console.log('\n📝 STEP 5: Database Consistency Checks');
        console.log('-'.repeat(50));
        
        // Check for quotes that should be hidden but might still be visible
        const [problematicQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.status, q.product_description,
                   (SELECT COUNT(*) FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count,
                   (SELECT COUNT(*) FROM user_quote_status uqs2
                    JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                    WHERE uqs2.quote_id = q.id) as payment_count,
                   (SELECT COUNT(*) FROM user_quote_status uqs3
                    JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                    JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                    WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified') as verified_count
            FROM quotes q
            WHERE q.status IN ('pending', 'approved')
            AND (
                EXISTS (SELECT 1 FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted')
                OR EXISTS (SELECT 1 FROM user_quote_status uqs2 JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id WHERE uqs2.quote_id = q.id)
                OR EXISTS (SELECT 1 FROM user_quote_status uqs3 JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified')
            )
            ORDER BY q.id DESC
            LIMIT 10
        `);
        
        console.log(`\n🔍 Found ${problematicQuotes.length} quotes that should be filtered from available quotes:`);
        problematicQuotes.forEach(quote => {
            console.log(`   Quote ${quote.id}: Status=${quote.status}, Accepted=${quote.accepted_count}, Payments=${quote.payment_count}, Verified=${quote.verified_count}`);
        });
        
        // Step 6: Summary and recommendations
        console.log('\n📝 STEP 6: Summary & Recommendations');
        console.log('-'.repeat(50));
        
        console.log(`\n📊 VERIFICATION RESULTS:`);
        console.log(`   Old Account (${oldAccount.email}):`);
        console.log(`     - Verified/Approved Quotes: ${oldAccountVerifiedQuotes.length}`);
        console.log(`   New Account (${newAccount.email}):`);
        console.log(`     - Available Quotes: ${newAccountAvailableQuotes.length}`);
        console.log(`   Database Consistency:`);
        console.log(`     - Quotes that should be hidden: ${problematicQuotes.length}`);
        
        if (oldAccountVerifiedQuotes.length > 0 && newAccountAvailableQuotes.length > 0) {
            const verifiedQuoteIds = oldAccountVerifiedQuotes.map(q => q.quote_id);
            const availableQuoteIds = newAccountAvailableQuotes.map(q => q.id);
            const overlappingQuotes = verifiedQuoteIds.filter(id => availableQuoteIds.includes(id));
            
            if (overlappingQuotes.length > 0) {
                console.log(`\n❌ ISSUE CONFIRMED: ${overlappingQuotes.length} quotes are incorrectly visible`);
                console.log(`\n🔧 RECOMMENDED ACTIONS:`);
                console.log(`   1. Check the filtering logic in getAvailableQuotes function`);
                console.log(`   2. Verify user_quote_status table data integrity`);
                console.log(`   3. Check payment_proofs and payment_verifications tables`);
                console.log(`   4. Review the NOT EXISTS clauses in the SQL query`);
            } else {
                console.log(`\n✅ SYSTEM WORKING CORRECTLY: No visibility issues detected`);
            }
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        console.log('\n🏁 Verification completed');
        console.log('=' .repeat(80));
    }
};

// Run the verification
runVerification().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});