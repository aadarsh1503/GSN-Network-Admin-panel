// Test script to verify both dashboard and available quotes endpoints are fixed
import db from './config/db.js';

const testCompleteFix = async () => {
    try {
        console.log('=== Testing Complete Fix for aar@gmail.com ===\n');

        // Get company info
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

        // Test 1: Dashboard Stats (Fixed)
        console.log('\n=== Test 1: Dashboard Stats ===');
        
        const [companyLocation] = await db.execute(`
            SELECT country FROM users WHERE id = ?
        `, [companyId]);

        const companyCountryFromDB = companyLocation[0]?.country;

        let availableQuotesQuery;
        let queryParams;

        if (companyCountryFromDB) {
            availableQuotesQuery = `
                SELECT COUNT(*) as available_quotes
                FROM quotes q
                WHERE q.status IN ('pending', 'approved') 
                AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND (q.departure_country = ? OR q.arrival_country = ?)
                AND q.id NOT IN (
                    SELECT quote_id FROM quote_responses WHERE company_id = ?
                )
            `;
            queryParams = [companyCountryFromDB, companyCountryFromDB, companyId];
        } else {
            availableQuotesQuery = `
                SELECT COUNT(*) as available_quotes
                FROM quotes q
                WHERE q.status IN ('pending', 'approved') 
                AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND q.id NOT IN (
                    SELECT quote_id FROM quote_responses WHERE company_id = ?
                )
            `;
            queryParams = [companyId];
        }

        const [dashboardResult] = await db.execute(availableQuotesQuery, queryParams);
        console.log('Dashboard available quotes:', dashboardResult[0].available_quotes);

        // Test 2: Available Quotes Endpoint (Fixed)
        console.log('\n=== Test 2: Available Quotes Endpoint ===');
        
        let locationFilter = '';
        let locationParams = [];
        
        if (companyCountryFromDB) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [companyCountryFromDB, companyCountryFromDB];
        }

        const quotesSql = `
            SELECT q.id, q.departure_country, q.departure_state, q.departure_city,
                   q.arrival_country, q.arrival_state, q.arrival_city, q.status, q.created_at
            FROM quotes q 
            WHERE q.status IN ('pending', 'approved')
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            ${locationFilter}
            ORDER BY q.created_at DESC
        `;

        const finalParams = [companyId, companyId, ...locationParams];
        const [availableQuotes] = await db.execute(quotesSql, finalParams);

        console.log('Available quotes endpoint count:', availableQuotes.length);
        console.log('\nQuotes details:');
        availableQuotes.forEach((quote, index) => {
            console.log(`${index + 1}. Quote ID: ${quote.id}`);
            console.log(`   From: ${quote.departure_city}, ${quote.departure_state}, ${quote.departure_country}`);
            console.log(`   To: ${quote.arrival_city}, ${quote.arrival_state}, ${quote.arrival_country}`);
            console.log(`   Status: ${quote.status}`);
            console.log('');
        });

        // Test 3: Verify consistency
        console.log('\n=== Test 3: Consistency Check ===');
        console.log('Dashboard count:', dashboardResult[0].available_quotes);
        console.log('Endpoint count:', availableQuotes.length);
        console.log('Match:', dashboardResult[0].available_quotes === availableQuotes.length ? '✅ YES' : '❌ NO');

        // Test 4: Show what was filtered out
        console.log('\n=== Test 4: What was filtered out ===');
        const [allQuotes] = await db.execute(`
            SELECT q.id, q.departure_country, q.arrival_country, q.status
            FROM quotes q 
            WHERE q.status IN ('pending', 'approved')
            AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            ORDER BY q.created_at DESC
        `, [companyId, companyId]);

        console.log('Total quotes without location filter:', allQuotes.length);
        console.log('Quotes with location filter:', availableQuotes.length);
        console.log('Filtered out:', allQuotes.length - availableQuotes.length);

        const filteredOut = allQuotes.filter(q => 
            !availableQuotes.some(aq => aq.id === q.id)
        );

        if (filteredOut.length > 0) {
            console.log('\nFiltered out quotes:');
            filteredOut.forEach((quote, index) => {
                console.log(`${index + 1}. Quote ID: ${quote.id} (${quote.departure_country} → ${quote.arrival_country})`);
            });
        }

    } catch (error) {
        console.error('Error testing complete fix:', error);
    } finally {
        process.exit(0);
    }
};

testCompleteFix();