// Test the fixed admin query directly
import db from './config/db.js';

async function testFixedAdminQuery() {
    console.log('🔍 Testing Fixed Admin Query...\n');
    
    try {
        const sql = `
            SELECT 
                q.id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                q.shipping_mode,
                q.departure_country,
                q.departure_city,
                q.arrival_country,
                q.arrival_city,
                q.product_description,
                q.arrival_date,
                q.status,
                q.created_at,
                q.updated_at,
                
                -- Response counts
                COALESCE(response_counts.response_count, 0) as response_count,
                COALESCE(response_counts.accepted_count, 0) as accepted_count,
                
                -- Company working on this quote (accepted response)
                working_company.company_name,
                working_company.company_email,
                working_company.company_phone,
                working_company.price as accepted_price,
                working_company.transit_time as accepted_transit_time,
                working_company.accepted_at,
                working_company.payment_status,
                working_company.payment_proof_url,
                working_company.verification_date,
                working_company.payment_company_notes,
                working_company.has_payment_proof,
                
                -- Revenue calculation
                CASE 
                    WHEN working_company.payment_status = 'verified' THEN working_company.price
                    ELSE 0
                END as verified_revenue
                
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            
            -- Subquery for response counts
            LEFT JOIN (
                SELECT 
                    qr_count.quote_id,
                    COUNT(DISTINCT qr_count.id) as response_count,
                    COUNT(DISTINCT CASE WHEN uqs_count.status = 'accepted' THEN qr_count.id END) as accepted_count
                FROM quote_responses qr_count
                LEFT JOIN user_quote_status uqs_count ON qr_count.id = uqs_count.quote_response_id
                GROUP BY qr_count.quote_id
            ) response_counts ON q.id = response_counts.quote_id
            
            -- Subquery for working company (accepted response)
            LEFT JOIN (
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
            ) working_company ON q.id = working_company.quote_id
            
            ORDER BY q.created_at DESC
            LIMIT 50
        `;
        
        console.log('📝 Executing fixed admin query...');
        const [quotes] = await db.execute(sql);
        
        console.log(`✅ Query executed successfully. Found ${quotes.length} quotes\n`);
        
        if (quotes.length > 0) {
            console.log('📊 Results Analysis:');
            
            const quotesWithCompany = quotes.filter(q => q.company_name);
            const quotesWithoutCompany = quotes.filter(q => !q.company_name);
            
            console.log(`🏢 Quotes with company: ${quotesWithCompany.length}`);
            console.log(`❌ Quotes without company: ${quotesWithoutCompany.length}\n`);
            
            console.log('📋 Sample Results:');
            quotes.slice(0, 5).forEach((quote, index) => {
                console.log(`\n--- Quote ${index + 1} (ID: ${quote.id}) ---`);
                console.log(`👤 Customer: ${quote.user_name} (${quote.user_email})`);
                console.log(`🏢 Company: ${quote.company_name || 'NO COMPANY ASSIGNED'}`);
                console.log(`📧 Company Email: ${quote.company_email || 'NO EMAIL'}`);
                console.log(`💰 Accepted Price: $${quote.accepted_price || '0.00'}`);
                console.log(`🚚 Transit Time: ${quote.accepted_transit_time || 'N/A'}`);
                console.log(`📦 Product: ${quote.product_description}`);
                console.log(`📍 Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`📊 Responses: ${quote.response_count} total, ${quote.accepted_count} accepted`);
                console.log(`💳 Payment Status: ${quote.payment_status || 'No payment status'}`);
                console.log(`📅 Quote Status: ${quote.status}`);
                console.log(`🕒 Accepted At: ${quote.accepted_at || 'Not accepted yet'}`);
            });
            
            if (quotesWithCompany.length > 0) {
                console.log('\n🏢 QUOTES WITH COMPANY DATA:');
                quotesWithCompany.forEach((quote, index) => {
                    console.log(`\n--- Company Quote ${index + 1} (ID: ${quote.id}) ---`);
                    console.log(`👤 Customer: ${quote.user_name}`);
                    console.log(`🏢 Company: ${quote.company_name}`);
                    console.log(`📧 Company Email: ${quote.company_email}`);
                    console.log(`💰 Accepted Price: $${quote.accepted_price}`);
                    console.log(`📦 Product: ${quote.product_description}`);
                    console.log(`📊 Responses: ${quote.response_count} total, ${quote.accepted_count} accepted`);
                });
            }
            
            if (quotesWithCompany.length > 0) {
                console.log('\n✅ SUCCESS: Company data is now being returned by the query!');
                console.log('🎉 The admin panel should now display company information.');
            } else {
                console.log('\n⚠️ Still no company data found. Need to investigate further.');
            }
        } else {
            console.log('⚠️ No quotes found');
        }
        
    } catch (error) {
        console.error('❌ Query error:', error);
    } finally {
        process.exit(0);
    }
}

testFixedAdminQuery();