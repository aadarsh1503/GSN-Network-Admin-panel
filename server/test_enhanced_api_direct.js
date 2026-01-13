import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testEnhancedAPIDirectly() {
    console.log('🔍 Testing Enhanced API Query Directly');
    console.log('=====================================');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database');
        
        // Test the exact query from the enhanced API
        const companyId = 10; // Aadarsh-company ID
        
        console.log(`\n🧪 Testing enhanced API query for company ID: ${companyId}`);
        
        const [responses] = await connection.execute(`
            SELECT q.id,
                   qr.id as response_id,
                   qr.quote_id,
                   qr.company_id,
                   qr.price,
                   qr.transit_time,
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.shipping_mode,
                   q.arrival_date,
                   q.status,
                   q.created_at,
                   q.updated_at,
                   -- Customer information
                   u.name as user_name,
                   u.email as user_email,
                   u.phone as user_phone,
                   -- Company information (the logged-in company)
                   c.name as company_name,
                   c.email as company_email,
                   c.phone as company_phone,
                   -- Quote status and payment info
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   CASE WHEN qr.requires_payment_proof = 1 THEN 1 ELSE 0 END as has_payment_proof,
                   pv.verification_status as payment_status,
                   pv.verification_date
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            JOIN users c ON qr.company_id = c.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [companyId]);

        console.log(`\n📋 Query Results (${responses.length} rows):`);
        
        if (responses.length > 0) {
            // Show the key fields for analysis
            console.table(responses.map(r => ({
                quote_id: r.id,           // This should be the quote ID (65, 66)
                response_id: r.response_id, // This should be the response ID (69, 70)
                user_email: r.user_email,
                route: `${r.departure_country} → ${r.arrival_country}`,
                price: r.price,
                status: r.status
            })));
            
            // Check for the specific issue
            const quote65 = responses.find(r => r.id === 65);
            const quote66 = responses.find(r => r.id === 66);
            
            if (quote65) {
                console.log(`\n✅ Quote 65 found with correct ID: ${quote65.id} (response ID: ${quote65.response_id})`);
            }
            
            if (quote66) {
                console.log(`✅ Quote 66 found with correct ID: ${quote66.id} (response ID: ${quote66.response_id})`);
            }
            
            // Show full structure of first result
            console.log('\n📋 Full structure of first result:');
            console.log(JSON.stringify(responses[0], null, 2));
            
        } else {
            console.log('❌ No results found');
        }
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await connection.end();
    }
}

testEnhancedAPIDirectly().catch(console.error);