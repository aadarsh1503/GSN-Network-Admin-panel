const mysql = require('mysql2/promise');
require('dotenv').config();

async function investigateQuote69() {
    console.log('🔍 Investigating Quote 69 Database Issue');
    console.log('=====================================');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database:', process.env.DB_NAME);
        console.log('🌐 Host:', process.env.DB_HOST);
        
        // 1. Check if Quote 69 exists in quotes table
        console.log('\n1. Checking if Quote 69 exists in quotes table...');
        const [quoteRows] = await connection.execute('SELECT * FROM quotes WHERE id = 69');
        
        if (quoteRows.length > 0) {
            console.log('✅ Quote 69 EXISTS in quotes table:');
            console.log(JSON.stringify(quoteRows[0], null, 2));
        } else {
            console.log('❌ Quote 69 NOT FOUND in quotes table');
        }
        
        // 2. Check highest quote ID
        console.log('\n2. Checking highest quote ID...');
        const [maxIdRows] = await connection.execute('SELECT MAX(id) as max_id FROM quotes');
        console.log('📊 Highest quote ID:', maxIdRows[0].max_id);
        
        // 3. Check recent quotes (last 10)
        console.log('\n3. Recent quotes (last 10):');
        const [recentQuotes] = await connection.execute(`
            SELECT id, user_id, departure_country, arrival_country, product_description, status, created_at 
            FROM quotes 
            ORDER BY id DESC 
            LIMIT 10
        `);
        console.table(recentQuotes);
        
        // 4. Check if there are any quote_responses for Quote 69
        console.log('\n4. Checking quote_responses for Quote 69...');
        const [responseRows] = await connection.execute('SELECT * FROM quote_responses WHERE quote_id = 69');
        
        if (responseRows.length > 0) {
            console.log('✅ Quote responses found for Quote 69:');
            console.table(responseRows);
        } else {
            console.log('❌ No quote responses found for Quote 69');
        }
        
        // 5. Check if company user (a@gmail.com) has responded to any quotes
        console.log('\n5. Checking company user responses...');
        const [companyUserRows] = await connection.execute('SELECT id FROM users WHERE email = ?', ['a@gmail.com']);
        
        if (companyUserRows.length > 0) {
            const companyId = companyUserRows[0].id;
            console.log('✅ Company user found, ID:', companyId);
            
            const [companyResponses] = await connection.execute(`
                SELECT qr.*, q.id as quote_id, q.departure_country, q.arrival_country 
                FROM quote_responses qr 
                JOIN quotes q ON qr.quote_id = q.id 
                WHERE qr.company_id = ? 
                ORDER BY qr.id DESC 
                LIMIT 10
            `, [companyId]);
            
            console.log('📋 Recent responses from this company:');
            console.table(companyResponses);
            
            // Check specifically for Quote 69 response
            const quote69Response = companyResponses.find(r => r.quote_id === 69);
            if (quote69Response) {
                console.log('✅ Company HAS responded to Quote 69');
            } else {
                console.log('❌ Company has NOT responded to Quote 69');
            }
        } else {
            console.log('❌ Company user a@gmail.com not found');
        }
        
        // 6. Check user_quote_status for Quote 69
        console.log('\n6. Checking user_quote_status for Quote 69...');
        const [statusRows] = await connection.execute(`
            SELECT uqs.*, qr.quote_id, qr.company_id 
            FROM user_quote_status uqs 
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id 
            WHERE qr.quote_id = 69
        `);
        
        if (statusRows.length > 0) {
            console.log('✅ User quote status found for Quote 69:');
            console.table(statusRows);
        } else {
            console.log('❌ No user quote status found for Quote 69');
        }
        
        // 7. Check payment proofs for Quote 69
        console.log('\n7. Checking payment proofs for Quote 69...');
        const [paymentRows] = await connection.execute(`
            SELECT pp.*, qr.quote_id 
            FROM payment_proofs pp 
            JOIN quote_responses qr ON pp.quote_response_id = qr.id 
            WHERE qr.quote_id = 69
        `);
        
        if (paymentRows.length > 0) {
            console.log('✅ Payment proofs found for Quote 69:');
            console.table(paymentRows);
        } else {
            console.log('❌ No payment proofs found for Quote 69');
        }
        
        // 8. Run the exact query from the enhanced API
        console.log('\n8. Running enhanced API query...');
        const [enhancedRows] = await connection.execute(`
            SELECT DISTINCT
                q.id,
                q.user_id,
                q.departure_country,
                q.arrival_country,
                q.product_description,
                q.shipping_mode,
                q.arrival_date,
                q.status,
                q.created_at,
                qr.id as response_id,
                qr.company_id,
                qr.price,
                qr.transit_time,
                qr.created_at as response_date,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                uqs.status as user_response_status,
                uqs.accepted_at,
                uqs.payment_proof_id,
                pp.file_path as payment_proof_url,
                pp.upload_date as payment_proof_date,
                pv.verification_status as payment_status,
                pv.verification_date,
                pv.company_notes as payment_notes,
                CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof,
                COUNT(qr2.id) as total_responses
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
            WHERE q.id = 69
            GROUP BY q.id, qr.id, uqs.id, pp.id, pv.id
        `);
        
        if (enhancedRows.length > 0) {
            console.log('✅ Enhanced API query found Quote 69:');
            console.table(enhancedRows);
        } else {
            console.log('❌ Enhanced API query did NOT find Quote 69');
        }
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

investigateQuote69().catch(console.error);