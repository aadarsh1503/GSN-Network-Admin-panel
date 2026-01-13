import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

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
        
        // 4. Check user a@gmail.com
        console.log('\n4. Checking user a@gmail.com...');
        const [userRows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['a@gmail.com']);
        
        if (userRows.length > 0) {
            console.log('✅ User a@gmail.com found:');
            console.log('User ID:', userRows[0].id);
            console.log('Name:', userRows[0].name);
            console.log('Role:', userRows[0].role);
            
            const userId = userRows[0].id;
            
            // Check quotes by this user
            console.log('\n5. Checking quotes by a@gmail.com...');
            const [userQuotes] = await connection.execute(`
                SELECT id, departure_country, arrival_country, product_description, status, created_at 
                FROM quotes 
                WHERE user_id = ? 
                ORDER BY id DESC 
                LIMIT 10
            `, [userId]);
            
            console.log('📋 Recent quotes by a@gmail.com:');
            console.table(userQuotes);
            
            // Check if Quote 69 belongs to this user
            const quote69 = userQuotes.find(q => q.id === 69);
            if (quote69) {
                console.log('✅ Quote 69 BELONGS to a@gmail.com');
            } else {
                console.log('❌ Quote 69 does NOT belong to a@gmail.com');
            }
            
        } else {
            console.log('❌ User a@gmail.com not found');
        }
        
        // 6. Check if there are any quote_responses for Quote 69
        console.log('\n6. Checking quote_responses for Quote 69...');
        const [responseRows] = await connection.execute(`
            SELECT qr.*, u.name as company_name, u.email as company_email 
            FROM quote_responses qr 
            LEFT JOIN users u ON qr.company_id = u.id 
            WHERE qr.quote_id = 69
        `);
        
        if (responseRows.length > 0) {
            console.log('✅ Quote responses found for Quote 69:');
            console.table(responseRows);
        } else {
            console.log('❌ No quote responses found for Quote 69');
        }
        
        // 7. Check user_quote_status for Quote 69
        console.log('\n7. Checking user_quote_status for Quote 69...');
        const [statusRows] = await connection.execute(`
            SELECT uqs.*, qr.quote_id, qr.company_id, u.name as company_name 
            FROM user_quote_status uqs 
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id 
            LEFT JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = 69
        `);
        
        if (statusRows.length > 0) {
            console.log('✅ User quote status found for Quote 69:');
            console.table(statusRows);
        } else {
            console.log('❌ No user quote status found for Quote 69');
        }
        
        // 8. Check payment proofs for Quote 69
        console.log('\n8. Checking payment proofs for Quote 69...');
        const [paymentRows] = await connection.execute(`
            SELECT pp.*, qr.quote_id, u.name as company_name 
            FROM payment_proofs pp 
            JOIN quote_responses qr ON pp.quote_response_id = qr.id 
            LEFT JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = 69
        `);
        
        if (paymentRows.length > 0) {
            console.log('✅ Payment proofs found for Quote 69:');
            console.table(paymentRows);
        } else {
            console.log('❌ No payment proofs found for Quote 69');
        }
        
        // 9. Check what the company quotes API would return
        console.log('\n9. Simulating company quotes API for a@gmail.com...');
        
        // First find if a@gmail.com is a company user
        const [companyCheck] = await connection.execute(`
            SELECT id, name, email, role FROM users WHERE email = ? AND role = 'company'
        `, ['a@gmail.com']);
        
        if (companyCheck.length > 0) {
            const companyId = companyCheck[0].id;
            console.log('✅ a@gmail.com is a company user, ID:', companyId);
            
            // Run the exact query from updateQuoteStatus function
            const [companyQuoteCheck] = await connection.execute(`
                SELECT qr.id, q.user_id, u.name as user_name, u.email as user_email, u.role as user_role, q.status as current_status
                FROM quote_responses qr
                JOIN quotes q ON qr.quote_id = q.id
                LEFT JOIN users u ON q.user_id = u.id
                WHERE q.id = ? AND qr.company_id = ?
            `, [69, companyId]);
            
            if (companyQuoteCheck.length > 0) {
                console.log('✅ Company HAS responded to Quote 69:');
                console.table(companyQuoteCheck);
            } else {
                console.log('❌ Company has NOT responded to Quote 69 (this explains the 404!)');
            }
            
        } else {
            console.log('❌ a@gmail.com is NOT a company user');
        }
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

investigateQuote69().catch(console.error);