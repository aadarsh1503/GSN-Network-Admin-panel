// Check for specific quote overlap issue - quotes verified by old account still visible to new account
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: '92.112.181.224',
  user: 'gsnuser',
  password: 'sCp@/2I1D3w',
  database: 'GSN',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const checkSpecificOverlap = async () => {
    console.log('🔍 Checking Specific Quote Overlap Issue');
    console.log('=' .repeat(60));
    
    try {
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        const oldAccountId = 10; // aadarshchauhan35@gmail.com
        const newAccountId = 31; // last@gmail.com
        
        console.log('\n📋 Step 1: Get quotes that old account has verified/approved');
        console.log('-'.repeat(50));
        
        // Get quotes where old account has verified/approved responses
        const [oldAccountVerifiedQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.product_description, q.departure_country, q.arrival_country,
                   qr.price, qr.created_at as response_date,
                   uqs.status as user_response_status, uqs.accepted_at,
                   pv.verification_status as payment_status, pv.verification_date,
                   u.name as customer_name
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
        `, [oldAccountId]);
        
        console.log(`Found ${oldAccountVerifiedQuotes.length} quotes verified/approved by old account:`);
        
        const verifiedQuoteIds = [];
        oldAccountVerifiedQuotes.forEach((quote, index) => {
            console.log(`${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
            console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
            console.log(`   Status: ${quote.user_response_status || 'N/A'} | Payment: ${quote.payment_status || 'N/A'}`);
            console.log(`   Customer: ${quote.customer_name}`);
            if (quote.accepted_at) {
                console.log(`   ✅ Accepted: ${new Date(quote.accepted_at).toLocaleString()}`);
            }
            if (quote.verification_date) {
                console.log(`   ✅ Verified: ${new Date(quote.verification_date).toLocaleString()}`);
            }
            console.log('');
            verifiedQuoteIds.push(quote.id);
        });
        
        console.log('\n📋 Step 2: Check if these quotes are visible to new account');
        console.log('-'.repeat(50));
        
        // Check if any of these verified quotes are still visible to new account
        if (verifiedQuoteIds.length > 0) {
            const placeholders = verifiedQuoteIds.map(() => '?').join(',');
            
            const [visibleToNewAccount] = await db.execute(`
                SELECT q.id, q.product_description, q.departure_country, q.arrival_country,
                       q.status, COALESCE(u.name, q.contact_name) as user_name
                FROM quotes q 
                LEFT JOIN users u ON q.user_id = u.id 
                WHERE q.id IN (${placeholders})
                AND q.status IN ('pending', 'approved')
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
            `, [...verifiedQuoteIds, newAccountId, newAccountId]);
            
            if (visibleToNewAccount.length > 0) {
                console.log(`⚠️  ISSUE CONFIRMED! ${visibleToNewAccount.length} verified quotes are still visible to new account:`);
                
                visibleToNewAccount.forEach((quote, index) => {
                    console.log(`${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                    console.log(`   Route: ${quote.departure_country} → ${quote.arrival_country}`);
                    console.log(`   Status: ${quote.status} | Customer: ${quote.user_name}`);
                });
                
                console.log('\n🔍 Step 3: Detailed Analysis of Problematic Quotes');
                console.log('-'.repeat(50));
                
                // Analyze each problematic quote
                for (const quote of visibleToNewAccount) {
                    console.log(`\n🔍 Analyzing Quote ${quote.id}:`);
                    
                    // Check user_quote_status for this quote
                    const [userStatus] = await db.execute(`
                        SELECT uqs.*, qr.company_id, c.name as company_name
                        FROM user_quote_status uqs
                        JOIN quote_responses qr ON uqs.quote_response_id = qr.id
                        LEFT JOIN users c ON qr.company_id = c.id
                        WHERE uqs.quote_id = ?
                    `, [quote.id]);
                    
                    console.log(`   User Status Records: ${userStatus.length}`);
                    userStatus.forEach(status => {
                        console.log(`     - Company: ${status.company_name} (ID: ${status.company_id})`);
                        console.log(`     - Status: ${status.status}`);
                        console.log(`     - Accepted: ${status.accepted_at}`);
                        console.log(`     - Payment Proof ID: ${status.payment_proof_id}`);
                    });
                    
                    // Check payment proofs for this quote
                    const [paymentProofs] = await db.execute(`
                        SELECT pp.id, pp.company_id, pp.file_path, 
                               pv.verification_status, pv.verification_date,
                               c.name as company_name
                        FROM user_quote_status uqs
                        JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                        LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                        LEFT JOIN users c ON pp.company_id = c.id
                        WHERE uqs.quote_id = ?
                    `, [quote.id]);
                    
                    console.log(`   Payment Proofs: ${paymentProofs.length}`);
                    paymentProofs.forEach(proof => {
                        console.log(`     - Company: ${proof.company_name} (ID: ${proof.company_id})`);
                        console.log(`     - Proof ID: ${proof.id}`);
                        console.log(`     - Status: ${proof.verification_status || 'pending'}`);
                        console.log(`     - Verified Date: ${proof.verification_date || 'N/A'}`);
                    });
                    
                    // Check why the NOT EXISTS clauses are not working
                    console.log('\n   🔍 Testing NOT EXISTS clauses:');
                    
                    // Test clause 1: accepted status
                    const [acceptedCheck] = await db.execute(
                        'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                        [quote.id]
                    );
                    console.log(`     - Accepted status check: ${acceptedCheck[0].count} records`);
                    
                    // Test clause 2: payment proofs
                    const [paymentCheck] = await db.execute(`
                        SELECT COUNT(*) as count FROM user_quote_status uqs2
                        JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                        WHERE uqs2.quote_id = ? AND pp.id IS NOT NULL
                    `, [quote.id]);
                    console.log(`     - Payment proofs check: ${paymentCheck[0].count} records`);
                    
                    // Test clause 3: verified payments
                    const [verifiedCheck] = await db.execute(`
                        SELECT COUNT(*) as count FROM user_quote_status uqs3
                        JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                        JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                        WHERE uqs3.quote_id = ? AND pv.verification_status = 'verified'
                    `, [quote.id]);
                    console.log(`     - Verified payments check: ${verifiedCheck[0].count} records`);
                    
                    // If any of these should be > 0, then the quote should be filtered out
                    const shouldBeFiltered = acceptedCheck[0].count > 0 || paymentCheck[0].count > 0 || verifiedCheck[0].count > 0;
                    console.log(`     - Should be filtered: ${shouldBeFiltered ? 'YES' : 'NO'}`);
                    
                    if (shouldBeFiltered) {
                        console.log(`     ❌ FILTERING LOGIC FAILURE: This quote should NOT be visible!`);
                    }
                }
                
            } else {
                console.log('✅ No verified quotes are visible to new account - system working correctly');
            }
        } else {
            console.log('ℹ️  Old account has no verified quotes to check');
        }
        
        console.log('\n📊 FINAL SUMMARY:');
        console.log('-'.repeat(30));
        console.log(`Old Account Verified Quotes: ${verifiedQuoteIds.length}`);
        console.log(`Problematic Overlaps: ${visibleToNewAccount?.length || 0}`);
        console.log(`Issue Status: ${(visibleToNewAccount?.length || 0) > 0 ? '❌ CONFIRMED' : '✅ No Issues'}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
        console.log('\n🏁 Analysis completed');
    }
};

checkSpecificOverlap();