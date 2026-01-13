// Direct database check for the test accounts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Direct database connection with credentials
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const checkTestAccounts = async () => {
    console.log('🔍 Direct Database Check for Test Accounts');
    console.log('=' .repeat(60));
    
    try {
        // Test connection
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Check both test accounts
        const testEmails = ['aadarshchauhan35@gmail.com', 'last@gmail.com'];
        
        console.log('\n📋 Account Information:');
        console.log('-'.repeat(40));
        
        for (const email of testEmails) {
            const [users] = await db.execute(
                'SELECT id, name, email, role, country, created_at FROM users WHERE email = ?',
                [email]
            );
            
            if (users.length > 0) {
                const user = users[0];
                console.log(`\n✅ ${email}:`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Country: ${user.country}`);
                console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
                
                // If it's a company, check their quotes
                if (user.role === 'company') {
                    // Check active quotes (My Quotes logic)
                    const [activeQuotes] = await db.execute(`
                        SELECT q.id, q.product_description, q.departure_country, q.arrival_country,
                               qr.price, uqs.status as user_response_status, 
                               pv.verification_status as payment_status,
                               u.name as customer_name
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
                        LIMIT 10
                    `, [user.id]);
                    
                    console.log(`   Active Quotes: ${activeQuotes.length}`);
                    
                    if (activeQuotes.length > 0) {
                        console.log('   📋 Active Quotes Details:');
                        activeQuotes.forEach((quote, index) => {
                            console.log(`     ${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                            console.log(`        Route: ${quote.departure_country} → ${quote.arrival_country}`);
                            console.log(`        Price: $${quote.price}`);
                            console.log(`        Status: ${quote.user_response_status || 'N/A'} | Payment: ${quote.payment_status || 'N/A'}`);
                            console.log(`        Customer: ${quote.customer_name}`);
                        });
                    }
                    
                    // Check available quotes
                    const [availableQuotes] = await db.execute(`
                        SELECT q.id, q.product_description, q.departure_country, q.arrival_country,
                               q.status, COALESCE(u.name, q.contact_name) as user_name
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
                    `, [user.id, user.id]);
                    
                    console.log(`   Available Quotes: ${availableQuotes.length}`);
                    
                    if (availableQuotes.length > 0) {
                        console.log('   📋 Available Quotes Details:');
                        availableQuotes.slice(0, 3).forEach((quote, index) => {
                            console.log(`     ${index + 1}. Quote ${quote.id}: ${quote.product_description}`);
                            console.log(`        Route: ${quote.departure_country} → ${quote.arrival_country}`);
                            console.log(`        Status: ${quote.status} | Customer: ${quote.user_name}`);
                        });
                    }
                }
            } else {
                console.log(`\n❌ ${email}: Not found`);
            }
        }
        
        // Cross-reference analysis
        console.log('\n🔍 Cross-Reference Analysis:');
        console.log('-'.repeat(40));
        
        // Get both companies
        const [oldAccount] = await db.execute(
            'SELECT id, name FROM users WHERE email = ? AND role = "company"',
            ['aadarshchauhan35@gmail.com']
        );
        
        const [newAccount] = await db.execute(
            'SELECT id, name FROM users WHERE email = ? AND role = "company"',
            ['last@gmail.com']
        );
        
        if (oldAccount.length > 0 && newAccount.length > 0) {
            const oldCompany = oldAccount[0];
            const newCompany = newAccount[0];
            
            // Get active quote IDs for old company
            const [oldActiveQuotes] = await db.execute(`
                SELECT DISTINCT q.id
                FROM quote_responses qr
                JOIN quotes q ON qr.quote_id = q.id
                LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
                LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE qr.company_id = ?
                AND (
                    uqs.status = 'accepted' 
                    OR pv.verification_status = 'verified'
                    OR pp.id IS NOT NULL
                )
            `, [oldCompany.id]);
            
            // Get available quote IDs for new company
            const [newAvailableQuotes] = await db.execute(`
                SELECT q.id
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
            `, [newCompany.id, newCompany.id]);
            
            const oldQuoteIds = oldActiveQuotes.map(q => q.id);
            const newQuoteIds = newAvailableQuotes.map(q => q.id);
            
            console.log(`\n${oldCompany.name} Active Quote IDs: [${oldQuoteIds.join(', ')}]`);
            console.log(`${newCompany.name} Available Quote IDs: [${newQuoteIds.join(', ')}]`);
            
            const overlappingQuotes = oldQuoteIds.filter(id => newQuoteIds.includes(id));
            
            if (overlappingQuotes.length > 0) {
                console.log(`\n⚠️  ISSUE DETECTED!`);
                console.log(`❌ ${overlappingQuotes.length} quotes verified by ${oldCompany.name} are still visible to ${newCompany.name}:`);
                console.log(`Problematic Quote IDs: [${overlappingQuotes.join(', ')}]`);
                
                // Analyze each problematic quote
                for (const quoteId of overlappingQuotes) {
                    console.log(`\n🔍 Analyzing Quote ${quoteId}:`);
                    
                    const [quoteDetails] = await db.execute(
                        'SELECT id, status, product_description FROM quotes WHERE id = ?',
                        [quoteId]
                    );
                    
                    if (quoteDetails.length > 0) {
                        console.log(`   Product: ${quoteDetails[0].product_description}`);
                        console.log(`   Status: ${quoteDetails[0].status}`);
                    }
                    
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
                console.log(`No verified quotes from ${oldCompany.name} are visible to ${newCompany.name}`);
            }
            
            // Summary
            console.log('\n📊 SUMMARY:');
            console.log('-'.repeat(30));
            console.log(`${oldCompany.name} Active Quotes: ${oldQuoteIds.length}`);
            console.log(`${newCompany.name} Available Quotes: ${newQuoteIds.length}`);
            console.log(`Overlapping Quotes: ${overlappingQuotes.length}`);
            console.log(`System Status: ${overlappingQuotes.length === 0 ? '✅ Working Correctly' : '❌ Issue Detected'}`);
        } else {
            console.log('❌ Could not find both company accounts for cross-reference analysis');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
        console.log('\n🏁 Check completed');
    }
};

checkTestAccounts();