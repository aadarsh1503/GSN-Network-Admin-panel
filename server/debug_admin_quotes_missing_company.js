import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function debugAdminQuotesMissingCompany() {
    console.log('🔍 Debugging Admin Quotes Missing Company Data');
    console.log('==============================================');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database');
        
        // 1. Get the latest quotes (66, 65, 64, etc.)
        console.log('\n1. Checking latest quotes...');
        const [latestQuotes] = await connection.execute(`
            SELECT q.id, q.user_id, u.email as user_email, q.departure_country, q.arrival_country, 
                   q.product_description, q.status, q.created_at
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.id >= 60
            ORDER BY q.id DESC
        `);
        
        console.log('📋 Latest quotes:');
        console.table(latestQuotes);
        
        // 2. Check quote responses for these quotes
        console.log('\n2. Checking quote responses...');
        const [responses] = await connection.execute(`
            SELECT qr.id as response_id, qr.quote_id, qr.company_id, qr.price, 
                   c.name as company_name, c.email as company_email,
                   qr.created_at as response_created
            FROM quote_responses qr
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE qr.quote_id >= 60
            ORDER BY qr.quote_id DESC, qr.id DESC
        `);
        
        console.log('📋 Quote responses:');
        console.table(responses);
        
        // 3. Check user_quote_status for these responses
        console.log('\n3. Checking user_quote_status...');
        const [userStatuses] = await connection.execute(`
            SELECT uqs.id, uqs.quote_response_id, uqs.user_id, uqs.status, uqs.accepted_at,
                   qr.quote_id, qr.company_id, c.name as company_name
            FROM user_quote_status uqs
            LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE qr.quote_id >= 60
            ORDER BY qr.quote_id DESC
        `);
        
        console.log('📋 User quote statuses:');
        console.table(userStatuses);
        
        // 4. Run the exact admin query for quotes 66, 65, 64
        console.log('\n4. Testing admin query for specific quotes...');
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
                
                -- Company working on this quote (accepted response)
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price,
                working_company.accepted_at,
                working_company.payment_status
                
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
            
            WHERE q.id IN (66, 65, 64, 63, 62)
            ORDER BY q.id DESC
        `);
        
        console.log('📋 Admin query results:');
        console.table(adminResults.map(r => ({
            quote_id: r.id,
            user_email: r.user_email,
            route: `${r.departure_country} → ${r.arrival_country}`,
            responses: r.response_count,
            accepted: r.accepted_count,
            company: r.company_name || 'NO COMPANY',
            company_email: r.company_email || 'NO EMAIL',
            price: r.accepted_price || 'NO PRICE',
            payment_status: r.payment_status || 'NO STATUS'
        })));
        
        // 5. Check if there are responses but no accepted status
        console.log('\n5. Checking quotes with responses but no accepted status...');
        const [responsesWithoutAccepted] = await connection.execute(`
            SELECT DISTINCT qr.quote_id, q.product_description, c.name as company_name, c.email as company_email,
                   qr.price, uqs.status as user_status, uqs.accepted_at
            FROM quote_responses qr
            LEFT JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users c ON qr.company_id = c.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            WHERE qr.quote_id IN (66, 65, 64, 63, 62)
            ORDER BY qr.quote_id DESC, qr.id DESC
        `);
        
        console.log('📋 All responses (including non-accepted):');
        console.table(responsesWithoutAccepted);
        
        // 6. Check payment verifications
        console.log('\n6. Checking payment verifications...');
        const [paymentVerifications] = await connection.execute(`
            SELECT pv.*, pp.quote_response_id, qr.quote_id, c.name as company_name
            FROM payment_verifications pv
            LEFT JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
            LEFT JOIN quote_responses qr ON pp.quote_response_id = qr.id
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE qr.quote_id IN (66, 65, 64, 63, 62)
            ORDER BY qr.quote_id DESC
        `);
        
        console.log('📋 Payment verifications:');
        console.table(paymentVerifications);
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

debugAdminQuotesMissingCompany().catch(console.error);