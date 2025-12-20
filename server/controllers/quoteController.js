// controllers/quoteController.js
import db from '../config/db.js';

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

        // If user is not logged in, return a message indicating they need to register/login
        if (!userId) {
            res.status(201).json({
                message: 'Quote request submitted successfully. Please register or login to track your quote status.',
                quoteId: result.insertId,
                requiresAuth: true
            });
        } else {
            res.status(201).json({
                message: 'Quote request submitted successfully',
                quoteId: result.insertId,
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

// @desc    Get available quotes for members (based on subscription)
// @route   GET /api/quotes/available
// @access  Private/Company
const getAvailableQuotes = async (req, res) => {
    const userId = req.user.id;

    try {
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

        // Get quotes that user hasn't responded to yet
        const quotesSql = `
            SELECT q.*, 
                   COALESCE(u.name, q.contact_name) as user_name, 
                   COALESCE(u.email, q.contact_email) as user_email,
                   q.contact_phone as user_phone
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status = 'pending' 
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            ORDER BY q.created_at DESC
        `;

        const [quotes] = await db.execute(quotesSql, [userId, userId]);

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
                
                return {
                    ...quote,
                    response_count: responseRows[0].response_count,
                    already_responded: alreadyRespondedRows.length > 0
                };
            })
        );

        res.status(200).json({
            quotes: quotesWithResponseCount,
            hasActiveSubscription,
            canRespond,
            subscription: hasActiveSubscription ? {
                planName: subscription.plan_name,
                maxResponses: subscription.max_responses,
                currentResponses,
                remainingResponses: subscription.max_responses === -1 ? 'Unlimited' : subscription.max_responses - currentResponses
            } : null
        });

    } catch (error) {
        console.error('Error fetching available quotes:', error);
        res.status(500).json({ 
            message: 'Server error fetching quotes'
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