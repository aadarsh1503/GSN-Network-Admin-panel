// Fix the business user quote status
import db from './config/db.js';

async function fixBusinessQuoteStatus() {
    console.log('🔧 Fixing Business User Quote Status...\n');
    
    try {
        // Update the user_quote_status for quote 64 to 'accepted'
        console.log('📝 Updating user_quote_status for Quote 64...');
        
        const [result] = await db.execute(`
            UPDATE user_quote_status 
            SET status = 'accepted', accepted_at = NOW() 
            WHERE quote_id = 64 AND id = 32
        `);
        
        console.log(`✅ Updated ${result.affectedRows} record(s)`);
        
        // Verify the update
        console.log('\n🔍 Verifying the update...');
        const [verification] = await db.execute(`
            SELECT uqs.id, uqs.quote_id, uqs.quote_response_id, uqs.status, uqs.accepted_at,
                   qr.company_id, c.name as company_name, qr.price
            FROM user_quote_status uqs
            LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE uqs.quote_id = 64
        `);
        
        console.log('Current user_quote_status for Quote 64:');
        verification.forEach((row, index) => {
            console.log(`  ${index + 1}. Status: ${row.status}, Company: ${row.company_name}, Price: $${row.price}, Accepted: ${row.accepted_at ? new Date(row.accepted_at).toLocaleDateString() : 'No'}`);
        });
        
        // Test the admin query now
        console.log('\n🔍 Testing Admin Query after fix...');
        const [adminResult] = await db.execute(`
            SELECT 
                q.id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                q.product_description,
                q.status,
                COALESCE(response_counts.response_count, 0) as response_count,
                COALESCE(response_counts.accepted_count, 0) as accepted_count,
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price,
                working_company.payment_status
                
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN (
                SELECT 
                    qr_count.quote_id,
                    COUNT(DISTINCT qr_count.id) as response_count,
                    COUNT(DISTINCT CASE WHEN uqs_count.status = 'accepted' THEN qr_count.id END) as accepted_count
                FROM quote_responses qr_count
                LEFT JOIN user_quote_status uqs_count ON qr_count.id = uqs_count.quote_response_id
                GROUP BY qr_count.quote_id
            ) response_counts ON q.id = response_counts.quote_id
            LEFT JOIN (
                SELECT 
                    qr2.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    qr2.price,
                    uqs2.accepted_at,
                    pv.verification_status as payment_status
                FROM quote_responses qr2
                JOIN users c ON qr2.company_id = c.id
                LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
                LEFT JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE uqs2.status = 'accepted'
            ) working_company ON q.id = working_company.quote_id
            WHERE q.id = 64
        `);
        
        if (adminResult.length > 0) {
            const result = adminResult[0];
            console.log('✅ Admin Query Result After Fix:');
            console.log(`  Quote ID: ${result.id}`);
            console.log(`  User: ${result.user_name} (${result.user_email}) - Role: ${result.user_role}`);
            console.log(`  Product: ${result.product_description}`);
            console.log(`  Response Count: ${result.response_count}`);
            console.log(`  Accepted Count: ${result.accepted_count}`);
            console.log(`  Company Name: ${result.company_name || 'NULL'}`);
            console.log(`  Company Email: ${result.company_email || 'NULL'}`);
            console.log(`  Accepted Price: $${result.accepted_price || '0.00'}`);
            console.log(`  Payment Status: ${result.payment_status || 'NULL'}`);
            
            if (result.company_name) {
                console.log('\n🎉 SUCCESS! Company data should now appear in admin panel for Quote 64');
            } else {
                console.log('\n❌ Still no company data - need to investigate further');
            }
        }
        
        // Show summary of all quotes that should now have company data
        console.log('\n📊 Summary of quotes with company data:');
        const [allCompanyQuotes] = await db.execute(`
            SELECT 
                q.id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN (
                SELECT 
                    qr2.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    qr2.price
                FROM quote_responses qr2
                JOIN users c ON qr2.company_id = c.id
                LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
                WHERE uqs2.status = 'accepted'
            ) working_company ON q.id = working_company.quote_id
            WHERE working_company.company_name IS NOT NULL
            ORDER BY q.created_at DESC
        `);
        
        console.log(`Found ${allCompanyQuotes.length} quotes with company data:`);
        allCompanyQuotes.forEach((quote, index) => {
            console.log(`  ${index + 1}. Quote ${quote.id}: ${quote.user_name} (${quote.user_role}) -> ${quote.company_name} - $${quote.accepted_price}`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing business quote status:', error);
    } finally {
        process.exit(0);
    }
}

fixBusinessQuoteStatus();