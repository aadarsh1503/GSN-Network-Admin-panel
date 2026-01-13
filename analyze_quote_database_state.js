// Comprehensive Database Analysis for Quote Visibility Issues
// This script analyzes the database state to identify potential issues with quote filtering

import db from './server/config/db.js';

const ANALYSIS_QUERIES = {
    // Get all quotes with their current status and related data
    quotesOverview: `
        SELECT 
            q.id,
            q.status as quote_status,
            q.product_description,
            q.departure_country,
            q.arrival_country,
            q.user_id,
            q.created_at,
            u.name as customer_name,
            u.email as customer_email,
            -- Count responses
            (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id) as response_count,
            -- Count accepted responses
            (SELECT COUNT(*) FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count,
            -- Count payment proofs
            (SELECT COUNT(*) FROM user_quote_status uqs2 
             JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id 
             WHERE uqs2.quote_id = q.id) as payment_proof_count,
            -- Count verified payments
            (SELECT COUNT(*) FROM user_quote_status uqs3
             JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
             JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
             WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified') as verified_count
        FROM quotes q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.status IN ('pending', 'approved')
        ORDER BY q.created_at DESC
        LIMIT 50
    `,
    
    // Get quotes that should be hidden from available quotes
    quotesToBeHidden: `
        SELECT DISTINCT
            q.id,
            q.status,
            q.product_description,
            'accepted_response' as reason
        FROM quotes q
        WHERE EXISTS (
            SELECT 1 FROM user_quote_status uqs 
            WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
        )
        
        UNION
        
        SELECT DISTINCT
            q.id,
            q.status,
            q.product_description,
            'has_payment_proof' as reason
        FROM quotes q
        WHERE EXISTS (
            SELECT 1 FROM user_quote_status uqs2
            JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
            WHERE uqs2.quote_id = q.id AND pp.id IS NOT NULL
        )
        
        UNION
        
        SELECT DISTINCT
            q.id,
            q.status,
            q.product_description,
            'verified_payment' as reason
        FROM quotes q
        WHERE EXISTS (
            SELECT 1 FROM user_quote_status uqs3
            JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
            JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
            WHERE uqs3.quote_id = q.id AND pv.verification_status = 'verified'
        )
        
        ORDER BY id DESC
    `,
    
    // Get company responses with payment status
    companyResponses: `
        SELECT 
            qr.id as response_id,
            qr.quote_id,
            qr.company_id,
            qr.price,
            qr.created_at as response_date,
            c.name as company_name,
            c.email as company_email,
            uqs.status as user_response_status,
            uqs.accepted_at,
            pp.id as payment_proof_id,
            pv.verification_status as payment_status,
            pv.verification_date
        FROM quote_responses qr
        JOIN users c ON qr.company_id = c.id
        LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
        LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
        LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
        WHERE (
            uqs.status = 'accepted' 
            OR pv.verification_status = 'verified'
            OR pp.id IS NOT NULL
        )
        ORDER BY qr.created_at DESC
        LIMIT 30
    `,
    
    // Get specific test accounts info
    testAccounts: `
        SELECT 
            id,
            name,
            email,
            role,
            country,
            created_at
        FROM users 
        WHERE email IN ('aadarshchauhan35@gmail.com', 'last@gmail.com')
    `,
    
    // Get data integrity issues
    dataIntegrityCheck: `
        SELECT 
            'orphaned_user_quote_status' as issue_type,
            COUNT(*) as count
        FROM user_quote_status uqs
        LEFT JOIN quotes q ON uqs.quote_id = q.id
        WHERE q.id IS NULL
        
        UNION ALL
        
        SELECT 
            'orphaned_payment_proofs' as issue_type,
            COUNT(*) as count
        FROM payment_proofs pp
        LEFT JOIN user_quote_status uqs ON pp.id = uqs.payment_proof_id
        WHERE uqs.id IS NULL
        
        UNION ALL
        
        SELECT 
            'orphaned_payment_verifications' as issue_type,
            COUNT(*) as count
        FROM payment_verifications pv
        LEFT JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
        WHERE pp.id IS NULL
    `
};

