import db from './config/db.js';

async function testLocationFiltering() {
    try {
        console.log('Testing location-based quote filtering...\n');

        // Test 1: Check if we have companies with location data
        console.log('1. Checking companies with location data...');
        const [companies] = await db.execute(`
            SELECT id, name, country, state, city, role 
            FROM users 
            WHERE role IN ('company', 'business') 
            AND country IS NOT NULL 
            LIMIT 5
        `);
        
        console.log(`✅ Found ${companies.length} companies with location data:`);
        companies.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} - ${company.country}${company.state ? ', ' + company.state : ''}${company.city ? ', ' + company.city : ''}`);
        });

        // Test 2: Check if we have quotes with location data
        console.log('\n2. Checking quotes with location data...');
        const [quotes] = await db.execute(`
            SELECT id, departure_country, departure_state, arrival_country, arrival_state, status
            FROM quotes 
            WHERE departure_country IS NOT NULL 
            AND arrival_country IS NOT NULL
            LIMIT 5
        `);
        
        console.log(`✅ Found ${quotes.length} quotes with location data:`);
        quotes.forEach((quote, index) => {
            console.log(`   ${index + 1}. Quote ${quote.id}: ${quote.departure_country} → ${quote.arrival_country} (${quote.status})`);
        });

        // Test 3: Simulate location-based filtering for a specific company
        if (companies.length > 0) {
            const testCompany = companies[0];
            console.log(`\n3. Testing location filtering for company: ${testCompany.name} (${testCompany.country})`);
            
            const locationFilterSql = `
                SELECT q.*, 
                       CASE 
                           WHEN (q.departure_country = ? AND q.arrival_country = ?) THEN 4
                           WHEN (q.departure_country = ? OR q.arrival_country = ?) THEN 3
                           WHEN (q.departure_state = ? OR q.arrival_state = ?) THEN 2
                           ELSE 1
                       END as location_priority
                FROM quotes q 
                WHERE q.status = 'pending' 
                AND (q.user_id != ? OR q.user_id IS NULL)
                AND (
                    q.departure_country = ? OR 
                    q.arrival_country = ? OR
                    q.departure_country IS NULL OR 
                    q.arrival_country IS NULL
                )
                ORDER BY location_priority DESC, q.created_at DESC
                LIMIT 10
            `;

            const [filteredQuotes] = await db.execute(locationFilterSql, [
                testCompany.country, testCompany.country, // both same country
                testCompany.country, testCompany.country, // either same country
                testCompany.state || '', testCompany.state || '', // state matching
                testCompany.id, // exclude own quotes
                testCompany.country, testCompany.country // location filter
            ]);

            console.log(`✅ Found ${filteredQuotes.length} location-relevant quotes:`);
            filteredQuotes.forEach((quote, index) => {
                const priorityText = quote.location_priority === 4 ? 'Both countries match' :
                                   quote.location_priority === 3 ? 'One country matches' :
                                   quote.location_priority === 2 ? 'State matches' : 'Low priority';
                console.log(`   ${index + 1}. Quote ${quote.id}: ${quote.departure_country} → ${quote.arrival_country} (Priority: ${quote.location_priority} - ${priorityText})`);
            });

            const localMatches = filteredQuotes.filter(q => q.location_priority >= 3).length;
            console.log(`\n   📍 Local matches (same country): ${localMatches} out of ${filteredQuotes.length}`);
        }

        console.log('\n✅ Location filtering test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        await db.end();
    }
}

// Run the test
testLocationFiltering();