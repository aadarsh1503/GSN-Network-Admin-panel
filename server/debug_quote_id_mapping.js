import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function investigateQuoteIdMapping() {
    console.log('🔍 Investigating Quote ID Mapping Issue');
    console.log('=====================================');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database:', process.env.DB_NAME);
        
        // 1. Check Quote 65 details
        console.log('\n1. Checking Quote 65 details...');
        const [quote65] = await connection.execute(`
            SELECT q.*, u.name as user_name, u.email as user_email 
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.id = 65
        `);
        
        if (quote65.length > 0) {
            console.log('✅ Quote 65 found:');
            console.table(quote65);
        }
        
        // 2. Check quote responses for Quote 65
        console.log('\n2. Checking quote responses for Quote 65...');
        const [responses65] = await connection.execute(`
            SELECT qr.*, u.name as company_name, u.email as company_email 
            FROM quote_responses qr 
            LEFT JOIN users u ON qr.company_id = u.id 
            WHERE qr.quote_id = 65
        `);
        
        if (responses65.length > 0) {
            console.log('✅ Quote responses for Quote 65:');
            console.table(responses65);
        }
        
        // 3. Check user_quote_status for Quote 65
        console.log('\n3. Checking user_quote_status for Quote 65...');
        const [status65] = await connection.execute(`
            SELECT uqs.*, qr.quote_id, qr.company_id, u.name as company_name 
            FROM user_quote_status uqs 
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id 
            LEFT JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = 65
        `);
        
        if (status65.length > 0) {
            console.log('✅ User quote status for Quote 65:');
            console.table(status65);
        }
        
        // 4. Check payment proofs for Quote 65
        console.log('\n4. Checking payment proofs for Quote 65...');
        const [payments65] = await connection.execute(`
            SELECT pp.*, qr.quote_id, u.name as company_name 
            FROM payment_proofs pp 
            JOIN quote_responses qr ON pp.quote_response_id = qr.id 
            LEFT JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = 65
        `);
        
        if (payments65.length > 0) {
            console.log('✅ Payment proofs for Quote 65:');
            console.table(payments65);
        }
        
        // 5. Run the enhanced API query for Quote 65
        console.log('\n5. Running enhanced API query for Quote 65...');
        const [enhancedQuery] = await connection.execute(`
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
            WHERE q.id = 65
            GROUP BY q.id, qr.id, uqs.id, pp.id, pv.id
        `);
        
        if (enhancedQuery.length > 0) {
            console.log('✅ Enhanced API query result for Quote 65:');
            console.table(enhancedQuery);
        }
        
        // 6. Check if there's any ID transformation happening
        console.log('\n6. Checking for potential ID transformation patterns...');
        
        // Check if there are any views or stored procedures that might be transforming IDs
        const [views] = await connection.execute(`
            SELECT TABLE_NAME, VIEW_DEFINITION 
            FROM INFORMATION_SCHEMA.VIEWS 
            WHERE TABLE_SCHEMA = ?
        `, [process.env.DB_NAME]);
        
        if (views.length > 0) {
            console.log('📋 Database views found:');
            console.table(views);
        } else {
            console.log('❌ No database views found');
        }
        
        // 7. Check for any triggers that might affect quote IDs
        const [triggers] = await connection.execute(`
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, TRIGGER_BODY
            FROM INFORMATION_SCHEMA.TRIGGERS 
            WHERE TRIGGER_SCHEMA = ?
        `, [process.env.DB_NAME]);
        
        if (triggers.length > 0) {
            console.log('📋 Database triggers found:');
            console.table(triggers);
        } else {
            console.log('❌ No database triggers found');
        }
        
        // 8. Check the exact query that company panel uses
        console.log('\n8. Testing company panel query simulation...');
        
        // Find a company user to test with
        const [companyUsers] = await connection.execute(`
            SELECT id, name, email FROM users WHERE role = 'company' LIMIT 5
        `);
        
        if (companyUsers.length > 0) {
            console.log('📋 Available company users:');
            console.table(companyUsers);
            
            const testCompanyId = companyUsers[0].id;
            console.log(`\n🧪 Testing with company ID: ${testCompanyId}`);
            
            // Test the accepted quotes query
            const [acceptedQuotes] = await connection.execute(`
                SELECT q.*, 
                       qr.price, qr.transit_time, qr.created_at as response_date,
                       uqs.accepted_at, uqs.status as user_response_status,
                       u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
                       COUNT(qr2.id) as total_responses,
                       pp.id as payment_proof_id,
                       pp.file_path as payment_proof_url,
                       pp.upload_date as payment_proof_date,
                       pv.id as payment_verification_id,
                       pv.verification_status as payment_status,
                       pv.verification_date,
                       pv.company_notes as payment_notes,
                       CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof
                FROM quotes q
                JOIN quote_responses qr ON q.id = qr.quote_id
                LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
                LEFT JOIN users u ON q.user_id = u.id
                LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
                LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
                LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
                WHERE qr.company_id = ? 
                AND (
                    uqs.status = 'accepted' 
                    OR (q.status = 'approved' AND pv.verification_status = 'verified' AND pv.company_id = qr.company_id)
                    OR (q.status = 'approved' AND pp.company_id = qr.company_id)
                )
                GROUP BY q.id, qr.id, uqs.id, pp.id, pv.id
                ORDER BY 
                    CASE 
                        WHEN uqs.accepted_at IS NOT NULL THEN uqs.accepted_at 
                        WHEN pv.verification_date IS NOT NULL THEN pv.verification_date
                        ELSE qr.created_at 
                    END DESC
            `, [testCompanyId]);
            
            console.log('📋 Company accepted quotes query result:');
            if (acceptedQuotes.length > 0) {
                console.table(acceptedQuotes.map(q => ({
                    quote_id: q.id,
                    user_email: q.user_email,
                    departure: q.departure_country,
                    arrival: q.arrival_country,
                    price: q.price,
                    status: q.status,
                    payment_status: q.payment_status
                })));
            } else {
                console.log('❌ No accepted quotes found for this company');
            }
        }
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

investigateQuoteIdMapping().catch(console.error);