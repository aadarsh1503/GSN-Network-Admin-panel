// Test script to verify available quotes filtering fix
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gsn_network',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testAvailableQuotesFiltering() {
    console.log('🔍 Testing Available Quotes Filtering Fix\n');
    
    try {
        // Step 1: Find quotes with accepted responses
        console.log('📋 Step 1: Finding quotes with accepted responses...');
        const [acceptedQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.product_description, q.status,
                   uqs.status as quote_status,
                   c.name as company_name
            FROM quotes q
            JOIN user_quote_status uqs ON q.id = uqs.quote_id
            JOIN users c ON uqs.company_id = c.id
            WHERE uqs.status = 'accepted'
            LIMIT 5
        `);
        
        console.log(`Found ${acceptedQuotes.length} quotes with accepted responses:`);
        acceptedQuotes.forEach(quote => {
            console.log(`  - Quote ${quote.id}: ${quote.product_description} (accepted by ${quote.company_name})`);
        });
        
        // Step 2: Find quotes with payment proofs
        console.log('\n📋 Step 2: Finding quotes with payment proofs...');
        const [paymentQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.product_description,
                   pp.file_path,
                   pv.verification_status,
                   c.name as company_name
            FROM quotes q
            JOIN user_quote_status uqs ON q.id = uqs.quote_id
            JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            JOIN users c ON uqs.company_id = c.id
            LIMIT 5
        `);
        
        console.log(`Found ${paymentQuotes.length} quotes with payment proofs:`);
        paymentQuotes.forEach(quote => {
            console.log(`  - Quote ${quote.id}: ${quote.product_description} (payment by ${quote.company_name}, status: ${quote.verification_status || 'pending'})`);
        });
        
        // Step 3: Test the filtering logic for a sample company
        console.log('\n📋 Step 3: Testing filtering logic...');
        
        // Get a sample company
        const [companies] = await db.execute(`
            SELECT id, name, country FROM users WHERE role = 'company' LIMIT 1
        `);
        
        if (companies.length === 0) {
            console.log('❌ No companies found for testing');
            return;
        }
        
        const testCompany = companies[0];
        console.log(`Testing with company: ${testCompany.name} (ID: ${testCompany.id})`);
        
        // Test the new filtering query
        const quotesSql = `
            SELECT q.id, q.product_description, q.status,
                   COALESCE(u.name, q.contact_name) as user_name
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
            ORDER BY q.created_at DESC
            LIMIT 10
        `;
        
        const [availableQuotes] = await db.execute(quotesSql, [testCompany.id, testCompany.id]);
        
        console.log(`\n✅ Available quotes for ${testCompany.name}: ${availableQuotes.length}`);
        availableQuotes.forEach(quote => {
            console.log(`  - Quote ${quote.id}: ${quote.product_description} (by ${quote.user_name || 'Guest'})`);
        });
        
        // Step 4: Verify that accepted/payment quotes are NOT in the available list
        console.log('\n📋 Step 4: Verification check...');
        
        const acceptedQuoteIds = acceptedQuotes.map(q => q.id);
        const paymentQuoteIds = paymentQuotes.map(q => q.id);
        const availableQuoteIds = availableQuotes.map(q => q.id);
        
        const foundAcceptedInAvailable = acceptedQuoteIds.filter(id => availableQuoteIds.includes(id));
        const foundPaymentInAvailable = paymentQuoteIds.filter(id => availableQuoteIds.includes(id));
        
        if (foundAcceptedInAvailable.length === 0 && foundPaymentInAvailable.length === 0) {
            console.log('✅ SUCCESS: No accepted or payment quotes found in available list');
        } else {
            console.log('❌ ISSUE FOUND:');
            if (foundAcceptedInAvailable.length > 0) {
                console.log(`  - Accepted quotes still showing: ${foundAcceptedInAvailable.join(', ')}`);
            }
            if (foundPaymentInAvailable.length > 0) {
                console.log(`  - Payment quotes still showing: ${foundPaymentInAvailable.join(', ')}`);
            }
        }
        
        // Step 5: Summary
        console.log('\n📊 Summary:');
        console.log(`- Total quotes with accepted responses: ${acceptedQuotes.length}`);
        console.log(`- Total quotes with payment proofs: ${paymentQuotes.length}`);
        console.log(`- Available quotes for test company: ${availableQuotes.length}`);
        console.log(`- Filtering working correctly: ${foundAcceptedInAvailable.length === 0 && foundPaymentInAvailable.length === 0 ? '✅ YES' : '❌ NO'}`);
        
    } catch (error) {
        console.error('❌ Error testing filtering:', error);
    } finally {
        await db.end();
    }
}

// Run the test
testAvailableQuotesFiltering();