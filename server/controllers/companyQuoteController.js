// controllers/companyQuoteController.js
import db from '../config/db.js';
import { sendStatusUpdateNotification } from '../services/emailService.js';

// @desc    Get company's quote responses
// @route   GET /api/company-quotes/my-responses
// @access  Private/Company
const getMyQuoteResponses = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT qr.*, q.product_description, q.departure_country, q.arrival_country,
                   q.shipping_mode, q.arrival_date, q.status as quote_status,
                   u.name as user_name, u.email as user_email,
                   uqs.status as user_response_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = q.user_id)
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

// @desc    Update quote response status (Company can update their response status)
// @route   PUT /api/company-quotes/response/:responseId/status
// @access  Private/Company
const updateResponseStatus = async (req, res) => {
    const { responseId } = req.params;
    const { status } = req.body;
    const companyId = req.user.id;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Valid statuses: pending, in_progress, completed, cancelled' });
    }

    try {
        // Verify the response belongs to the company
        const [responseRows] = await db.execute(`
            SELECT qr.*, q.user_id, u.name as user_name, u.email as user_email
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.id = ? AND qr.company_id = ?
        `, [responseId, companyId]);

        if (responseRows.length === 0) {
            return res.status(404).json({ message: 'Quote response not found or access denied' });
        }

        const response = responseRows[0];

        // Update response status
        await db.execute(
            'UPDATE quote_responses SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, responseId]
        );

        // Create a message for the user if they are registered
        if (response.user_id) {
            const [companyDetails] = await db.execute(
                'SELECT name FROM users WHERE id = ?',
                [companyId]
            );

            const messageText = `Status update for your quote response (Quote #${response.quote_id}):

Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}

We will keep you updated on the progress.`;

            await db.execute(`
                INSERT INTO messages (sender_id, receiver_id, subject, message, quote_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                companyId,
                response.user_id,
                `Status Update - Quote #${response.quote_id}`,
                messageText,
                response.quote_id
            ]);

            // Send email notification
            if (response.user_email) {
                await sendStatusUpdateNotification(
                    response.user_email,
                    response.user_name,
                    response.quote_id,
                    status
                );
            }
        }

        res.status(200).json({ message: 'Response status updated successfully' });

    } catch (error) {
        console.error('Error updating response status:', error);
        res.status(500).json({ message: 'Server error updating response status' });
    }
};

// @desc    Update quote status (Company can update quote status for quotes they responded to)
// @route   PUT /api/company-quotes/quote/:quoteId/status
// @access  Private/Company
const updateQuoteStatus = async (req, res) => {
    const { quoteId } = req.params;
    const { status } = req.body;
    const companyId = req.user.id;

    const validStatuses = ['pending', 'running', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Valid statuses: pending, running, closed' });
    }

    try {
        // Verify the company has responded to this quote
        const [responseRows] = await db.execute(`
            SELECT qr.id, q.user_id, u.name as user_name, u.email as user_email, q.status as current_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ? AND qr.company_id = ?
        `, [quoteId, companyId]);

        if (responseRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or you have not responded to this quote' });
        }

        const quoteInfo = responseRows[0];

        // Update quote status
        await db.execute(
            'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, quoteId]
        );

        // Get company details
        const [companyDetails] = await db.execute(
            'SELECT name, email, phone FROM users WHERE id = ?',
            [companyId]
        );

        // Send message to user if they are registered
        if (quoteInfo.user_id && companyDetails.length > 0) {
            const company = companyDetails[0];
            const messageText = `Your quote #${quoteId} status has been updated by ${company.name}.

New Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

Company Details:
- Name: ${company.name}
- Email: ${company.email}
${company.phone ? `- Phone: ${company.phone}` : ''}

We will contact you shortly for further details.`;

            await db.execute(`
                INSERT INTO messages (sender_id, receiver_id, subject, message, quote_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                companyId,
                quoteInfo.user_id,
                `Quote Status Updated - Quote #${quoteId}`,
                messageText,
                quoteId
            ]);

            // Send email notification to user
            if (quoteInfo.user_email) {
                await sendStatusUpdateNotification(
                    quoteInfo.user_email,
                    quoteInfo.user_name,
                    quoteId,
                    status
                );
            }
        }

        res.status(200).json({ message: 'Quote status updated successfully' });

    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ message: 'Server error updating quote status' });
    }
};

// @desc    Get quotes where company's responses have been accepted
// @route   GET /api/company-quotes/accepted-quotes
// @access  Private/Company
const getAcceptedQuotes = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT q.*, 
                   qr.price, qr.transit_time, qr.created_at as response_date,
                   uqs.accepted_at, uqs.status as user_response_status,
                   u.name as user_name, u.email as user_email, u.phone as user_phone,
                   COUNT(qr2.id) as total_responses
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.status = 'accepted')
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
            WHERE qr.company_id = ?
            GROUP BY q.id, qr.id, uqs.id
            ORDER BY uqs.accepted_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching accepted quotes:', error);
        res.status(500).json({ message: 'Server error fetching accepted quotes' });
    }
};

export {
    getMyQuoteResponses,
    updateResponseStatus,
    updateQuoteStatus,
    getAcceptedQuotes
};