// Debug script to identify the JOIN issue
import db from './config/db.js';

async function debugJoinIssue() {
    console.log('🔍 Debugging JOIN issue in admin query...\n');
    
    try {
        // Test 1: Get quotes with accepted responses directly
        console.log('📊 Test 1: Direct query for quotes with accepted responses...');
        const [directQuery] = await db.execute(`
            SELECT DISTINCT
                q.id as quote_id,
                q.product_description,
                u.name as customer_name,
                c.name as company_name,
                c.email as company_email,
                qr.price,
                uqs.status,
                uqs.accepted_at
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN users c ON qr.company_id = c.id
            JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE uqs.status = 'accepted'
            ORDER BY q.id DESC
            LIMIT 10
        `);
        
        console.log(`✅ Found ${directQuery.length} quotes with accepted responses:`);
        directQuery.forEach((row, index) => {
            console.log(`  ${index + 1}. Quote ${row.quote_id}: ${row.company_name} (${row.company_email}) - $${row.price}`);
        });
        
        // Test 2: Check the subquery separately
        console.log('\n📊 Test 2: Testing the working_company subquery...');
        const [subquery] = await db.execute(`
            SELECT 
                qr2.quote_id,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone,
                qr2.price,
                qr2.transit_time,
                uqs2.accepted_at,
                pv.verification_status as payment_status,
                pp.file_path as payment_proof_url,
                pv.verification_date,
                pv.company_notes as payment_company_notes,
                CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof
            FROM quote_responses qr2
            JOIN users c ON qr2.company_id = c.id
            LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE uqs2.status = 'accepted'
            ORDER BY qr2.quote_id DESC
        `);
        
        console.log(`✅ Subquery found ${subquery.length} working companies:`);
        subquery.forEach((row, index) => {
            console.log(`  ${index + 1}. Quote ${row.quote_id}: ${row.company_name} (${row.company_email}) - $${row.price}`);
        });
        
        // Test 3: Test the full query but simplified
        console.log('\n📊 Test 3: Testing simplified full query...');
        const [simplifiedQuery] = await db.execute(`
            SELECT 
                q.id,
                q.product_description,
                u.name as user_name,
                u.email as user_email,
                q.status,
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
            ORDER BY q.created_at DESC
            LIMIT 10
        `);
        
        console.log(`✅ Simplified query found ${simplifiedQuery.length} quotes:`);
        simplifiedQuery.forEach((row, index) => {
            console.log(`  ${index + 1}. Quote ${row.id}: Customer ${row.user_name}, Company: ${row.company_name || 'NO COMPANY'} - $${row.accepted_price || '0.00'}`);
        });
        
        // Test 4: Check if the issue is with the GROUP BY
        console.log('\n📊 Test 4: Testing query without GROUP BY...');
        const [noGroupBy] = await db.execute(`
            SELECT 
                q.id,
                q.product_description,
                u.name as user_name,
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
            LIMIT 5
        `);
        
        console.log(`✅ Query without GROUP BY (only quotes with companies): ${noGroupBy.length}`);
        noGroupBy.forEach((row, index) => {
            console.log(`  ${index + 1}. Quote ${row.id}: ${row.user_name} -> ${row.company_name} - $${row.accepted_price}`);
        });
        
        // Test 5: Check what happens when we add the COUNT and GROUP BY
        console.log('\n📊 Test 5: Testing with COUNT and GROUP BY...');
        const [withGroupBy] = await db.execute(`
            SELECT 
                q.id,
                q.product_description,
                u.name as user_name,
                COUNT(DISTINCT qr.id) as response_count,
                COUNT(DISTINCT CASE WHEN uqs.status = 'accepted' THEN qr.id END) as accepted_count,
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
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
            GROUP BY q.id, working_company.company_name, working_company.company_email, working_company.price
            HAVING working_company.company_name IS NOT NULL
            ORDER BY q.created_at DESC
            LIMIT 5
        `);
        
        console.log(`✅ Query with GROUP BY (only quotes with companies): ${withGroupBy.length}`);
        withGroupBy.forEach((row, index) => {
            console.log(`  ${index + 1}. Quote ${row.id}: ${row.user_name} -> ${row.company_name} (${row.response_count} responses, ${row.accepted_count} accepted) - $${row.accepted_price}`);
        });
        
        console.log('\n🔍 Analysis:');
        if (directQuery.length > 0 && simplifiedQuery.filter(q => q.company_name).length === 0) {
            console.log('❌ Issue: The LEFT JOIN with subquery is not working correctly');
            console.log('💡 The subquery might not be matching properly with the main query');
        } else if (simplifiedQuery.filter(q => q.company_name).length > 0) {
            console.log('✅ The JOIN is working, issue might be elsewhere');
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        process.exit(0);
    }
}

debugJoinIssue();