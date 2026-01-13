// Test script to verify the quote filtering fix
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const testFilteringFix = async () => {
    console.log('🔧 Testing Quote Filtering Fix');
    console.log('=' .repeat(60));
    
    try {
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        const oldAccountId = 10; // aadarshchauhan35@gmail.com
        const newAccountId = 31; // last@gmail.com
        
        console.log('\n📋 Step 1: Test NEW filtering logic for new account');
        console.log('-'.repeat(50));
        
        // Get company location for new account
        const [companyLocation] = await db.execute(
            'SELECT country FROM users WHERE id = ?',
            [newAccountId]
        );
        
        const country = companyLocation[0]?.country || '';
        
        let locationFilter = '';
        let locationParams = [];
        
        if (country) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [country, country];
        }

        // Use the NEW FIXED filtering logic
        const fixedQuotesSql = `
            SELECT q.id, q.product_description, q.departure_country, q.arrival_country,
                   q.status, COALESCE(u.name, q.contact_name) as user_name,
                   CASE 
                       WHEN (q.departure_country = ? AND q.arrival_country = ?) THEN 5
                       WHEN (q.departure_country = ? OR q.arrival_country = ?) THEN 4
                       ELSE 1
                   END as location_priority
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status IN ('pending', 'approved')
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            AND q.id NOT IN (
                SELECT DISTINCT uqs.quote_id 
                FROM user_quote_status uqs 
                WHERE uqs.status = 'accepted'
            )
            AND q.id NOT IN (
                SELECT DISTINCT uqs2.quote_id
                FROM user_quote_status uqs2
                INNER JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                WHERE pp.id IS NOT NULL
            )
            AND q.id NOT IN (
                SELECT DISTINCT uqs3.quote_id
                FROM user_quote_status uqs3
                INNER JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                INNER JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                WHERE pv.verification_status = 'verified'
            )
            ${locationFilter}
            ORDER BY location_priority DESC, q.created_at DESC
        `;

        const finalParams = [
            country || '', country || '', // both departure and arrival same country
            country || '', country || '', // either departure or arrival same country
            newAccountId, newAccountId, // user exclusion and response check
            ...locationParams
        ];

        const [fixedQuotes] = await db.execute(fixedQuotesSql, finalParams);
        
        console.log(`📊 NEW FILTERING: Found ${fixedQuotes.length} available quotes for new account`);
        console.log(`📋 Quote IDs: [${fixedQuotes.map(q => q.id).join(', ')}]`);
        
        // Step 2: Get old account's verified quotes
        console.log('\n📋 Step 2: Get old account verified quotes');
        console.log('-'.repeat(50));
        
        const [oldAccountVerified] = await db.execute(`
            SELECT DISTINCT q.id
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE qr.company_id = ?
            AND (
                uqs.status = 'accepted' 
                OR pv.verification_status = 'verified'
                OR pp.id IS NOT NULL
            )
        `, [oldAccountId]);
        
        const oldVerifiedIds = oldAccountVerified.map(q => q.id);
        console.log(`📊 Old account verified quotes: ${oldVerifiedIds.length}`);
        console.log(`📋 Verified Quote IDs: [${oldVerifiedIds.join(', ')}]`);
        
        // Step 3: Check for overlaps
        console.log('\n📋 Step 3: Check for overlaps with FIXED filtering');
        console.log('-'.repeat(50));
        
        const newVisibleIds = fixedQuotes.map(q => q.id);
        const overlaps = oldVerifiedIds.filter(id => newVisibleIds.includes(id));
        
        if (overlaps.length > 0) {
            console.log(`❌ STILL HAVE OVERLAPS: ${overlaps.length} quotes`);
            console.log(`Problematic IDs: [${overlaps.join(', ')}]`);
            
            // Analyze why these are still showing
            for (const quoteId of overlaps.slice(0, 3)) {
                console.log(`\n🔍 Analyzing Quote ${quoteId}:`);
                
                // Check each filtering condition
                const [acceptedTest] = await db.execute(
                    'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                    [quoteId]
                );
                
                const [paymentTest] = await db.execute(`
                    SELECT COUNT(*) as count FROM user_quote_status uqs2
                    INNER JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                    WHERE uqs2.quote_id = ? AND pp.id IS NOT NULL
                `, [quoteId]);
                
                const [verifiedTest] = await db.execute(`
                    SELECT COUNT(*) as count FROM user_quote_status uqs3
                    INNER JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                    INNER JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                    WHERE uqs3.quote_id = ? AND pv.verification_status = 'verified'
                `, [quoteId]);
                
                console.log(`   Accepted: ${acceptedTest[0].count}`);
                console.log(`   Payment Proofs: ${paymentTest[0].count}`);
                console.log(`   Verified: ${verifiedTest[0].count}`);
                
                const shouldBeFiltered = acceptedTest[0].count > 0 || paymentTest[0].count > 0 || verifiedTest[0].count > 0;
                console.log(`   Should be filtered: ${shouldBeFiltered ? 'YES ❌' : 'NO ✅'}`);
            }
        } else {
            console.log(`✅ SUCCESS! No overlaps found with new filtering logic`);
        }
        
        // Step 4: Compare old vs new filtering
        console.log('\n📋 Step 4: Compare OLD vs NEW filtering results');
        console.log('-'.repeat(50));
        
        // Get old filtering results for comparison
        const oldQuotesSql = `
            SELECT q.id
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
        `;

        const [oldQuotes] = await db.execute(oldQuotesSql, [newAccountId, newAccountId, ...locationParams]);
        const oldVisibleIds = oldQuotes.map(q => q.id);
        
        console.log(`📊 OLD filtering: ${oldVisibleIds.length} quotes`);
        console.log(`📊 NEW filtering: ${newVisibleIds.length} quotes`);
        console.log(`📊 Difference: ${oldVisibleIds.length - newVisibleIds.length} quotes filtered out`);
        
        const filteredOut = oldVisibleIds.filter(id => !newVisibleIds.includes(id));
        if (filteredOut.length > 0) {
            console.log(`📋 Quotes filtered out by new logic: [${filteredOut.join(', ')}]`);
        }
        
        // Final summary
        console.log('\n📊 FINAL TEST RESULTS:');
        console.log('=' .repeat(50));
        console.log(`Old Account Verified Quotes: ${oldVerifiedIds.length}`);
        console.log(`New Account Visible (OLD logic): ${oldVisibleIds.length}`);
        console.log(`New Account Visible (NEW logic): ${newVisibleIds.length}`);
        console.log(`Overlaps with NEW logic: ${overlaps.length}`);
        console.log(`Fix Status: ${overlaps.length === 0 ? '✅ SUCCESS - Fix works!' : '❌ FAILED - Still has overlaps'}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
        console.log('\n🏁 Test completed');
    }
};

testFilteringFix();