// Function to run a query and display results
const runAnalysisQuery = async (queryName, sql, description) => {
    console.log(`\n🔍 ${description}`);
    console.log('-'.repeat(60));
    
    try {
        const [results] = await db.execute(sql);
        
        if (results.length === 0) {
            console.log('   ℹ️  No results found');
            return results;
        }
        
        console.log(`   📊 Found ${results.length} records`);
        
        // Display first few results
        const displayCount = Math.min(results.length, 5);
        for (let i = 0; i < displayCount; i++) {
            const record = results[i];
            console.log(`\n   ${i + 1}. Record:`, record);
        }
        
        if (results.length > displayCount) {
            console.log(`   ... and ${results.length - displayCount} more records`);
        }
        
        return results;
        
    } catch (error) {
        console.error(`   ❌ Error running ${queryName}:`, error.message);
        return [];
    }
};

// Function to analyze specific quote visibility for test accounts
const analyzeTestAccountVisibility = async (testAccounts) => {
    console.log(`\n🔍 Analyzing Quote Visibility for Test Accounts`);
    console.log('-'.repeat(60));
    
    for (const account of testAccounts) {
        console.log(`\n👤 Account: ${account.name} (${account.email})`);
        console.log(`   ID: ${account.id}, Role: ${account.role}, Country: ${account.country}`);
        
        if (account.role === 'company') {
            // Get quotes this company has responded to and been accepted/verified
            const [companyQuotes] = await db.execute(`
                SELECT DISTINCT
                    q.id as quote_id,
                    q.product_description,
                    q.status as quote_status,
                    qr.price,
                    uqs.status as user_response_status,
                    uqs.accepted_at,
                    pv.verification_status as payment_status,
                    pv.verification_date
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
                ORDER BY qr.created_at DESC
            `, [account.id]);
            
            console.log(`   📋 Verified/Approved Quotes: ${companyQuotes.length}`);
            companyQuotes.slice(0, 3).forEach((quote, index) => {
                console.log(`     ${index + 1}. Quote ${quote.quote_id}: ${quote.user_response_status || 'N/A'} | Payment: ${quote.payment_status || 'N/A'}`);
            });
            
            // Check what quotes this company can see as available
            const [availableQuotes] = await db.execute(`
                SELECT q.id, q.product_description, q.status
                FROM quotes q 
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
            `, [account.id, account.id]);
            
            console.log(`   📋 Available Quotes: ${availableQuotes.length}`);
            
            // Check for overlaps
            const verifiedQuoteIds = companyQuotes.map(q => q.quote_id);
            const availableQuoteIds = availableQuotes.map(q => q.id);
            const overlaps = verifiedQuoteIds.filter(id => availableQuoteIds.includes(id));
            
            if (overlaps.length > 0) {
                console.log(`   ⚠️  ISSUE: ${overlaps.length} verified quotes still visible as available: [${overlaps.join(', ')}]`);
            } else {
                console.log(`   ✅ No visibility issues detected for this account`);
            }
        }
    }
};

// Function to check for common database issues
const checkDatabaseIssues = async () => {
    console.log(`\n🔍 Checking for Common Database Issues`);
    console.log('-'.repeat(60));
    
    // Check for quotes with accepted status but still showing as available
    const [problematicQuotes] = await db.execute(`
        SELECT 
            q.id,
            q.status,
            q.product_description,
            COUNT(uqs.id) as accepted_responses,
            COUNT(pp.id) as payment_proofs,
            COUNT(pv.id) as verified_payments
        FROM quotes q
        LEFT JOIN user_quote_status uqs ON q.id = uqs.quote_id AND uqs.status = 'accepted'
        LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
        LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id AND pv.verification_status = 'verified'
        WHERE q.status IN ('pending', 'approved')
        GROUP BY q.id, q.status, q.product_description
        HAVING accepted_responses > 0 OR payment_proofs > 0 OR verified_payments > 0
        ORDER BY q.id DESC
        LIMIT 10
    `);
    
    console.log(`\n📊 Quotes that should be filtered but might still be visible: ${problematicQuotes.length}`);
    problematicQuotes.forEach((quote, index) => {
        console.log(`   ${index + 1}. Quote ${quote.id}: Accepted=${quote.accepted_responses}, Payments=${quote.payment_proofs}, Verified=${quote.verified_payments}`);
    });
    
    // Check for inconsistent data
    const [inconsistentData] = await db.execute(`
        SELECT 
            'user_quote_status_without_response' as issue,
            COUNT(*) as count
        FROM user_quote_status uqs
        LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
        WHERE qr.id IS NULL
        
        UNION ALL
        
        SELECT 
            'payment_proof_without_user_status' as issue,
            COUNT(*) as count
        FROM payment_proofs pp
        LEFT JOIN user_quote_status uqs ON pp.id = uqs.payment_proof_id
        WHERE uqs.id IS NULL
    `);
    
    console.log(`\n📊 Data Consistency Issues:`);
    inconsistentData.forEach(issue => {
        console.log(`   ${issue.issue}: ${issue.count} records`);
    });
    
    return { problematicQuotes, inconsistentData };
};

