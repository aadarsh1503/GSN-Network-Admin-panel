// controllers/userQuoteController.js
import db from '../config/db.js';
import { 
    sendQuoteResponseNotification, 
    sendQuoteAcceptanceNotification, 
    sendQuoteRejectionNotification,
    sendStatusUpdateNotification,
    sendUserAcceptanceThankYou
} from '../services/emailService.js';
import {
    sendQuoteAcceptanceNotificationToCompany,
    sendQuoteRejectionNotificationToCompany,
    sendStatusUpdateNotificationToUser
} from '../services/notificationService.js';
import {
    sendQuoteAcceptanceMessage,
    sendQuoteRejectionMessage,
    sendStatusUpdateMessage
} from '../services/messageService.js';

// @desc    Get user's quotes with responses
// @route   GET /api/user-quotes/my-quotes
// @access  Private/User
const getUserQuotes = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT q.*, 
                   COUNT(qr.id) as response_count,
                   MIN(qr.price) as lowest_price,
                   MAX(qr.price) as highest_price
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

// @desc    Get quote responses for a specific quote
// @route   GET /api/user-quotes/:quoteId/responses
// @access  Private/User
const getQuoteResponses = async (req, res) => {
    const { quoteId } = req.params;
    const userId = req.user.id;

    try {
        // First verify the quote belongs to the user
        const [quoteRows] = await db.execute(
            'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
            [quoteId, userId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Get all responses for this quote with company details
        const sql = `
            SELECT qr.*, 
                   u.name as company_name, 
                   u.email as company_email,
                   u.phone as company_phone,
                   u.logo as company_logo,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `;

        const [responses] = await db.execute(sql, [userId, quoteId]);
        res.status(200).json(responses);

    } catch (error) {
        console.error('Error fetching quote responses:', error);
        res.status(500).json({ message: 'Server error fetching quote responses' });
    }
};

// @desc    Accept a quote response
// @route   POST /api/user-quotes/accept-response
// @access  Private/User
const acceptQuoteResponse = async (req, res) => {
    const { quoteId, quoteResponseId, companyId } = req.body;
    const userId = req.user.id;

    if (!quoteId || !quoteResponseId || !companyId) {
        return res.status(400).json({ message: 'Quote ID, Response ID, and Company ID are required' });
    }

    try {
        // Verify the quote belongs to the user
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND user_id = ?',
            [quoteId, userId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Check if user has already accepted any response for this quote
        const [acceptedResponses] = await db.execute(
            'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted"',
            [quoteId, userId]
        );

        if (acceptedResponses.length > 0) {
            return res.status(400).json({ 
                message: 'You have already accepted a quote for this request. Cannot accept multiple quotes.' 
            });
        }

        // Check if user has already responded to this specific quote response
        const [existingResponse] = await db.execute(
            'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?',
            [quoteId, userId, quoteResponseId]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this quote' });
        }

        // Insert acceptance record
        await db.execute(
            `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, accepted_at) 
             VALUES (?, ?, ?, ?, 'accepted', NOW())`,
            [quoteId, userId, companyId, quoteResponseId]
        );

        // Update quote status to 'running'
        await db.execute(
            'UPDATE quotes SET status = ? WHERE id = ?',
            ['running', quoteId]
        );

        // Update quote response status to 'accepted'
        await db.execute(
            'UPDATE quote_responses SET status = ? WHERE id = ?',
            ['accepted', quoteResponseId]
        );

        // Get company and user details for email notification
        const [companyDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [companyId]
        );

        const [userDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [userId]
        );

        // Send email notifications
        if (companyDetails.length > 0 && userDetails.length > 0) {
            try {
                // Send acceptance notification to company
                await sendQuoteAcceptanceNotification(
                    companyDetails[0].email,
                    companyDetails[0].name,
                    userDetails[0].name,
                    quoteId
                );

                // Send thank you email to user with company details
                const [companyFullDetails] = await db.execute(
                    'SELECT name, email, phone FROM users WHERE id = ?',
                    [companyId]
                );

                if (companyFullDetails.length > 0) {
                    await sendUserAcceptanceThankYou(
                        userDetails[0].email,
                        userDetails[0].name,
                        quoteId,
                        companyFullDetails[0].name,
                        companyFullDetails[0].email,
                        companyFullDetails[0].phone
                    );
                }

                // Send status update to user
                await sendStatusUpdateNotification(
                    userDetails[0].email,
                    userDetails[0].name,
                    quoteId,
                    'running'
                );
            } catch (emailError) {
                console.error('Error sending email notifications:', emailError);
                // Don't fail the whole operation if email fails
            }
        }

        // Send in-app notifications
        try {
            if (companyDetails.length > 0 && userDetails.length > 0) {
                // Notify company about acceptance
                await sendQuoteAcceptanceNotificationToCompany(
                    companyId,
                    userDetails[0].name,
                    quoteId
                );

                // Notify user about status update
                await sendStatusUpdateNotificationToUser(
                    userId,
                    quoteId,
                    'running'
                );
            }
        } catch (notificationError) {
            console.error('Error sending in-app notifications:', notificationError);
            // Don't fail the whole operation if notification fails
        }

        // Send messages to chat
        try {
            if (companyDetails.length > 0 && userDetails.length > 0) {
                // Send message to company
                await sendQuoteAcceptanceMessage(
                    companyId,
                    userDetails[0].name,
                    quoteId
                );

                // Send status update message to user
                await sendStatusUpdateMessage(
                    userId,
                    quoteId,
                    'running'
                );
            }
        } catch (messageError) {
            console.error('Error sending messages:', messageError);
            // Don't fail the whole operation if message fails
        }

        res.status(200).json({ message: 'Quote response accepted successfully' });

    } catch (error) {
        console.error('Error accepting quote response:', error);
        res.status(500).json({ message: 'Server error accepting quote response' });
    }
};

// @desc    Reject a quote response
// @route   POST /api/user-quotes/reject-response
// @access  Private/User
const rejectQuoteResponse = async (req, res) => {
    const { quoteId, quoteResponseId, companyId } = req.body;
    const userId = req.user.id;

    if (!quoteId || !quoteResponseId || !companyId) {
        return res.status(400).json({ message: 'Quote ID, Response ID, and Company ID are required' });
    }

    try {
        // Verify the quote belongs to the user
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND user_id = ?',
            [quoteId, userId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Check if user has already accepted any response for this quote
        const [acceptedResponses] = await db.execute(
            'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted"',
            [quoteId, userId]
        );

        if (acceptedResponses.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot reject responses after accepting an offer' 
            });
        }

        // Check if user has already responded to this specific quote response
        const [existingResponse] = await db.execute(
            'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?',
            [quoteId, userId, quoteResponseId]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this quote' });
        }

        // Update quote response status to 'rejected'
        await db.execute(
            'UPDATE quote_responses SET status = ? WHERE id = ?',
            ['rejected', quoteResponseId]
        );

        // Insert rejection record
        await db.execute(
            `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, status, rejected_at) 
             VALUES (?, ?, ?, ?, 'rejected', NOW())`,
            [quoteId, userId, companyId, quoteResponseId]
        );

        // Get company and user details for email notification
        const [companyDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [companyId]
        );

        const [userDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [userId]
        );

        // Send email notification to company
        if (companyDetails.length > 0 && userDetails.length > 0) {
            try {
                await sendQuoteRejectionNotification(
                    companyDetails[0].email,
                    companyDetails[0].name,
                    userDetails[0].name,
                    quoteId
                );
            } catch (emailError) {
                console.error('Error sending email notifications:', emailError);
                // Don't fail the whole operation if email fails
            }
        }

        // Send in-app notification to company
        try {
            if (companyDetails.length > 0 && userDetails.length > 0) {
                await sendQuoteRejectionNotificationToCompany(
                    companyId,
                    userDetails[0].name,
                    quoteId
                );
            }
        } catch (notificationError) {
            console.error('Error sending in-app notification:', notificationError);
            // Don't fail the whole operation if notification fails
        }

        // Send message to company chat
        try {
            if (companyDetails.length > 0 && userDetails.length > 0) {
                await sendQuoteRejectionMessage(
                    companyId,
                    userDetails[0].name,
                    quoteId
                );
            }
        } catch (messageError) {
            console.error('Error sending rejection message:', messageError);
            // Don't fail the whole operation if message fails
        }

        res.status(200).json({ message: 'Quote response rejected successfully' });

    } catch (error) {
        console.error('Error rejecting quote response:', error);
        res.status(500).json({ message: 'Server error rejecting quote response' });
    }
};

// @desc    Get user notifications
// @route   GET /api/user-quotes/notifications
// @access  Private/User
const getUserNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT un.*, n.title, n.message, n.image_url, n.created_at
            FROM user_notifications un
            JOIN notifications n ON un.notification_id = n.id
            WHERE un.user_id = ? AND (n.target_audience = 'all' OR n.target_audience = 'users')
            ORDER BY n.created_at DESC
            LIMIT 50
        `;

        const [notifications] = await db.execute(sql, [userId]);
        res.status(200).json(notifications);

    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/user-quotes/notifications/:id/read
// @access  Private/User
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error updating notification' });
    }
};

// @desc    Update quote status (User can change their own quote status)
// @route   PUT /api/user-quotes/:quoteId/status
// @access  Private/User
const updateQuoteStatus = async (req, res) => {
    const { quoteId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['pending', 'running', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Valid statuses: pending, running, closed' });
    }

    try {
        // Verify the quote belongs to the user
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND user_id = ?',
            [quoteId, userId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Update quote status
        await db.execute(
            'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, quoteId]
        );

        // Send status update notification
        const [userDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [userId]
        );

        if (userDetails.length > 0) {
            await sendStatusUpdateNotification(
                userDetails[0].email,
                userDetails[0].name,
                quoteId,
                status
            );
        }

        res.status(200).json({ message: 'Quote status updated successfully' });

    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ message: 'Server error updating quote status' });
    }
};

// @desc    Get quote status with user responses
// @route   GET /api/user-quotes/:quoteId/status
// @access  Private/User
const getQuoteStatus = async (req, res) => {
    const { quoteId } = req.params;
    const userId = req.user.id;

    try {
        // Verify the quote belongs to the user
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND user_id = ?',
            [quoteId, userId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Get user responses for this quote
        const [userResponses] = await db.execute(
            `SELECT uqs.*, qr.company_id, u.name as company_name
             FROM user_quote_status uqs
             JOIN quote_responses qr ON uqs.quote_response_id = qr.id
             JOIN users u ON qr.company_id = u.id
             WHERE uqs.quote_id = ? AND uqs.user_id = ?`,
            [quoteId, userId]
        );

        res.status(200).json({
            quote: quoteRows[0],
            userResponses: userResponses
        });

    } catch (error) {
        console.error('Error fetching quote status:', error);
        res.status(500).json({ message: 'Server error fetching quote status' });
    }
};

// @desc    Get user dashboard stats
// @route   GET /api/user-quotes/dashboard-stats
// @access  Private/User
const getUserDashboardStats = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get quote statistics
        const [quoteStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_quotes,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_quotes,
                SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_quotes,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as completed_quotes
            FROM quotes 
            WHERE user_id = ?
        `, [userId]);

        // Get response statistics
        const [responseStats] = await db.execute(`
            SELECT COUNT(*) as total_responses
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            WHERE q.user_id = ?
        `, [userId]);

        // Get unread messages count
        const [messageStats] = await db.execute(`
            SELECT COUNT(*) as unread_messages
            FROM messages 
            WHERE receiver_id = ? AND is_read = 0
        `, [userId]);

        // Get unread notifications count
        const [notificationStats] = await db.execute(`
            SELECT COUNT(*) as unread_notifications
            FROM user_notifications 
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        res.status(200).json({
            quotes: quoteStats[0],
            responses: responseStats[0],
            messages: messageStats[0],
            notifications: notificationStats[0]
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

export {
    getUserQuotes,
    getQuoteResponses,
    acceptQuoteResponse,
    rejectQuoteResponse,
    getUserNotifications,
    markNotificationAsRead,
    updateQuoteStatus,
    getQuoteStatus,
    getUserDashboardStats
};