// Comprehensive check to verify if there's really an overlap issue
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

const comprehensiveCheck = async () => {
    console.log('🔍 COMPREHENSIVE OVERLAP CHECK');
    console.log('=' .repeat(60));
    
    try {
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        const oldAccountId = 10; // aadarshchauhan35@gmail.com
        const newAccountId = 31; // last@gmail.com
        
        // Step 1: Get ALL quotes that old account has worked on (any status)
        console.log('\n📋 Step 1: ALL quotes old account has worked on');
        console.log('-'.repeat(50));
        
        const [oldAccountAllQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.product_description, q.departure_country, q.arrival_country,
                   q.status as quote_status,
                   qr.price, qr.created_at as response_date,
                   uqs.status as user_response_status, uqs.accepted_at,
                   pv.verification_status as payment_status, pv.verification_date,
                   pp.id as payment_proof_id,
                   u.name as customer_name
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [oldAccountId]);
        
        console.log(`Total quotes old account has responded to: ${oldAccountAllQuotes.length}`);
        
        // Categorize quotes
        const acceptedQuotes = oldAccountAllQuotes.filter(q => q.user_response_status === 'accepted');
        const verifiedQuotes = oldAccountAllQuotes.filter(q => q.payment_status === 'verified');
        const withPaymentProof = oldAccountAllQuotes.filter(q => q.payment_proof_id !== null);
        
        console.log(`  - Accepted by users: ${acceptedQuotes.length}`);
        console.log(`  - Payment verified: ${verifiedQuotes.length}`);
        console.log(`  - Has payment proof: ${withPaymentProof.length}`);
        
        // Step 2: Get ALL quotes visible to new account
        console.log('\n📋 Step 2: ALL quotes visible to new account');
        console.log('-'.repeat(50));
        
        const [newAccountAllVisible] = await db.execute(`
            SELECT q.id, q.product_description, q.departure_country, q.arrival_country,
                   q.status, q.created_at,
                   COALESCE(u.name, q.contact_name) as user_name
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status IN ('pending', 'approved')
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            ORDER BY q.created_at DESC
        `, [newAccountId, newAccountId]);
        
        console.log(`Total quotes visible to new account (before filtering): ${newAccountAllVisible.length}`);
        
        // Step 3: Check for direct overlaps
        console.log('\n📋 Step 3: Direct overlap check');
        console.log('-'.repeat(50));
        
        const oldQuoteIds = oldAccountAllQuotes.map(q => q.id);
        const newVisibleIds = newAccountAllVisible.map(q => q.id);
        
        const directOverlaps = oldQuoteIds.filter(id => newVisibleIds.includes(id));
        
        console.log(`Old account quote IDs: [${oldQuoteIds.slice(0, 10).join(', ')}${oldQuoteIds.length > 10 ? '...' : ''}]`);
        console.log(`New account visible IDs: [${newVisibleIds.slice(0, 10).join(', ')}${newVisibleIds.length > 10 ? '...' : ''}]`);
        console.log(`Direct overlaps: ${directOverlaps.length} quotes`);
        
        if (directOverlaps.length > 0) {
            console.log(`\n⚠️  DIRECT OVERLAP DETECTED! Quote IDs: [${directOverlaps.join(', ')}]`);
            
            // Analyze each overlapping quote
            for (const quoteId of directOverlaps.slice(0, 5)) { // Check first 5
                console.log(`\n🔍 Analyzing overlapping Quote ${quoteId}:`);
                
                const oldQuote = oldAccountAllQuotes.find(q => q.id === quoteId);
                const newQuote = newAccountAllVisible.find(q => q.id === quoteId);
                
                console.log(`   Old account sees: ${oldQuote.product_description} (Status: ${oldQuote.user_response_status || 'N/A'})`);
                console.log(`   New account sees: ${newQuote.product_description} (Status: ${newQuote.status})`);
                
                // Check why this quote is still visible
                console.log(`   Analysis:`);
                console.log(`     - User accepted: ${oldQuote.user_response_status === 'accepted' ? 'YES' : 'NO'}`);
                console.log(`     - Payment verified: ${oldQuote.payment_status === 'verified' ? 'YES' : 'NO'}`);
                console.log(`     - Has payment proof: ${oldQuote.payment_proof_id ? 'YES' : 'NO'}`);
                
                // This quote should be filtered if any of the above is YES
                const shouldBeFiltered = oldQuote.user_response_status === 'accepted' || 
                                       oldQuote.payment_status === 'verified' || 
                                       oldQuote.payment_proof_id !== null;
                
                console.log(`     - Should be filtered: ${shouldBeFiltered ? 'YES ❌' : 'NO ✅'}`);
            }
        } else {
            console.log('✅ No direct overlaps found');
        }
        
        // Step 4: Check specifically accepted/verified quotes
        console.log('\n📋 Step 4: Check accepted/verified quotes specifically');
        console.log('-'.repeat(50));
        
        const criticalQuoteIds = [
            ...acceptedQuotes.map(q => q.id),
            ...verifiedQuotes.map(q => q.id),
            ...withPaymentProof.map(q => q.id)
        ];
        
        const uniqueCriticalIds = [...new Set(criticalQuoteIds)];
        console.log(`Critical quotes that should be filtered: ${uniqueCriticalIds.length}`);
        console.log(`Critical quote IDs: [${uniqueCriticalIds.slice(0, 10).join(', ')}${uniqueCriticalIds.length > 10 ? '...' : ''}]`);
        
        const criticalOverlaps = uniqueCriticalIds.filter(id => newVisibleIds.includes(id));
        
        if (criticalOverlaps.length > 0) {
            console.log(`\n❌ CRITICAL ISSUE! ${criticalOverlaps.length} accepted/verified quotes are still visible:`);
            console.log(`Problematic IDs: [${criticalOverlaps.join(', ')}]`);
            
            // Test the filtering query manually for these quotes
            console.log('\n🔍 Testing filtering logic for problematic quotes:');
            
            for (const quoteId of criticalOverlaps.slice(0, 3)) {
                console.log(`\nQuote ${quoteId}:`);
                
                // Test each NOT EXISTS clause
                const [test1] = await db.execute(
                    'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                    [quoteId]
                );
                console.log(`  NOT EXISTS test 1 (accepted): ${test1[0].count} records found`);
                
                const [test2] = await db.execute(`
                    SELECT COUNT(*) as count FROM user_quote_status uqs2
                    JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                    WHERE uqs2.quote_id = ? AND pp.id IS NOT NULL
                `, [quoteId]);
                console.log(`  NOT EXISTS test 2 (payment proofs): ${test2[0].count} records found`);
                
                const [test3] = await db.execute(`
                    SELECT COUNT(*) as count FROM user_quote_status uqs3
                    JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                    JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                    WHERE uqs3.quote_id = ? AND pv.verification_status = 'verified'
                `, [quoteId]);
                console.log(`  NOT EXISTS test 3 (verified payments): ${test3[0].count} records found`);
                
                const shouldBeFiltered = test1[0].count > 0 || test2[0].count > 0 || test3[0].count > 0;
                console.log(`  Should be filtered: ${shouldBeFiltered ? 'YES ❌' : 'NO ✅'}`);
            }
        } else {
            console.log('✅ No critical overlaps - filtering is working correctly');
        }
        
        // Step 5: Final summary
        console.log('\n📊 FINAL COMPREHENSIVE SUMMARY:');
        console.log('=' .repeat(50));
        console.log(`Old Account Total Quotes: ${oldAccountAllQuotes.length}`);
        console.log(`  - Accepted: ${acceptedQuotes.length}`);
        console.log(`  - Verified: ${verifiedQuotes.length}`);
        console.log(`  - With Payment Proof: ${withPaymentProof.length}`);
        console.log(`New Account Visible Quotes: ${newAccountAllVisible.length}`);
        console.log(`Direct Overlaps: ${directOverlaps.length}`);
        console.log(`Critical Overlaps: ${criticalOverlaps?.length || 0}`);
        
        const hasIssue = (directOverlaps.length > 0) || (criticalOverlaps?.length > 0);
        console.log(`\n🎯 ISSUE STATUS: ${hasIssue ? '❌ CONFIRMED - There is an overlap issue!' : '✅ NO ISSUES - System working correctly'}`);
        
        if (hasIssue) {
            console.log('\n🔧 RECOMMENDED ACTIONS:');
            console.log('1. Check the NOT EXISTS clauses in getAvailableQuotes function');
            console.log('2. Verify user_quote_status table relationships');
            console.log('3. Check payment_proofs and payment_verifications table data');
            console.log('4. Review the quote filtering logic implementation');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
        console.log('\n🏁 Comprehensive check completed');
    }
};

comprehensiveCheck();