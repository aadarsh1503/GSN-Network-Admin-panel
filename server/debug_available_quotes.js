import db from './config/db.js';

async function debugAvailableQuotes() {
  try {
    console.log('Debugging available quotes step by step...');
    
    const userId = 10; // Test user ID from our token
    
    console.log('\n1. Testing company location query...');
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

    console.log('\n2. Testing subscription query...');
    const subscriptionSql = `
        SELECT us.*, mp.name as plan_name, mp.max_responses
        FROM user_subscriptions us
        JOIN membership_plans mp ON us.plan_id = mp.id
        WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
        ORDER BY us.end_date DESC
        LIMIT 1
    `;

    const [subscriptionRows] = await db.execute(subscriptionSql, [userId]);
    console.log('✅ Subscription query completed. Active subscriptions:', subscriptionRows.length);
    
    const hasActiveSubscription = subscriptionRows.length > 0;
    const subscription = hasActiveSubscription ? subscriptionRows[0] : null;

    console.log('\n3. Testing response count query...');
    let currentResponses = 0;
    let canRespond = hasActiveSubscription;
    
    if (hasActiveSubscription) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const responseCountSql = `
            SELECT COUNT(*) as response_count
            FROM quote_responses 
            WHERE company_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
        `;

        const [responseCountRows] = await db.execute(responseCountSql, [userId, currentMonth]);
        currentResponses = responseCountRows[0].response_count;
        console.log('✅ Current responses this month:', currentResponses);

        if (subscription.max_responses !== -1 && currentResponses >= subscription.max_responses) {
            canRespond = false;
        }
    }

    console.log('\n4. Testing location filter logic...');
    let locationFilter = '';
    let locationParams = [userId, userId];
    
    if (companyLocation.country) {
        if (companyLocation.latitude && companyLocation.longitude) {
            console.log('   Using coordinate-based filtering');
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
                companyLocation.latitude, companyLocation.longitude, companyLocation.latitude,
                companyLocation.country, companyLocation.country
            );
        } else {
            console.log('   Using country-based filtering only');
            locationFilter = `AND (
                q.departure_country = ? OR 
                q.arrival_country = ? OR
                q.departure_country IS NULL OR 
                q.arrival_country IS NULL
            )`;
            locationParams.push(companyLocation.country, companyLocation.country);
        }
    } else {
        console.log('   No location filtering (company has no country)');
    }

    console.log('\n5. Testing simplified quotes query...');
    const simpleQuotesSql = `
        SELECT q.id, q.departure_country, q.arrival_country, q.status
        FROM quotes q 
        WHERE q.status = 'pending' 
        AND (q.user_id != ? OR q.user_id IS NULL)
        LIMIT 5
    `;

    const [simpleQuotes] = await db.execute(simpleQuotesSql, [userId]);
    console.log('✅ Simple quotes query successful. Found:', simpleQuotes.length, 'quotes');
    
    if (simpleQuotes.length > 0) {
        console.log('   Sample quotes:');
        simpleQuotes.forEach((quote, index) => {
            console.log(`   ${index + 1}. ID: ${quote.id}, ${quote.departure_country} → ${quote.arrival_country}`);
        });
    }

    console.log('\n6. Testing complex quotes query...');
    const complexQuotesSql = `
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
        LIMIT 5
    `;

    const finalParams = [
        companyLocation.country || '', companyLocation.country || '',
        companyLocation.country || '', companyLocation.country || '',
        companyLocation.state || '', companyLocation.state || '',
        companyLocation.latitude, companyLocation.longitude,
        companyLocation.latitude, companyLocation.longitude, companyLocation.latitude,
        ...locationParams
    ];

    console.log('   Parameters count:', finalParams.length);
    console.log('   Parameters:', finalParams);

    const [complexQuotes] = await db.execute(complexQuotesSql, finalParams);
    console.log('✅ Complex quotes query successful. Found:', complexQuotes.length, 'quotes');

    console.log('\n✅ All tests passed! The issue might be elsewhere.');
    
  } catch (error) {
    console.error('❌ Debug failed at step:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
    });
  } finally {
    await db.end();
  }
}

debugAvailableQuotes();