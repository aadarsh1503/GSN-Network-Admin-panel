// Test script to verify the fixed available quotes logic
import db from './config/db.js';

const testFixedLogic = async () => {
    try {
        // Test for aar@gmail.com (company in Bangladesh)
        const [userResult] = await db.execute(
            'SELECT id, email, country FROM users WHERE email = ?',
            ['aar@gmail.com']
        );

        if (userResult.length === 0) {
            console.log('User aar@gmail.com not found');
            return;
        }

        const companyId = userResult[0].id;
        const companyCountry = userResult[0].country;
        
        console.log('Company ID:', companyId);
        console.log('Company Country:', companyCountry);

        // Test the new logic
        const [availableQuotes] = await db.execute(`
            SELECT COUNT(*) as available_quotes
            FROM quotes q
            WHERE q.status IN ('pending', 'approved') 
            AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND (q.departure_country = ? OR q.arrival_country = ?)
            AND q.id NOT IN (
                SELECT quote_id FROM quote_responses WHERE company_id = ?
            )
        `, [companyCountry, companyCountry, companyId]);

        console.log('\n=== FIXED Logic Result ===');
        console.log('Available quotes count:', availableQuotes[0].available_quotes);

        // Show which quotes match the criteria
        const [matchingQuotes] = await db.execute(`
            SELECT q.id, q.departure_country, q.departure_state, q.departure_city,
                   q.arrival_country, q.arrival_state, q.arrival_city, q.status, q.created_at
            FROM quotes q
            WHERE q.status IN ('pending', 'approved') 
            AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND (q.departure_country = ? OR q.arrival_country = ?)
            AND q.id NOT IN (
                SELECT quote_id FROM quote_responses WHERE company_id = ?
            )
            ORDER BY q.created_at DESC
        `, [companyCountry, companyCountry, companyId]);

        console.log('\n=== Matching Quotes for Bangladesh Company ===');
        if (matchingQuotes.length === 0) {
            console.log('No quotes found matching the location criteria');
        } else {
            matchingQuotes.forEach((quote, index) => {
                console.log(`${index + 1}. Quote ID: ${quote.id}`);
                console.log(`   From: ${quote.departure_city}, ${quote.departure_state}, ${quote.departure_country}`);
                console.log(`   To: ${quote.arrival_city}, ${quote.arrival_state}, ${quote.arrival_country}`);
                console.log(`   Status: ${quote.status}`);
                console.log(`   Created: ${quote.created_at}`);
                console.log('');
            });
        }

        // Compare with old logic
        const [oldLogicResult] = await db.execute(`
            SELECT COUNT(*) as available_quotes
            FROM quotes q
            WHERE q.status IN ('pending', 'approved') 
            AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND q.id NOT IN (
                SELECT quote_id FROM quote_responses WHERE company_id = ?
            )
        `, [companyId]);

        console.log('\n=== Comparison ===');
        console.log('Old logic (no location filter):', oldLogicResult[0].available_quotes);
        console.log('New logic (with location filter):', availableQuotes[0].available_quotes);
        console.log('Difference:', oldLogicResult[0].available_quotes - availableQuotes[0].available_quotes, 'quotes filtered out');

    } catch (error) {
        console.error('Error testing fixed logic:', error);
    } finally {
        process.exit(0);
    }
};

testFixedLogic();