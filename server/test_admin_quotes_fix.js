import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testAdminQuotesFix() {
    console.log('🔧 Testing Admin Quotes Fix');
    console.log('============================');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database');
        
        // Test the updated admin query
        console.log('\n🧪 Testing updated admin query...');
        const [adminResults] = await connection.execute(`
            SELECT 
                q.id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                q.departure_country,
                q.arrival_country,
                q.product_description,
                q.status,
                
                -- Response counts
                COALESCE(response_counts.response_count, 0) as response_count,
                COALESCE(response_counts.accepted_count, 0) as accepted_count,
                
                -- Company working on this quote (accepted response OR verified payment)
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price,
                working_company.accepted_at,
                working_company.payment_status,
                working_company.verification_date
                
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
            
            -- Subquery for working company (accepted response OR verified payment)
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
                   OR (pv.verification_status = 'verified' AND pv.company_id = qr2.company_id)
            ) working_company ON q.id = working_company.quote_id
            
            WHERE q.id IN (67, 66, 65, 64, 63)
            ORDER BY q.id DESC
        `);
        
        console.log('📋 Updated admin query results:');
        console.table(adminResults.map(r => ({
            quote_id: r.id,
            user_email: r.user_email,
            route: `${r.departure_country} → ${r.arrival_country}`,
            responses: r.response_count,
            accepted: r.accepted_count,
            company: r.company_name || 'NO COMPANY',
            company_email: r.company_email || 'NO EMAIL',
            price: r.accepted_price || 'NO PRICE',
            payment_status: r.payment_status || 'NO STATUS',
            verification_date: r.verification_date || 'NO DATE'
        })));
        
        // Check improvement
        const quotesWithCompany = adminResults.filter(r => r.company_name);
        const quotesWithoutCompany = adminResults.filter(r => !r.company_name);
        
        console.log('\n📊 Results Summary:');
        console.log(`✅ Quotes with company assigned: ${quotesWithCompany.length}`);
        console.log(`❌ Quotes without company: ${quotesWithoutCompany.length}`);
        
        if (quotesWithCompany.length > 0) {
            console.log('\n🏢 Companies found:');
            quotesWithCompany.forEach(q => {
                console.log(`  - Quote ${q.id}: ${q.company_name} (${q.payment_status || 'no payment status'})`);
            });
        }
        
        if (quotesWithoutCompany.length > 0) {
            console.log('\n❌ Quotes still missing company data:');
            quotesWithoutCompany.forEach(q => {
                console.log(`  - Quote ${q.id}: ${q.user_email} - ${q.departure_country} → ${q.arrival_country}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

testAdminQuotesFix().catch(console.error);