// Main analysis function
const runDatabaseAnalysis = async () => {
    console.log('🚀 Starting Comprehensive Database Analysis for Quote Visibility');
    console.log('=' .repeat(80));
    
    try {
        // Step 1: Get overview of quotes
        const quotesOverview = await runAnalysisQuery(
            'quotesOverview',
            ANALYSIS_QUERIES.quotesOverview,
            'STEP 1: Quotes Overview Analysis'
        );
        
        // Step 2: Get quotes that should be hidden
        const hiddenQuotes = await runAnalysisQuery(
            'quotesToBeHidden',
            ANALYSIS_QUERIES.quotesToBeHidden,
            'STEP 2: Quotes That Should Be Hidden From Available List'
        );
        
        // Step 3: Get company responses with payment status
        const companyResponses = await runAnalysisQuery(
            'companyResponses',
            ANALYSIS_QUERIES.companyResponses,
            'STEP 3: Company Responses with Payment Status'
        );
        
        // Step 4: Get test accounts info
        const testAccounts = await runAnalysisQuery(
            'testAccounts',
            ANALYSIS_QUERIES.testAccounts,
            'STEP 4: Test Accounts Information'
        );
        
        // Step 5: Check data integrity
        const dataIntegrity = await runAnalysisQuery(
            'dataIntegrityCheck',
            ANALYSIS_QUERIES.dataIntegrityCheck,
            'STEP 5: Data Integrity Check'
        );
        
        // Step 6: Analyze test account visibility
        if (testAccounts.length > 0) {
            await analyzeTestAccountVisibility(testAccounts);
        }
        
        // Step 7: Check for database issues
        const issues = await checkDatabaseIssues();
        
        // Step 8: Generate summary report
        console.log(`\n📝 SUMMARY REPORT`);
        console.log('=' .repeat(60));
        
        console.log(`\n📊 Database Statistics:`);
        console.log(`   Total Quotes Analyzed: ${quotesOverview.length}`);
        console.log(`   Quotes That Should Be Hidden: ${hiddenQuotes.length}`);
        console.log(`   Company Responses with Payments: ${companyResponses.length}`);
        console.log(`   Test Accounts Found: ${testAccounts.length}`);
        console.log(`   Problematic Quotes: ${issues.problematicQuotes.length}`);
        
        console.log(`\n🔍 Key Findings:`);
        
        // Analyze hidden quotes by reason
        const hiddenByReason = hiddenQuotes.reduce((acc, quote) => {
            acc[quote.reason] = (acc[quote.reason] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(hiddenByReason).forEach(([reason, count]) => {
            console.log(`   ${reason}: ${count} quotes`);
        });
        
        // Check for potential issues
        if (issues.problematicQuotes.length > 0) {
            console.log(`\n⚠️  POTENTIAL ISSUES DETECTED:`);
            console.log(`   ${issues.problematicQuotes.length} quotes have accepted responses or payments but might still be visible`);
            console.log(`   These quotes should be filtered from the available quotes list`);
        } else {
            console.log(`\n✅ No obvious database issues detected`);
        }
        
        // Recommendations
        console.log(`\n🔧 RECOMMENDATIONS:`);
        console.log(`   1. Run the frontend test to verify actual visibility behavior`);
        console.log(`   2. Check server logs for filtering logic execution`);
        console.log(`   3. Verify the NOT EXISTS clauses in getAvailableQuotes function`);
        console.log(`   4. Consider adding database constraints to prevent inconsistent data`);
        
        if (testAccounts.length === 2) {
            console.log(`   5. Test the specific accounts: ${testAccounts.map(a => a.email).join(', ')}`);
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        console.log('\n🏁 Database analysis completed');
        console.log('=' .repeat(80));
    }
};

// Run the analysis
runDatabaseAnalysis().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});