// Debug script to test database queries for company data
import db from './config/db.js';

async function debugCompanyDataQuery() {
    console.log('🔍 Starting Database Company Data Debug...\n');
    
    try {
        // Test 1: Check if we have quotes
        console.log('📊 Test 1: Checking quotes table...');
        const [quotes] = await db.execute('SELECT COUNT(*) as count FROM quotes');
        console.log(`✅ Total quotes in database: ${quotes[0].count}`);
        
        // Test 2: Check if we have quote responses
        console.log('\n📊 Test 2: Checking quote_responses table...');
        const [responses] = await db.execute('SELECT COUNT(*) as count FROM quote_responses');
        console.log(`✅ Total quote responses: ${responses[0].count}`);
        
        // Test 3: Check if we have user_quote_status entries
        console.log('\n📊 Test 3: Checking user_quote_status table...');
        const [statuses] = await db.execute('SELECT COUNT(*) as count FROM user_quote_status');
        console.log(`✅ Total user quote statuses: ${statuses[0].count}`);
        
        // Test 4: Check accepted responses
        console.log('\n📊 Test 4: Checking accepted responses...');
        const [accepted] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM user_quote_status 
            WHERE status = 'accepted'
        `);
        console.log(`✅ Accepted responses: ${accepted[0].count}`);
        
        // Test 5: Check companies (users with role company)
        console.log('\n📊 Test 5: Checking company users...');
        const [companies] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE role = 'company'
        `);
        console.log(`✅ Company users: ${companies[0].count}`);
        
        // Test 6: Test the working_company subquery
        console.log('\n📊 Test 6: Testing working_company subquery...');
        const [workingCompanies] = await db.execute(`
            SELECT 
                qr2.quote_id,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone,
                qr2.price,
                qr2.transit_time,
                uqs2.accepted_at,
                uqs2.status
            FROM quote_responses qr2
            JOIN users c ON qr2.company_id = c.id
            LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
            WHERE uqs2.status = 'accepted'
            LIMIT 5
        `);
        
        console.log(`✅ Working companies found: ${workingCompanies.length}`);
        if (workingCompanies.length > 0) {
            console.log('\n🏢 Sample working companies:');
            workingCompanies.forEach((company, index) => {
                console.log(`  ${index + 1}. ${company.company_name} (${company.company_email}) - Quote ${company.quote_id} - $${company.price}`);
            });
        } else {
            console.log('⚠️ No working companies found - this explains why admin panel shows no company data');
        }
        
        // Test 7: Full admin query test
        console.log('\n📊 Test 7: Testing full admin query (first 3 results)...');
        const [adminResults] = await db.execute(`
            SELECT 
                q.id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                q.product_description,
                q.departure_country,
                q.arrival_country,
                q.status,
                COUNT(DISTINCT qr.id) as response_count,
                COUNT(DISTINCT CASE WHEN uqs.status = 'accepted' THEN qr.id END) as accepted_count,
                
                -- Company working on this quote (accepted response)
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price,
                working_company.transit_time as accepted_transit_time,
                working_company.accepted_at
                
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN (
                SELECT 
                    qr2.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    c.phone as company_phone,
                    qr2.price,
                    qr2.transit_time,
                    uqs2.accepted_at
                FROM quote_responses qr2
                JOIN users c ON qr2.company_id = c.id
                LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
                WHERE uqs2.status = 'accepted'
            ) working_company ON q.id = working_company.quote_id
            GROUP BY q.id, working_company.company_name, working_company.company_email, 
                     working_company.price, working_company.transit_time, working_company.accepted_at
            ORDER BY q.created_at DESC
            LIMIT 3
        `);
        
        console.log(`✅ Admin query results: ${adminResults.length}`);
        if (adminResults.length > 0) {
            console.log('\n📋 Sample admin query results:');
            adminResults.forEach((result, index) => {
                console.log(`\n--- Result ${index + 1} (Quote ID: ${result.id}) ---`);
                console.log(`👤 Customer: ${result.user_name} (${result.user_email})`);
                console.log(`🏢 Company: ${result.company_name || 'NO COMPANY'}`);
                console.log(`📧 Company Email: ${result.company_email || 'NO EMAIL'}`);
                console.log(`💰 Price: $${result.accepted_price || '0.00'}`);
                console.log(`📦 Product: ${result.product_description}`);
                console.log(`📊 Responses: ${result.response_count} total, ${result.accepted_count} accepted`);
                console.log(`📅 Status: ${result.status}`);
            });
        }
        
        // Summary and recommendations
        console.log('\n📈 Debug Summary:');
        console.log(`📊 Quotes: ${quotes[0].count}`);
        console.log(`📨 Responses: ${responses[0].count}`);
        console.log(`✅ Accepted: ${accepted[0].count}`);
        console.log(`🏢 Companies: ${companies[0].count}`);
        console.log(`🤝 Working Companies: ${workingCompanies.length}`);
        
        if (workingCompanies.length === 0) {
            console.log('\n⚠️ ROOT CAUSE IDENTIFIED:');
            console.log('No accepted quote responses found in the database.');
            console.log('\n💡 To fix this, you need to:');
            console.log('1. Have companies submit quote responses');
            console.log('2. Have users accept those responses');
            console.log('3. Ensure user_quote_status table has entries with status = "accepted"');
        } else {
            console.log('\n✅ Company data should be available in admin panel');
        }
        
    } catch (error) {
        console.error('❌ Database debug error:', error);
    } finally {
        // Close database connection
        process.exit(0);
    }
}

// Run the debug function
debugCompanyDataQuery();