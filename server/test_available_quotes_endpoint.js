import db from './config/db.js';

async function testAvailableQuotesEndpoint() {
  try {
    console.log('Testing available quotes endpoint logic...');
    
    // Test the database query directly
    const userId = 1; // Use a test user ID
    
    // Get company's location information
    const companyLocationSql = `
        SELECT country, state, city, latitude, longitude 
        FROM users 
        WHERE id = ?
    `;
    const [companyLocationRows] = await db.execute(companyLocationSql, [userId]);
    
    if (companyLocationRows.length === 0) {
        console.log('❌ Company not found');
        return;
    }
    
    const companyLocation = companyLocationRows[0];
    console.log('✅ Company location:', companyLocation);

    // Check user's subscription status
    const subscriptionSql = `
        SELECT us.*, mp.name as plan_name, mp.max_responses
        FROM user_subscriptions us
        JOIN membership_plans mp ON us.plan_id = mp.id
        WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
        ORDER BY us.end_date DESC
        LIMIT 1
    `;

    const [subscriptionRows] = await db.execute(subscriptionSql, [userId]);
    console.log('✅ Subscription check completed. Active subscriptions:', subscriptionRows.length);
    
    // Allow viewing quotes even without subscription, but restrict responding
    const hasActiveSubscription = subscriptionRows.length > 0;
    const subscription = hasActiveSubscription ? subscriptionRows[0] : null;

    // Check how many responses user has made this month (only if has subscription)
    let currentResponses = 0;
    let canRespond = hasActiveSubscription;
    
    if (hasActiveSubscription) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const responseCountSql = `
            SELECT COUNT(*) as response_count
            FROM quote_responses 
            WHERE company_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
        `;

        const [responseCountRows] = await db.execute(responseCountSql, [userId, currentMonth]);
        currentResponses = responseCountRows[0].response_count;
        console.log('✅ Current responses this month:', currentResponses);

        // Check if user has reached response limit
        if (subscription.max_responses !== -1 && currentResponses >= subscription.max_responses) {
            canRespond = false;
        }
    }

    // Get quotes that match company's location and user hasn't responded to yet
    let locationFilter = '';
    let locationParams = [userId, userId];
    
    if (companyLocation.country) {
        // Enhanced location filtering with coordinate support
        if (companyLocation.latitude && companyLocation.longitude) {
            // Use coordinate-based filtering with fallback to country matching
            locationFilter = `AND (
                -- Coordinate-based filtering (within ~100km radius)
                (q.latitude IS NOT NULL AND q.longitude IS NOT NULL AND
                 (6371 * acos(cos(radians(?)) * cos(radians(q.latitude)) * 
                  cos(radians(q.longitude) - radians(?)) + 
                  sin(radians(?)) * sin(radians(q.latitude)))) <= 100)
                OR
                -- Country-based fallback
                q.departure_country = ? OR 
                q.arrival_country = ? OR
                q.departure_country IS NULL OR 
                q.arrival_country IS NULL
            )`;
            locationParams.push(
                companyLocation.latitude, companyLocation.longitude, companyLocation.latitude, // for distance calculation
                companyLocation.country, companyLocation.country // for country fallback
            );
        } else {
            // Country-based filtering only
            locationFilter = `AND (
                q.departure_country = ? OR 
                q.arrival_country = ? OR
                q.departure_country IS NULL OR 
                q.arrival_country IS NULL
            )`;
            locationParams.push(companyLocation.country, companyLocation.country);
        }
    }

    const quotesSql = `
        SELECT q.*, 
               COALESCE(u.name, q.contact_name) as user_name, 
               COALESCE(u.email, q.contact_email) as user_email,
               q.contact_phone as user_phone,
               u.country as user_country,
               u.state as user_state,
               u.city as user_city,
               u.latitude as user_latitude,
               u.longitude as user_longitude,
               CASE 
                   WHEN (q.departure_country = ? AND q.arrival_country = ?) THEN 5
                   WHEN (q.departure_country = ? OR q.arrival_country = ?) THEN 4
                   WHEN (q.departure_state = ? OR q.arrival_state = ?) THEN 3
                   WHEN (? IS NOT NULL AND ? IS NOT NULL AND q.latitude IS NOT NULL AND q.longitude IS NOT NULL AND
                         (6371 * acos(cos(radians(?)) * cos(radians(q.latitude)) * 
                          cos(radians(q.longitude) - radians(?)) + 
                          sin(radians(?)) * sin(radians(q.latitude)))) <= 100) THEN 2
                   ELSE 1
               END as location_priority
        FROM quotes q 
        LEFT JOIN users u ON q.user_id = u.id 
        WHERE q.status = 'pending' 
        AND (q.user_id != ? OR q.user_id IS NULL)
        AND NOT EXISTS (
            SELECT 1 FROM quote_responses qr 
            WHERE qr.quote_id = q.id AND qr.company_id = ?
        )
        ${locationFilter}
        ORDER BY location_priority DESC, q.created_at DESC
        LIMIT 10
    `;

    // Add company location parameters for priority calculation
    const finalParams = [
        companyLocation.country, companyLocation.country, // both departure and arrival same country (highest priority)
        companyLocation.country, companyLocation.country, // either departure or arrival same country
        companyLocation.state || '', companyLocation.state || '', // state matching
        companyLocation.latitude, companyLocation.longitude, // coordinate availability check
        companyLocation.latitude, companyLocation.longitude, companyLocation.latitude, // distance calculation
        ...locationParams
    ];

    console.log('✅ Executing quotes query with parameters:', finalParams.length, 'parameters');
    const [quotes] = await db.execute(quotesSql, finalParams);
    console.log('✅ Found', quotes.length, 'quotes');

    if (quotes.length > 0) {
        console.log('Sample quote:', {
            id: quotes[0].id,
            departure_country: quotes[0].departure_country,
            arrival_country: quotes[0].arrival_country,
            location_priority: quotes[0].location_priority
        });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('Results:');
    console.log('- Company location:', companyLocation.country);
    console.log('- Has active subscription:', hasActiveSubscription);
    console.log('- Can respond:', canRespond);
    console.log('- Available quotes:', quotes.length);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await db.end();
  }
}

testAvailableQuotesEndpoint();