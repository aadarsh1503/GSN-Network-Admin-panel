// Simple script to check the quote visibility for the specific accounts
// This uses the existing database connection setup

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create database connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const TEST_ACCOUNTS = {
    old: 'aadarshchauhan35@gmail.com',
    new: 'last@gmail.com'
};

// Function to get user info
const getUserInfo = async (email) => {
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

// Function to get company's active quotes (My Quotes page logic)
const getCompanyActiveQuotes = async (companyId) => {
    try {
        const [quotes] = await db.execute(`
            SELECT q.id,
                   qr.price,
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.status,
                   u.name as user_name,
                   u.email as user_email,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pp.file_path as payment_proof_url
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE qr.company_id = ?
            AND (
                uqs.status = 'accepted' 
                OR pv.verification_status = 'verified'
                OR pp.id IS NOT NULL
            )
            ORDER BY qr.created_at DESC
        `, [companyId]);
        
        return quotes;
    } catch (error) {
        console.error('Error fetching company active quotes:', error.message);
        return [];
    }
};

// Function to get available quotes for a company
const getAvailableQuotes = async (companyId) => {
    try {
        // Get company location first
        const [companyLocation] = await db.execute(
            'SELECT country FROM users WHERE id = ?',
            [companyId]
        );
        
        const country = companyLocation[0]?.country || '';
        
        let locationFilter = '';
        let locationParams = [];
        
        if (country) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [country, country];
        }

        const [quotes] = await db.execute(`
            SELECT q.id,
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.status,
                   q.created_at,
                   COALESCE(u.name, q.contact_name) as user_name,
                   COALESCE(u.email, q.contact_email) as user_email
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
        `, [companyId, companyId, ...locationParams]);
        
        return quotes;
    } catch (error) {
        console.error('Error fetching available quotes:', error.message);
        return [];
    }
};

// Main function
const checkAccounts = async () => {
    console.log('🔍 Checking Quote Visibility for Test Accounts');
    console.log('=' .repeat(60));
    
    try {
        // Test database connection
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Get both accounts
        console.log('\n📋 Fetching Account Information:');
        const oldAccount = await getUserInfo(TEST_ACCOUNTS.old);
        const newAccount = await getUserInfo(TEST_ACCOUNTS.new);
        
        if (!oldAccount) {
            console.log(`❌ Old account not found: ${TEST_ACCOUNTS.old}`);
            return;
        }
        
        if (!newAccount) {
            console.log(`❌ New account not found: ${TEST_ACCOUNTS.new}`);
            return;
        }
        
        console.log(`✅ Old Account: ${oldAccount.name} (ID: ${oldAccount.id}, Role: ${oldAccount.role})`);
        console.log(`✅ New Account: ${newAccount.name} (ID: ${newAccount.id}, Role: ${newAccount.role})`);
        
        // Check old account's active quotes
        console.log(`\n📋 ${oldAccount.name} - My Quotes (Active/Verified):`);
        console.log('-'.repeat(50));
        
        const oldAccountQuotes = await getCompanyActiveQuotes(oldAccount.id);
        console.log(`Found ${oldAccountQuotes.length} active quotes`);
        
        if (oldAccountQuotes.length > 0) {
            oldAccountQuotes.slice(0, 5).forEach((quote, index) => {
                console.log(`${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Price: $${quote.price}`);
                console.log(`   Status: ${quote.status} | User Response: ${quote.user_response_status || 'N/A'}`);
                console.log(`   Payment: ${quote.payment_status || 'N/A'} | Customer: ${quote.user_name}`);
                if (quote.accepted_at) {
                    console.log(`   ✅ Accepted: ${new Date(quote.accepted_at).toLocaleString()}`);
                }
                if (quote.verification_date) {
                    console.log(`   ✅ Verified: ${new Date(quote.verification_date).toLocaleString()}`);
                }
                console.log('');
            });
        }
        
        // Check new account's available quotes
        console.log(`\n📋 ${newAccount.name} - Available Quotes:`);
        console.log('-'.repeat(50));
        
        const newAccountQuotes = await getAvailableQuotes(newAccount.id);
        console.log(`Found ${newAccountQuotes.length} available quotes`);
        
        if (newAccountQuotes.length > 0) {
            newAccountQuotes.slice(0, 5).forEach((quote, index) => {
                console.log(`${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`   Status: ${quote.status} | Customer: ${quote.user_name}`);
                console.log(`   Created: ${new Date(quote.created_at).toLocaleString()}`);
                console.log('');
            });
        }
        
        // Cross-reference analysis
        console.log('\n🔍 Cross-Reference Analysis:');
        console.log('-'.repeat(50));
        
        const oldQuoteIds = oldAccountQuotes.map(q => q.id);
        const newQuoteIds = newAccountQuotes.map(q => q.id);
        
        console.log(`Old Account Active Quote IDs: [${oldQuoteIds.join(', ')}]`);
        console.log(`New Account Available Quote IDs: [${newQuoteIds.join(', ')}]`);
        
        const overlappingQuotes = oldQuoteIds.filter(id => newQuoteIds.includes(id));
        
        if (overlappingQuotes.length > 0) {
            console.log(`\n⚠️  ISSUE DETECTED!`);
            console.log(`❌ ${overlappingQuotes.length} quotes verified by old account are still visible to new account:`);
            console.log(`Problematic Quote IDs: [${overlappingQuotes.join(', ')}]`);
            
            // Check each problematic quote
            for (const quoteId of overlappingQuotes) {
                console.log(`\n🔍 Analyzing Quote ${quoteId}:`);
                
                // Check user_quote_status
                const [userStatus] = await db.execute(
                    'SELECT status, accepted_at, payment_proof_id FROM user_quote_status WHERE quote_id = ?',
                    [quoteId]
                );
                console.log(`   User Status Records: ${userStatus.length}`);
                userStatus.forEach(status => {
                    console.log(`     - Status: ${status.status}, Accepted: ${status.accepted_at}, Payment Proof: ${status.payment_proof_id}`);
                });
                
                // Check payment proofs
                const [paymentProofs] = await db.execute(`
                    SELECT pp.id, pv.verification_status
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
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('-'.repeat(30));
        console.log(`Old Account Active Quotes: ${oldAccountQuotes.length}`);
        console.log(`New Account Available Quotes: ${newAccountQuotes.length}`);
        console.log(`Overlapping Quotes: ${overlappingQuotes.length}`);
        console.log(`System Status: ${overlappingQuotes.length === 0 ? '✅ Working Correctly' : '❌ Issue Detected'}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
        console.log('\n🏁 Check completed');
    }
};

// Run the check
checkAccounts();