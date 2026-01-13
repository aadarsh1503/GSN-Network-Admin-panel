// Debug script to check available quotes for aar@gmail.com
import db from './config/db.js';

const debugAvailableQuotes = async () => {
    try {
        // First, find the company ID for aar@gmail.com
        const [userResult] = await db.execute(
            'SELECT id, email, role FROM users WHERE email = ?',
            ['aar@gmail.com']
        );

        if (userResult.length === 0) {
            console.log('User aar@gmail.com not found');
            return;
        }

        const companyId = userResult[0].id;
        console.log('Company ID for aar@gmail.com:', companyId);
        console.log('User details:', userResult[0]);

        // Check the current query being used in dashboard
        const [availableQuotes] = await db.execute(`
            SELECT COUNT(*) as available_quotes
            FROM quotes q
            WHERE q.status IN ('pending', 'approved') 
            AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND q.id NOT IN (
                SELECT quote_id FROM quote_responses WHERE company_id = ?
            )
        `, [companyId]);

        console.log('\n=== Current Dashboard Query Result ===');
        console.log('Available quotes count:', availableQuotes[0].available_quotes);

        // Let's see what quotes are actually available
        const [quotesDetails] = await db.execute(`
            SELECT q.id, q.departure_country, q.departure_state, q.departure_city,
                   q.arrival_country, q.arrival_state, q.arrival_city, q.status, q.created_at,
                   u.email as requester_email
            FROM quotes q
            JOIN users u ON q.user_id = u.id
            WHERE q.status IN ('pending', 'approved') 
            AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND q.id NOT IN (
                SELECT quote_id FROM quote_responses WHERE company_id = ?
            )
            ORDER BY q.created_at DESC
        `, [companyId]);

        console.log('\n=== Available Quotes Details ===');
        quotesDetails.forEach((quote, index) => {
            console.log(`${index + 1}. Quote ID: ${quote.id}`);
            console.log(`   From: ${quote.departure_city}, ${quote.departure_state}, ${quote.departure_country}`);
            console.log(`   To: ${quote.arrival_city}, ${quote.arrival_state}, ${quote.arrival_country}`);
            console.log(`   Status: ${quote.status}`);
            console.log(`   Created: ${quote.created_at}`);
            console.log(`   Requester: ${quote.requester_email}`);
            console.log('');
        });

        // Check if this company has already responded to any quotes
        const [responses] = await db.execute(`
            SELECT qr.quote_id, qr.status, qr.created_at, 
                   q.departure_city, q.departure_state, q.departure_country,
                   q.arrival_city, q.arrival_state, q.arrival_country
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [companyId]);

        console.log('\n=== Company\'s Quote Responses ===');
        if (responses.length === 0) {
            console.log('No responses found for this company');
        } else {
            responses.forEach((response, index) => {
                console.log(`${index + 1}. Quote ID: ${response.quote_id}`);
                console.log(`   Route: ${response.departure_city}, ${response.departure_state} → ${response.arrival_city}, ${response.arrival_state}`);
                console.log(`   Response Status: ${response.status}`);
                console.log(`   Responded At: ${response.created_at}`);
                console.log('');
            });
        }

        // Check company profile for location restrictions
        const [companyProfile] = await db.execute(`
            SELECT country, state, city, services, longitude, latitude 
            FROM users WHERE id = ?
        `, [companyId]);

        console.log('\n=== Company Profile ===');
        if (companyProfile.length > 0) {
            console.log('Company location:', `${companyProfile[0].city}, ${companyProfile[0].state}, ${companyProfile[0].country}`);
            console.log('Services:', companyProfile[0].services);
            console.log('Coordinates:', companyProfile[0].longitude, companyProfile[0].latitude);
        } else {
            console.log('No company profile found');
        }

        // Let's also check what the correct available quotes should be
        // This should consider location matching if implemented
        console.log('\n=== Checking for Location-Based Filtering ===');
        
        // Check if there's any location-based filtering logic
        const [allQuotes] = await db.execute(`
            SELECT COUNT(*) as total_quotes
            FROM quotes 
            WHERE status IN ('pending', 'approved')
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        
        console.log('Total quotes in system (last 30 days):', allQuotes[0].total_quotes);

    } catch (error) {
        console.error('Error debugging available quotes:', error);
    } finally {
        process.exit(0);
    }
};

debugAvailableQuotes();