// controllers/quoteResponseController.js
import db from '../config/db.js';
import { sendQuoteResponseNotification } from '../services/emailService.js';

// @desc    Submit quote response (Company responds to a quote)
// @route   POST /api/quote-responses/submit
// @access  Private/Company
const submitQuoteResponse = async (req, res) => {
    const companyId = req.user.id;
    const {
        quoteId, price, transitTime, inclusions, valueAddedServices, 
        validUntil, terms, notes
    } = req.body;

    if (!quoteId || !price || !transitTime) {
        return res.status(400).json({ message: 'Quote ID, price, and transit time are required' });
    }

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

        const [subscriptionRows] = await db.execute(subscriptionSql, [companyId]);
        
        if (subscriptionRows.length === 0) {
            return res.status(403).json({ 
                message: 'Active subscription required to respond to quotes',
                requiresSubscription: true 
            });
        }

        const subscription = subscriptionRows[0];

        // Check how many responses user has made this month
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const responseCountSql = `
            SELECT COUNT(*) as response_count
            FROM quote_responses 
            WHERE company_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
        `;

        const [responseCountRows] = await db.execute(responseCountSql, [companyId, currentMonth]);
        const currentResponses = responseCountRows[0].response_count;

        // Check if user has reached response limit
        if (subscription.max_responses !== -1 && currentResponses >= subscription.max_responses) {
            return res.status(403).json({ 
                message: `Monthly response limit reached (${subscription.max_responses})`,
                currentResponses,
                maxResponses: subscription.max_responses
            });
        }

        // Check if quote exists and is still open
        const [quoteRows] = await db.execute(
            'SELECT id, status FROM quotes WHERE id = ?', 
            [quoteId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }

        if (quoteRows[0].status !== 'pending' && quoteRows[0].status !== 'approved') {
            return res.status(400).json({ message: 'Quote is no longer accepting responses' });
        }

        // Check if company already responded to this quote
        const [existingResponse] = await db.execute(
            'SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?',
            [quoteId, companyId]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this quote' });
        }

        const sql = `
            INSERT INTO quote_responses (
                quote_id, company_id, price, transit_time, inclusions, 
                value_added_services, valid_until, terms, notes, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const values = [
            quoteId, companyId, price, transitTime, inclusions,
            valueAddedServices, validUntil, terms, notes
        ];

        const [result] = await db.execute(sql, values);

        // Send email notification to quote owner if they are a registered user
        const [quoteDetails] = await db.execute(`
            SELECT q.*, u.name as user_name, u.email as user_email, c.name as company_name
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            JOIN users c ON c.id = ?
            WHERE q.id = ?
        `, [companyId, quoteId]);

        if (quoteDetails.length > 0 && quoteDetails[0].user_email) {
            // Send email notification
            await sendQuoteResponseNotification(
                quoteDetails[0].user_email,
                quoteDetails[0].user_name,
                quoteDetails[0].company_name,
                quoteId,
                price,
                transitTime
            );

            // Create a message for the user if they are registered
            if (quoteDetails[0].user_id) {
                const messageText = `We have submitted a quote response for your request (Quote #${quoteId}).

Price: $${price}
Transit Time: ${transitTime}
${inclusions ? `Inclusions: ${inclusions}` : ''}
${terms ? `Terms: ${terms}` : ''}
${notes ? `Notes: ${notes}` : ''}

Please review our offer and let us know if you have any questions.`;

                await db.execute(`
                    INSERT INTO messages (sender_id, receiver_id, subject, message, quote_id, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [
                    companyId,
                    quoteDetails[0].user_id,
                    `Quote Response - Quote #${quoteId}`,
                    messageText,
                    quoteId
                ]);
            }
        }

        res.status(201).json({
            message: 'Quote response submitted successfully',
            responseId: result.insertId
        });

    } catch (error) {
        console.error('Error submitting quote response:', error);
        res.status(500).json({ message: 'Server error submitting quote response' });
    }
};

// @desc    Get responses for a specific quote
// @route   GET /api/quote-responses/quote/:quoteId
// @access  Private (Quote owner or Admin)
const getQuoteResponses = async (req, res) => {
    const { quoteId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Check if user owns the quote or is admin
        if (userRole !== 'admin') {
            const [quoteRows] = await db.execute(
                'SELECT user_id FROM quotes WHERE id = ?', 
                [quoteId]
            );

            if (quoteRows.length === 0 || quoteRows[0].user_id !== userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const sql = `
            SELECT qr.*, u.name as company_name, u.email as company_email, u.logo as company_logo
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = ?
            ORDER BY qr.price ASC
        `;

        const [rows] = await db.execute(sql, [quoteId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching quote responses:', error);
        res.status(500).json({ message: 'Server error fetching quote responses' });
    }
};

// @desc    Get company's quote responses
// @route   GET /api/quote-responses/my-responses
// @access  Private/Company
const getMyQuoteResponses = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT qr.*, q.product_description, q.departure_country, q.arrival_country,
                   q.shipping_mode, q.arrival_date, u.name as user_name
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching company quote responses:', error);
        res.status(500).json({ message: 'Server error fetching quote responses' });
    }
};

// @desc    Accept/Reject quote response (User action)
// @route   PUT /api/quote-responses/:id/status
// @access  Private (Quote owner)
const updateResponseStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // Check if user owns the quote
        const [responseRows] = await db.execute(`
            SELECT qr.id, q.user_id 
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            WHERE qr.id = ?
        `, [id]);

        if (responseRows.length === 0) {
            return res.status(404).json({ message: 'Quote response not found' });
        }

        if (responseRows[0].user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await db.execute(
            'UPDATE quote_responses SET status = ? WHERE id = ?', 
            [status, id]
        );

        res.status(200).json({ message: `Quote response ${status} successfully` });

    } catch (error) {
        console.error('Error updating response status:', error);
        res.status(500).json({ message: 'Server error updating response status' });
    }
};

export {
    submitQuoteResponse,
    getQuoteResponses,
    getMyQuoteResponses,
    updateResponseStatus
};