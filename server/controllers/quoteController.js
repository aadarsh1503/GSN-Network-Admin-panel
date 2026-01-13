// controllers/quoteController.js
import db from '../config/db.js';
import realTimeNotificationService from '../services/realTimeNotificationService.js';
import { queueSubscriptionEmails } from '../services/emailQueue.js';

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
};

// @desc    Submit a new quote request
// @route   POST /api/quotes/submit
// @access  Public (users can submit quotes)
const submitQuote = async (req, res) => {
    const {
        // Quote Information
        shippingMode, arrivalDate, departureCountry, departureState, departureCity, departureType,
        arrivalCountry, arrivalState, arrivalCity, arrivalType, productDescription,
        packing, incoterms, quantity, weight, type,
        // Dimensions
        length, width, height, dimensionUnit,
        // Additional Items
        isStackable, isHazardous, hasInsurance, notes,
        // Contact Info (if user not logged in)
        contactName, contactEmail, contactPhone
    } = req.body;

    // Basic validation
    if (!shippingMode || !arrivalDate || !departureCountry || !arrivalCountry || !productDescription) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        // Get user ID if logged in, otherwise null for guest quotes
        const userId = req.user ? req.user.id : null;

        const sql = `
            INSERT INTO quotes (
                user_id, shipping_mode, arrival_date, departure_country, departure_state, departure_city, departure_type,
                arrival_country, arrival_state, arrival_city, arrival_type, product_description,
                packing, incoterms, quantity, weight, type,
                length, width, height, dimension_unit,
                is_stackable, is_hazardous, has_insurance, notes,
                contact_name, contact_email, contact_phone, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const values = [
            userId, 
            shippingMode, 
            arrivalDate, 
            departureCountry, 
            departureState || null, 
            departureCity || null, 
            departureType || null,
            arrivalCountry, 
            arrivalState || null, 
            arrivalCity || null, 
            arrivalType || null, 
            productDescription,
            packing || null, 
            incoterms || null, 
            quantity || null, 
            weight || null, 
            type || null,
            length || null, 
            width || null, 
            height || null, 
            dimensionUnit || null,
            isStackable ? 1 : 0, 
            isHazardous ? 1 : 0, 
            hasInsurance ? 1 : 0, 
            notes || null,
            contactName || null, 
            contactEmail || null, 
            contactPhone || null
        ];

        const [result] = await db.execute(sql, values);
        const quoteId = result.insertId;

        // 🚀 SEND QUOTE REQUEST EMAILS (NON-BLOCKING)
        try {
          // Get user details if logged in
          let requestedBy = null;
          if (userId) {
            const [userRows] = await db.execute('SELECT name, email, phone, role FROM users WHERE id = ?', [userId]);
            if (userRows.length > 0) {
              requestedBy = userRows[0];
            }
          }

          // Prepare quote data for emails
          const quoteData = {
            quoteId,
            shippingMode,
            arrivalDate,
            departureCountry,
            departureState,
            departureCity,
            departureType,
            arrivalCountry,
            arrivalState,
            arrivalCity,
            arrivalType,
            productDescription,
            packing,
            incoterms,
            quantity,
            weight,
            type,
            length,
            width,
            height,
            dimensionUnit,
            isStackable,
            isHazardous,
            hasInsurance,
            notes,
            requestedBy: requestedBy || {
              name: contactName,
              email: contactEmail,
              phone: contactPhone,
              role: 'guest'
            },
            submittedAt: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          };

          // Send email to user/business user (if they have an email)
          const userEmail = requestedBy?.email || contactEmail;
          if (userEmail) {
            queueSubscriptionEmails.quoteRequestToUser({
              ...quoteData,
              recipientEmail: userEmail
            }).then(jobId => {
              console.log(`✅ Quote request user email queued (Job ID: ${jobId})`);
            }).catch(error => {
              console.error('❌ Failed to queue quote request user email:', error);
            });
          }

          // Send emails to all relevant companies
          // Get companies that match the route (departure or arrival country)
          const companySql = `
            SELECT id, name, email, country, state, city
            FROM users 
            WHERE role = 'company' 
            AND status = 1 
            AND is_blacklisted = 0
            AND (country = ? OR country = ?)
            AND email IS NOT NULL
          `;
          
          const [companies] = await db.execute(companySql, [departureCountry, arrivalCountry]);
          
          console.log(`📧 Sending quote request emails to ${companies.length} companies`);
          
          // Queue emails to all matching companies with subscription info
          for (const company of companies) {
            try {
              // Get company's subscription information
              const subscriptionSql = `
                SELECT us.*, mp.name as plan_name, mp.max_responses
                FROM user_subscriptions us
                JOIN membership_plans mp ON us.plan_id = mp.id
                WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
                ORDER BY us.end_date DESC
                LIMIT 1
              `;
              const [subscriptionRows] = await db.execute(subscriptionSql, [company.id]);
              
              // Get current month response count
              let currentResponses = 0;
              if (subscriptionRows.length > 0) {
                const currentMonth = new Date().toISOString().slice(0, 7);
                const responseCountSql = `
                  SELECT COUNT(*) as response_count
                  FROM quote_responses 
                  WHERE company_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
                `;
                const [responseCountRows] = await db.execute(responseCountSql, [company.id, currentMonth]);
                currentResponses = responseCountRows[0].response_count;
              }

              const companySubscription = subscriptionRows.length > 0 ? {
                planName: subscriptionRows[0].plan_name,
                maxResponses: subscriptionRows[0].max_responses,
                currentResponses
              } : {
                planName: 'No Active Plan',
                maxResponses: 0,
                currentResponses: 0
              };

              queueSubscriptionEmails.quoteRequestToCompany({
                ...quoteData,
                recipientEmail: company.email,
                companyId: company.id,
                companyName: company.name,
                companySubscription
              }).then(jobId => {
                console.log(`✅ Quote request company email queued for ${company.name} (Job ID: ${jobId})`);
              }).catch(error => {
                console.error(`❌ Failed to queue quote request company email for ${company.name}:`, error);
              });
            } catch (subscriptionError) {
              console.error(`❌ Error fetching subscription for ${company.name}:`, subscriptionError);
              // Send email without subscription info as fallback
              queueSubscriptionEmails.quoteRequestToCompany({
                ...quoteData,
                recipientEmail: company.email,
                companyId: company.id,
                companyName: company.name,
                companySubscription: { planName: 'Unknown', maxResponses: 0, currentResponses: 0 }
              });
            }
          }

        } catch (emailError) {
          console.error('❌ Error processing quote request emails:', emailError);
          // Don't fail the quote submission if emails fail
        }

        // Send real-time notification for new quote request
        if (userId) {
            await realTimeNotificationService.notifyNewQuoteRequest({
                id: quoteId,
                user_id: userId,
                service_type: shippingMode,
                pickup_location: `${departureCity || departureState || departureCountry}`,
                delivery_location: `${arrivalCity || arrivalState || arrivalCountry}`,
                budget: null, // Budget might be set later
                created_at: new Date().toISOString()
            });
        }

        // If user is not logged in, return a message indicating they need to register/login
        if (!userId) {
            res.status(201).json({
                message: 'Quote request submitted successfully. Please register or login to track your quote status.',
                quoteId: quoteId,
                requiresAuth: true
            });
        } else {
            res.status(201).json({
                message: 'Quote request submitted successfully',
                quoteId: quoteId,
                requiresAuth: false
            });
        }

    } catch (error) {
        console.error('Error submitting quote:', error);
        res.status(500).json({ message: 'Server error submitting quote' });
    }
};

// @desc    Get all quotes (Admin)
// @route   GET /api/quotes/all
// @access  Private/Admin
const getAllQuotes = async (req, res) => {
    try {
        const sql = `
            SELECT q.*, u.name as user_name, u.email as user_email 
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            ORDER BY q.created_at DESC
        `;
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ message: 'Server error fetching quotes' });
    }
};

// @desc    Get user's quotes
// @route   GET /api/quotes/my-quotes
// @access  Private
const getMyQuotes = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT q.*, 
                   COUNT(qr.id) as response_count,
                   MIN(qr.price) as lowest_price
            FROM quotes q 
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id 
            WHERE q.user_id = ? 
            GROUP BY q.id 
            ORDER BY q.created_at DESC
        `;
        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching user quotes:', error);
        res.status(500).json({ message: 'Server error fetching quotes' });
    }
};

