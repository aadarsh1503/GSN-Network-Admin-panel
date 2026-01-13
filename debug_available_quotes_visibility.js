// Debug script to test Available Quotes visibility issue
import db from './server/config/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const testAvailableQuotesVisibility = async () => {
    console.log('🔍 Testing Available Quotes Visibility Issue');
    console.log('=' .repeat(60));

    try {
        // Test accounts from the issue description
        const company1Email = 'aadarsh-comapny-3@testing.com';
        const company2Email = 'aadarshchauhan35@gmail.com';

        // Get company IDs
        const [company1] = await db.execute('SELECT id, name FROM users WHERE email = ?', [company1Email]);
        const [company2] = await db.execute('SELECT id, name FROM users WHERE email = ?', [company2Email]);

        if (company1.length === 0 || company2.length === 0) {
            console.log('❌ Test companies not found');
            console.log('Company 1:', company1.length > 0 ? company1[0] : 'Not found');
            console.log('Company 2:', company2.length > 0 ? company2[0] : 'Not found');
            return;
        }

        const comp1 = company1[0];
        const comp2 = company2[0];

        console.log('✅ Found test companies:');
        console.log(`Company 1: ${comp1.name} (ID: ${comp1.id})`);
        console.log(`Company 2: ${comp2.name} (ID: ${comp2.id})`);
        console.log('');

        // Get available quotes for both companies using the same logic as getAvailableQuotes
        const getAvailableQuotesForCompany = async (companyId, companyName) => {
            console.log(`📋 Available quotes for ${companyName}:`);
            
            // Get company location
            const [companyLocation] = await db.execute(
                'SELECT country FROM users WHERE id = ?', 
                [companyId]
            );
            
            const country = companyLocation[0]?.country || '';
            
            // Same query as in getAvailableQuotes function
            const quotesSql = `
                SELECT q.id, q.status, q.product_description, q.departure_country, q.arrival_country,
                       COALESCE(u.name, q.contact_name) as user_name,
                       (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id) as total_responses,
                       (SELECT COUNT(*) FROM quote_responses qr WHERE qr.quote_id = q.id AND qr.company_id = ?) as my_responses,
                       (SELECT COUNT(*) FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count
                FROM quotes q 
                LEFT JOIN users u ON q.user_id = u.id 
                WHERE q.status IN ('pending', 'approved')
                AND (q.user_id != ? OR q.user_id IS NULL)
                AND NOT EXISTS (
                    SELECT 1 FROM quote_responses qr 
                    WHERE qr.quote_id = q.id AND qr.company_id = ?
                )
                AND NOT EXISTS (
                    SELECT 1 FROM user_quote_status uqs 
                    WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
                )
                AND (q.departure_country = ? OR q.arrival_country = ?)
                ORDER BY q.created_at DESC
                LIMIT 10
            `;

            const [quotes] = await db.execute(quotesSql, [
                companyId, companyId, companyId, country, country
            ]);

            if (quotes.length === 0) {
                console.log('  No available quotes found');
            } else {
                quotes.forEach((quote, index) => {
                    console.log(`  ${index + 1}. Quote ID: ${quote.id}`);
                    console.log(`     Status: ${quote.status}`);
                    console.log(`     User: ${quote.user_name}`);
                    console.log(`     Route: ${quote.departure_country} → ${quote.arrival_country}`);
                    console.log(`     Product: ${quote.product_description?.substring(0, 50)}...`);
                    console.log(`     Total Responses: ${quote.total_responses}`);
                    console.log(`     My Responses: ${quote.my_responses}`);
                    console.log(`     Accepted: ${quote.accepted_count}`);
                    console.log('');
                });
            }
            
            return quotes;
        };

        // Get available quotes for both companies
        const quotes1 = await getAvailableQuotesForCompany(comp1.id, comp1.name);
        console.log('-'.repeat(40));
        const quotes2 = await getAvailableQuotesForCompany(comp2.id, comp2.name);

        // Compare results
        console.log('🔍 COMPARISON:');
        console.log(`Company 1 sees ${quotes1.length} quotes`);
        console.log(`Company 2 sees ${quotes2.length} quotes`);

        // Find quotes visible to one but not the other
        const quotes1Ids = quotes1.map(q => q.id);
        const quotes2Ids = quotes2.map(q => q.id);
        
        const onlyInComp1 = quotes1Ids.filter(id => !quotes2Ids.includes(id));
        const onlyInComp2 = quotes2Ids.filter(id => !quotes1Ids.includes(id));
        
        if (onlyInComp1.length > 0) {
            console.log(`❌ Quotes only visible to ${comp1.name}: ${onlyInComp1.join(', ')}`);
        }
        
        if (onlyInComp2.length > 0) {
            console.log(`❌ Quotes only visible to ${comp2.name}: ${onlyInComp2.join(', ')}`);
        }
        
        if (onlyInComp1.length === 0 && onlyInComp2.length === 0) {
            console.log('✅ Both companies see the same quotes');
        }

        // Check for quotes with responses from company 2
        console.log('\n🔍 CHECKING QUOTES WITH RESPONSES:');
        const [quotesWithResponses] = await db.execute(`
            SELECT DISTINCT q.id, q.status, q.product_description,
                   qr.company_id, u.name as company_name, qr.price, qr.created_at as response_date,
                   (SELECT COUNT(*) FROM user_quote_status uqs WHERE uqs.quote_id = q.id AND uqs.status = 'accepted') as accepted_count
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN users u ON qr.company_id = u.id
            WHERE qr.company_id IN (?, ?)
            ORDER BY qr.created_at DESC
            LIMIT 10
        `, [comp1.id, comp2.id]);

        if (quotesWithResponses.length === 0) {
            console.log('No quotes with responses from test companies found');
        } else {
            quotesWithResponses.forEach((quote, index) => {
                console.log(`${index + 1}. Quote ID: ${quote.id} (Status: ${quote.status})`);
                console.log(`   Response by: ${quote.company_name} (ID: ${quote.company_id})`);
                console.log(`   Price: ${quote.price}`);
                console.log(`   Response Date: ${quote.response_date}`);
                console.log(`   Accepted Count: ${quote.accepted_count}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

testAvailableQuotesVisibility();