// @desc    Get quotes by status (Admin)
// @route   GET /api/quotes/status/:status
// @access  Private/Admin
const getQuotesByStatus = async (req, res) => {
    const { status } = req.params;

    try {
        const sql = `
            SELECT q.*, u.name as user_name, u.email as user_email 
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status = ? 
            ORDER BY q.created_at DESC
        `;
        const [rows] = await db.execute(sql, [status]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching quotes by status:', error);
        res.status(500).json({ message: 'Server error fetching quotes' });
    }
};

// @desc    Get available quotes for members (based on subscription and location)
// @route   GET /api/quotes/available
// @access  Private/Company
const getAvailableQuotes = async (req, res) => {
    const userId = req.user.id;
    
    console.log(`🔍 [${new Date().toISOString()}] Fetching available quotes for company ${userId}`);

    try {
        // Get company's location information
        const companyLocationSql = `
            SELECT country, state, city, latitude, longitude 
            FROM users 
            WHERE id = ?
        `;
        const [companyLocationRows] = await db.execute(companyLocationSql, [userId]);
        
        if (companyLocationRows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }
        
        const companyLocation = companyLocationRows[0];

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

            // Check if user has reached response limit
            if (subscription.max_responses !== -1 && currentResponses >= subscription.max_responses) {
                canRespond = false;
            }
        }

        // Simplified quotes query - focus on company's country only
        let locationFilter = '';
        let locationParams = [];
        
        if (companyLocation.country) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [companyLocation.country, companyLocation.country];
        }

        const quotesSql = `
            SELECT q.*, 
                   COALESCE(u.name, q.contact_name) as user_name, 
                   COALESCE(u.email, q.contact_email) as user_email,
                   COALESCE(u.phone, q.contact_phone) as user_phone,
                   u.country as user_country,
                   u.state as user_state,
                   u.city as user_city,
                   u.latitude as user_latitude,
                   u.longitude as user_longitude,
                   CASE 
                       WHEN (q.departure_country = ? AND q.arrival_country = ?) THEN 5
                       WHEN (q.departure_country = ? OR q.arrival_country = ?) THEN 4
                       ELSE 1
                   END as location_priority
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status IN ('pending', 'approved')
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            AND q.id NOT IN (
                SELECT DISTINCT uqs.quote_id 
                FROM user_quote_status uqs 
                WHERE uqs.status = 'accepted'
            )
            AND q.id NOT IN (
                SELECT DISTINCT uqs2.quote_id
                FROM user_quote_status uqs2
                INNER JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                WHERE pp.id IS NOT NULL
            )
            AND q.id NOT IN (
                SELECT DISTINCT uqs3.quote_id
                FROM user_quote_status uqs3
                INNER JOIN payment_proofs pp2 ON uqs3.payment_proof_id = pp2.id
                INNER JOIN payment_verifications pv ON pp2.id = pv.payment_proof_id
                WHERE pv.verification_status = 'verified'
            )
            ${locationFilter}
            ORDER BY location_priority DESC, q.created_at DESC
        `;

        // Parameters for the query
        const finalParams = [
            companyLocation.country || '', companyLocation.country || '', // both departure and arrival same country
            companyLocation.country || '', companyLocation.country || '', // either departure or arrival same country
            userId, userId, // user exclusion and response check
            ...locationParams
        ];

        const [quotes] = await db.execute(quotesSql, finalParams);
        
        console.log(`📊 Found ${quotes.length} available quotes for company ${userId} (AFTER FILTERING)`);
        console.log(`📋 Quote IDs: ${quotes.map(q => q.id).join(', ')}`);
        
        // Debug: Verify filtering is working correctly
        if (quotes.length > 0) {
            console.log('🔍 Verifying quote filtering is working:');
            for (const quote of quotes.slice(0, 3)) { // Check first 3 quotes
                const [acceptedCheck] = await db.execute(
                    'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                    [quote.id]
                );
                const [paymentCheck] = await db.execute(
                    `SELECT COUNT(*) as count FROM user_quote_status uqs 
                     JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id 
                     WHERE uqs.quote_id = ?`,
                    [quote.id]
                );
                const [verifiedCheck] = await db.execute(
                    `SELECT COUNT(*) as count FROM user_quote_status uqs
                     JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                     JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                     WHERE uqs.quote_id = ? AND pv.verification_status = 'verified'`,
                    [quote.id]
                );
                
                console.log(`  Quote ${quote.id}: accepted=${acceptedCheck[0].count}, payment_proofs=${paymentCheck[0].count}, verified=${verifiedCheck[0].count}`);
                
                // These should all be 0 now
                if (acceptedCheck[0].count > 0 || paymentCheck[0].count > 0 || verifiedCheck[0].count > 0) {
                    console.log(`  ⚠️  WARNING: Quote ${quote.id} should have been filtered but wasn't!`);
                }
            }
        }
        // Add response count and check if already responded for each quote
        const quotesWithResponseCount = await Promise.all(
            quotes.map(async (quote) => {
                const [responseRows] = await db.execute(
                    'SELECT COUNT(*) as response_count FROM quote_responses WHERE quote_id = ?',
                    [quote.id]
                );
                
                // Check if this company has already responded
                const [alreadyRespondedRows] = await db.execute(
                    'SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?',
                    [quote.id, userId]
                );
                
                // Determine if user can see contact information
                const canSeeContactInfo = hasActiveSubscription && 
                    (subscription.max_responses === -1 || currentResponses < subscription.max_responses);
                
                // Hide contact information for basic plans or exhausted users at SERVER LEVEL
                const processedQuote = {
                    ...quote,
                    response_count: responseRows[0].response_count,
                    already_responded: alreadyRespondedRows.length > 0,
                    is_local_match: quote.location_priority >= 4, // Same country match or better
                    distance_km: quote.user_latitude && quote.user_longitude && companyLocation.latitude && companyLocation.longitude
                        ? calculateDistance(
                            companyLocation.latitude, companyLocation.longitude,
                            quote.user_latitude, quote.user_longitude
                          ).toFixed(1)
                        : null,
                    // Add flag to indicate if contact info should be visible (for frontend use)
                    canSeeContactInfo: canSeeContactInfo
                };

                // SECURITY: Hide actual contact information at server level for restricted users
                if (!canSeeContactInfo) {
                    // Replace with generic placeholder data that frontend can blur
                    processedQuote.user_name = 'Customer Name';
                    processedQuote.user_email = 'customer@email.com';
                    processedQuote.user_phone = '+XXX XXX XXXX';
                    processedQuote.user_country = null;
                    processedQuote.user_state = null;
                    processedQuote.user_city = null;
                    processedQuote.contact_name = 'Customer Name';
                    processedQuote.contact_email = 'customer@email.com';
                    processedQuote.contact_phone = '+XXX XXX XXXX';
                }

                return processedQuote;
            })
        );

        res.status(200).json({
            quotes: quotesWithResponseCount,
            hasActiveSubscription,
            canRespond,
            companyLocation,
            totalQuotes: quotesWithResponseCount.length,
            localQuotes: quotesWithResponseCount.filter(q => q.is_local_match).length,
            subscription: hasActiveSubscription ? {
                planName: subscription.plan_name,
                maxResponses: subscription.max_responses,
                currentResponses,
                remainingResponses: subscription.max_responses === -1 ? 'Unlimited' : subscription.max_responses - currentResponses,
                canSeeContactInfo: subscription.max_responses === -1 || currentResponses < subscription.max_responses
            } : {
                planName: 'Basic Plan',
                maxResponses: 0,
                currentResponses: 0,
                remainingResponses: 0,
                canSeeContactInfo: false
            }
        });

    } catch (error) {
        console.error('Error fetching available quotes:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            message: 'Server error fetching quotes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


// @desc    Update quote status (Admin)
// @route   PUT /api/quotes/:id/status
// @access  Private/Admin
const updateQuoteStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'running', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        await db.execute('UPDATE quotes SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: 'Quote status updated successfully' });
    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ message: 'Server error updating quote status' });
    }
};

export {
    submitQuote,
    getAllQuotes,
    getMyQuotes,
    getAvailableQuotes,
    getQuotesByStatus,
    updateQuoteStatus
};