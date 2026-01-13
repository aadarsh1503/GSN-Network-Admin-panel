// controllers/businessController.js
import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import realTimeNotificationService from '../services/realTimeNotificationService.js';
import {
    sendQuoteResponseNotificationToUser
} from '../services/notificationService.js';
import {
    sendQuoteResponseMessage
} from '../services/messageService.js';

// @desc    Get business profile
// @route   GET /api/business/profile
// @access  Private/Business
const getBusinessProfile = async (req, res) => {
    const businessId = req.user.id;

    try {
        const [rows] = await db.execute(
            `SELECT id, name, email, phone, role, category, country, state, city,
                    owner_name, owner_phone, incharge_name, incharge_phone,
                    skype, website, facebook, twitter, instagram, linkedin,
                    services, map_location, company_address, about_company,
                    logo, created_at, updated_at
             FROM users WHERE id = ? AND role = 'business'`,
            [businessId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Business profile not found' });
        }

        const business = rows[0];
        
        // Parse services if it's a JSON string
        if (business.services && typeof business.services === 'string') {
            try {
                business.services = JSON.parse(business.services);
            } catch (e) {
                business.services = [];
            }
        }

        res.status(200).json(business);
    } catch (error) {
        console.error('Error fetching business profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update business profile
// @route   PUT /api/business/profile
// @access  Private/Business
const updateBusinessProfile = async (req, res) => {
    const businessId = req.user.id;
    const {
        name, email, phone, category, country, state, city,
        owner_name, owner_phone, incharge_name, incharge_phone,
        skype, website, facebook, twitter, instagram, linkedin,
        services, map_location, company_address, about_company, logo
    } = req.body;

    try {
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        const [emailCheck] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, businessId]
        );

        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'Email is already taken by another user' });
        }

        // Convert services array to JSON string if needed
        let servicesString = services;
        if (Array.isArray(services)) {
            servicesString = JSON.stringify(services);
        }

        const sql = `
            UPDATE users SET
                name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                services = ?, map_location = ?, company_address = ?, about_company = ?, logo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND role = 'business'
        `;

        const values = [
            name, email, phone, category, country, state, city,
            owner_name, owner_phone, incharge_name, incharge_phone,
            skype, website, facebook, twitter, instagram, linkedin,
            servicesString, map_location, company_address, about_company, logo,
            businessId
        ];

        const [result] = await db.execute(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Business profile not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating business profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Change business password
// @route   PUT /api/business/change-password
// @access  Private/Business
const changeBusinessPassword = async (req, res) => {
    const businessId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    try {
        // Get current password
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [businessId]);
        const business = rows[0];

        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, business.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, businessId]);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error changing password' });
    }
};

// @desc    Get business dashboard statistics
// @route   GET /api/business/dashboard-stats
// @access  Private/Business
const getBusinessDashboardStats = async (req, res) => {
    const businessId = req.user.id;

    try {
        // Get quote response stats for this business
        const [responseStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_responses,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_responses,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_responses,
                AVG(price) as average_quote_price
            FROM quote_responses
            WHERE company_id = ?
        `, [businessId]);

        // Get available quotes count (quotes the business can respond to)
        const [businessLocation] = await db.execute(`
            SELECT country FROM users WHERE id = ?
        `, [businessId]);

        const businessCountry = businessLocation[0]?.country;

        let availableQuotesQuery;
        let queryParams;

        if (businessCountry) {
            availableQuotesQuery = `
                SELECT COUNT(*) as available_quotes
                FROM quotes q
                WHERE q.status IN ('pending', 'approved') 
                AND (q.departure_country = ? OR q.arrival_country = ?)
                AND q.id NOT IN (
                    SELECT quote_id FROM quote_responses WHERE company_id = ?
                )
                AND q.id NOT IN (
                    SELECT quote_id FROM user_quote_status WHERE status = 'accepted'
                )
            `;
            queryParams = [businessCountry, businessCountry, businessId];
        } else {
            availableQuotesQuery = `
                SELECT COUNT(*) as available_quotes
                FROM quotes q
                WHERE q.status IN ('pending', 'approved') 
                AND q.id NOT IN (
                    SELECT quote_id FROM quote_responses WHERE company_id = ?
                )
                AND q.id NOT IN (
                    SELECT quote_id FROM user_quote_status WHERE status = 'accepted'
                )
            `;
            queryParams = [businessId];
        }

        const [availableQuotes] = await db.execute(availableQuotesQuery, queryParams);

        // Get message stats
        const [messageStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_messages,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_messages
            FROM messages
            WHERE receiver_id = ?
        `, [businessId]);

        // Get notification stats
        const [notificationStats] = await db.execute(`
            SELECT COUNT(*) as unread_notifications
            FROM user_notifications 
            WHERE user_id = ? AND is_read = 0
        `, [businessId]);

        // Get dispute stats
        const [disputeStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_disputes,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_disputes,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_disputes
            FROM disputes
            WHERE company_id = ?
        `, [businessId]);

        // Get recent activity (last 30 days)
        const [recentActivity] = await db.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM quote_responses 
            WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `, [businessId]);

        res.status(200).json({
            responses: responseStats[0],
            availableQuotes: availableQuotes[0].available_quotes,
            messages: messageStats[0],
            notifications: notificationStats[0],
            disputes: disputeStats[0],
            recentActivity
        });

    } catch (error) {
        console.error('Error fetching business dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard statistics' });
    }
};

// @desc    Get available quotes for business to respond to
// @route   GET /api/business/quotes
// @access  Private/Business
const getBusinessQuotes = async (req, res) => {
    const businessId = req.user.id;
    const { status = 'all', limit = 50, offset = 0 } = req.query;

    try {
        // Get business location for filtering
        const [businessLocation] = await db.execute(`
            SELECT country, category FROM users WHERE id = ?
        `, [businessId]);

        const businessCountry = businessLocation[0]?.country;
        const businessCategory = businessLocation[0]?.category;

        let whereClause = `WHERE q.status IN ('pending', 'approved')`;
        let queryParams = [];

        // Filter by business location and category if available
        if (businessCountry) {
            whereClause += ` AND (q.departure_country = ? OR q.arrival_country = ?)`;
            queryParams.push(businessCountry, businessCountry);
        }

        // Optionally filter by business category (match with quote type)
        if (businessCategory) {
            // Map business category to quote type or skip this filter for now
            // whereClause += ` AND q.type = ?`;
            // queryParams.push(businessCategory);
        }

        // Exclude quotes already responded to by this business
        whereClause += ` AND q.id NOT IN (
            SELECT quote_id FROM quote_responses WHERE company_id = ?
        )`;
        queryParams.push(businessId);

        // Add status filter if specified
        if (status !== 'all') {
            whereClause += ` AND q.status = ?`;
            queryParams.push(status);
        }

        const sql = `
            SELECT q.*, 
                   u.name as user_name, 
                   u.email as user_email,
                   u.phone as user_phone,
                   COUNT(qr.id) as response_count,
                   MIN(qr.price) as lowest_price,
                   MAX(qr.price) as highest_price
            FROM quotes q 
            JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id 
            ${whereClause}
            GROUP BY q.id 
            ORDER BY q.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        console.log('Executing SQL:', sql);
        console.log('With params:', queryParams);
        const [rows] = await db.execute(sql, queryParams);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching business quotes:', error);
        res.status(500).json({ message: 'Server error fetching quotes' });
    }
};

// @desc    Get business's quote responses
// @route   GET /api/business/quotes/:quoteId/responses
// @access  Private/Business
const getBusinessQuoteResponses = async (req, res) => {
    const { quoteId } = req.params;
    const businessId = req.user.id;

    try {
        // Get business's responses for this quote
        const sql = `
            SELECT qr.*, 
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.departure_city,
                   q.arrival_city,
                   u.name as user_name,
                   u.email as user_email,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id)
            WHERE qr.quote_id = ? AND qr.company_id = ?
            ORDER BY qr.created_at DESC
        `;

        const [responses] = await db.execute(sql, [quoteId, businessId]);
        res.status(200).json(responses);

    } catch (error) {
        console.error('Error fetching quote responses:', error);
        res.status(500).json({ message: 'Server error fetching quote responses' });
    }
};

// @desc    Submit quote response
// @route   POST /api/business/quotes/:quoteId/respond
// @access  Private/Business
const submitQuoteResponse = async (req, res) => {
    const { quoteId } = req.params;
    const businessId = req.user.id;
    const { 
        price, 
        currency = 'USD', 
        transit_time, 
        notes, 
        terms_conditions,
        validity_period = 30 
    } = req.body;

    if (!price || !transit_time) {
        return res.status(400).json({ message: 'Price and transit time are required' });
    }

    try {
        // Check if quote exists and is available for responses
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND status IN ("pending", "approved")',
            [quoteId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or not available for responses' });
        }

        // Check if business already responded to this quote
        const [existingResponse] = await db.execute(
            'SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?',
            [quoteId, businessId]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this quote' });
        }

        // Insert quote response
        const sql = `
            INSERT INTO quote_responses (
                quote_id, company_id, price, currency, transit_time, 
                notes, terms_conditions, validity_period, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const [result] = await db.execute(sql, [
            quoteId, businessId, price, currency, transit_time,
            notes, terms_conditions, validity_period
        ]);

        // Get quote and business details for notifications
        const quote = quoteRows[0];
        const [businessDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [businessId]
        );

        const [userDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [quote.user_id]
        );

        // Send notifications
        if (businessDetails.length > 0 && userDetails.length > 0) {
            try {
                // Send in-app notification to user
                await sendQuoteResponseNotificationToUser(
                    quote.user_id,
                    businessDetails[0].name,
                    quoteId,
                    price,
                    transit_time
                );

                // Send message to user
                await sendQuoteResponseMessage(
                    quote.user_id,
                    businessDetails[0].name,
                    quoteId,
                    price,
                    transit_time
                );

                // Send real-time notification
                await realTimeNotificationService.notifyNewQuoteResponse(
                    quoteId,
                    businessId,
                    quote.user_id,
                    { price, transit_time }
                );
            } catch (notificationError) {
                console.error('Error sending notifications:', notificationError);
                // Don't fail the whole operation if notifications fail
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

// @desc    Update quote response
// @route   PUT /api/business/quote-responses/:responseId
// @access  Private/Business
const updateQuoteResponse = async (req, res) => {
    const { responseId } = req.params;
    const businessId = req.user.id;
    const { 
        price, 
        currency, 
        transit_time, 
        notes, 
        terms_conditions,
        validity_period 
    } = req.body;

    try {
        // Verify the response belongs to this business and is still pending
        const [responseRows] = await db.execute(
            'SELECT * FROM quote_responses WHERE id = ? AND company_id = ? AND status = "pending"',
            [responseId, businessId]
        );

        if (responseRows.length === 0) {
            return res.status(404).json({ message: 'Quote response not found or cannot be updated' });
        }

        const sql = `
            UPDATE quote_responses SET
                price = ?, currency = ?, transit_time = ?, notes = ?,
                terms_conditions = ?, validity_period = ?, updated_at = NOW()
            WHERE id = ? AND company_id = ?
        `;

        await db.execute(sql, [
            price, currency, transit_time, notes,
            terms_conditions, validity_period, responseId, businessId
        ]);

        res.status(200).json({ message: 'Quote response updated successfully' });

    } catch (error) {
        console.error('Error updating quote response:', error);
        res.status(500).json({ message: 'Server error updating quote response' });
    }
};

// @desc    Delete quote response
// @route   DELETE /api/business/quote-responses/:responseId
// @access  Private/Business
const deleteQuoteResponse = async (req, res) => {
    const { responseId } = req.params;
    const businessId = req.user.id;

    try {
        // Verify the response belongs to this business and is still pending
        const [result] = await db.execute(
            'DELETE FROM quote_responses WHERE id = ? AND company_id = ? AND status = "pending"',
            [responseId, businessId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quote response not found or cannot be deleted' });
        }

        res.status(200).json({ message: 'Quote response deleted successfully' });

    } catch (error) {
        console.error('Error deleting quote response:', error);
        res.status(500).json({ message: 'Server error deleting quote response' });
    }
};

// @desc    Get business notifications
// @route   GET /api/business/notifications
// @access  Private/Business
const getBusinessNotifications = async (req, res) => {
    const businessId = req.user.id;

    try {
        // Get regular notifications for businesses
        const sql = `
            SELECT 
                CONCAT('notification_', n.id) as id,
                'notification' as type,
                n.title,
                n.message,
                n.image,
                n.created_at,
                CASE 
                    WHEN un.is_read IS NOT NULL THEN un.is_read 
                    ELSE 0 
                END as is_read
            FROM notifications n
            LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
            WHERE n.target_audience IN ('all', 'businesses')
            ORDER BY n.created_at DESC
            LIMIT 50
        `;

        const [notifications] = await db.execute(sql, [businessId]);

        res.status(200).json(notifications);

    } catch (error) {
        console.error('Error fetching business notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// @desc    Mark business notification as read
// @route   PUT /api/business/notifications/:id/read
// @access  Private/Business
const markBusinessNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.id;

    try {
        if (id.startsWith('notification_')) {
            const notificationId = id.replace('notification_', '');
            
            await db.execute(`
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                VALUES (?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `, [businessId, notificationId]);
        }

        res.status(200).json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

// @desc    Get business messages
// @route   GET /api/business/messages
// @access  Private/Business
const getBusinessMessages = async (req, res) => {
    const businessId = req.user.id;

    try {
        const sql = `
            SELECT m.*, 
                   sender.name as sender_name, 
                   sender.email as sender_email, 
                   sender.logo as sender_logo,
                   receiver.name as receiver_name,
                   receiver.email as receiver_email,
                   receiver.logo as receiver_logo
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at DESC
            LIMIT 100
        `;

        const [messages] = await db.execute(sql, [businessId, businessId]);
        res.status(200).json(messages);

    } catch (error) {
        console.error('Error fetching business messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

// @desc    Send business message
// @route   POST /api/business/messages/send
// @access  Private/Business
const sendBusinessMessage = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, subject, message, quoteId } = req.body;

    if (!receiverId || !message) {
        return res.status(400).json({ message: 'Receiver and message are required' });
    }

    try {
        // Check if receiver exists
        const [receiverRows] = await db.execute(
            'SELECT id FROM users WHERE id = ?', 
            [receiverId]
        );

        if (receiverRows.length === 0) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        const sql = `
            INSERT INTO messages (
                sender_id, receiver_id, subject, message, quote_id, 
                is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, 0, NOW())
        `;

        const [result] = await db.execute(sql, [senderId, receiverId, subject || null, message, quoteId || null]);

        res.status(201).json({
            message: 'Message sent successfully',
            messageId: result.insertId
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

// @desc    Get business message conversations
// @route   GET /api/business/messages/conversations
// @access  Private/Business
const getBusinessConversations = async (req, res) => {
    const businessId = req.user.id;

    try {
        // First, let's get all messages for this business user
        const messagesQuery = `
            SELECT m.*, 
                   COALESCE(sender.name, 'Unknown User') as sender_name,
                   COALESCE(receiver.name, 'Unknown User') as receiver_name,
                   sender.logo as sender_logo,
                   receiver.logo as receiver_logo,
                   sender.role as sender_role,
                   receiver.role as receiver_role
            FROM messages m
            LEFT JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at DESC
        `;

        const [messages] = await db.execute(messagesQuery, [businessId, businessId]);

        if (messages.length === 0) {
            return res.status(200).json([]);
        }

        // Group messages by conversation partner
        const conversationMap = new Map();

        messages.forEach(message => {
            const otherUserId = message.sender_id === businessId ? message.receiver_id : message.sender_id;
            const otherUserRole = message.sender_id === businessId ? message.receiver_role : message.sender_role;
            const otherUserName = message.sender_id === businessId ? 
                (otherUserRole === 'admin' ? 'Admin Support' : (message.receiver_name || 'System')) : 
                (otherUserRole === 'admin' ? 'Admin Support' : (message.sender_name || 'System'));
            const otherUserLogo = message.sender_id === businessId ? message.receiver_logo : message.sender_logo;

            // Skip if otherUserId is null or the same as businessId (self-messages)
            if (!otherUserId || otherUserId === businessId) {
                return;
            }

            if (!conversationMap.has(otherUserId)) {
                conversationMap.set(otherUserId, {
                    other_user_id: otherUserId,
                    other_user_name: otherUserName,
                    other_user_logo: otherUserLogo,
                    other_user_role: otherUserRole,
                    last_message_time: message.created_at,
                    last_message: message.message,
                    unread_count: 0,
                    has_system_messages: 0
                });
            }

            const conversation = conversationMap.get(otherUserId);
            
            // Update with latest message if this one is newer
            if (new Date(message.created_at) > new Date(conversation.last_message_time)) {
                conversation.last_message_time = message.created_at;
                conversation.last_message = message.message;
            }

            // Count unread messages (messages sent TO the business user that are unread)
            if (message.receiver_id === businessId && message.is_read === 0) {
                conversation.unread_count++;
            }

            // Check for system messages
            if (message.subject && (message.subject.includes('Quote') || message.subject.includes('Status'))) {
                conversation.has_system_messages = 1;
            }
        });

        const conversations = Array.from(conversationMap.values());

        res.status(200).json(conversations);

    } catch (error) {
        console.error('Error fetching business conversations:', error);
        res.status(500).json({ message: 'Server error fetching conversations' });
    }
};

// @desc    Get business conversation messages
// @route   GET /api/business/messages/conversation/:userId
// @access  Private/Business
const getBusinessConversation = async (req, res) => {
    const businessId = req.user.id;
    const { userId } = req.params;

    try {
        const sql = `
            SELECT m.*, 
                   sender.name as sender_name, 
                   sender.email as sender_email, 
                   sender.logo as sender_logo,
                   sender.role as sender_role,
                   receiver.name as receiver_name,
                   receiver.role as receiver_role
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `;

        const [rows] = await db.execute(sql, [businessId, userId, userId, businessId]);
        
        // Enhance messages with proper sender display names
        const enhancedMessages = rows.map(msg => ({
            ...msg,
            sender_display_name: msg.sender_role === 'admin' ? 'Admin Support' : msg.sender_name,
            receiver_display_name: msg.receiver_role === 'admin' ? 'Admin Support' : msg.receiver_name
        }));
        
        res.status(200).json(enhancedMessages);

    } catch (error) {
        console.error('Error fetching business conversation:', error);
        res.status(500).json({ message: 'Server error fetching conversation' });
    }
};

// @desc    Mark business conversation as read
// @route   PUT /api/business/messages/conversation/:userId/read
// @access  Private/Business
const markBusinessConversationAsRead = async (req, res) => {
    const businessId = req.user.id;
    const { userId } = req.params;

    try {
        const sql = `
            UPDATE messages 
            SET is_read = 1 
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
        `;

        await db.execute(sql, [userId, businessId]);
        res.status(200).json({ message: 'Messages marked as read' });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error marking messages as read' });
    }
};

// @desc    Get business unread message count
// @route   GET /api/business/messages/unread-count
// @access  Private/Business
const getBusinessUnreadCount = async (req, res) => {
    const businessId = req.user.id;

    try {
        const sql = `
            SELECT COUNT(*) as unreadCount 
            FROM messages 
            WHERE receiver_id = ? AND is_read = 0
        `;

        const [result] = await db.execute(sql, [businessId]);
        res.status(200).json({ unreadCount: result[0].unreadCount });

    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error fetching unread count' });
    }
};

// @desc    Get business disputes
// @route   GET /api/business/disputes
// @access  Private/Business
const getBusinessDisputes = async (req, res) => {
    const businessId = req.user.id;

    try {
        const sql = `
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.admin_response,
                d.company_response,
                d.company_suggested_status,
                d.company_responded_at,
                d.company_requested_status,
                d.company_status_reason,
                d.company_status_requested_at,
                d.created_at,
                d.updated_at,
                d.resolved_at,
                u.name as user_name,
                u.email as user_email,
                dr.title as reason_title
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            WHERE d.company_id = ?
            ORDER BY d.created_at DESC
        `;
        
        const [disputes] = await db.execute(sql, [businessId]);

        // Get images for each dispute
        for (let dispute of disputes) {
            const imagesSql = `
                SELECT id, image_url, image_type, created_at
                FROM dispute_images 
                WHERE dispute_id = ?
                ORDER BY created_at ASC
            `;
            const [images] = await db.execute(imagesSql, [dispute.id]);
            dispute.images = images;
        }

        res.status(200).json(disputes);
    } catch (error) {
        console.error('Error fetching business disputes:', error);
        res.status(500).json({ message: 'Server error fetching disputes' });
    }
};

// @desc    Respond to dispute
// @route   POST /api/business/disputes/:id/respond
// @access  Private/Business
const respondToDispute = async (req, res) => {
    const { id } = req.params;
    const { response, suggested_status } = req.body;
    const businessId = req.user.id;

    if (!response || !response.trim()) {
        return res.status(400).json({ message: 'Response message is required' });
    }

    try {
        // Verify this dispute is against the business
        const [disputes] = await db.execute(
            'SELECT * FROM disputes WHERE id = ? AND company_id = ?',
            [id, businessId]
        );

        if (disputes.length === 0) {
            return res.status(404).json({ message: 'Dispute not found or not authorized' });
        }

        // Add business response to dispute
        const updateSql = `
            UPDATE disputes 
            SET company_response = ?, company_suggested_status = ?, company_responded_at = NOW()
            WHERE id = ?
        `;
        await db.execute(updateSql, [response, suggested_status, id]);

        res.status(200).json({ message: 'Response submitted successfully' });
    } catch (error) {
        console.error('Error submitting dispute response:', error);
        res.status(500).json({ message: 'Server error submitting response' });
    }
};

// @desc    Get business help information
// @route   GET /api/business/help
// @access  Private/Business
const getBusinessHelp = async (req, res) => {
    try {
        // Return help information for businesses
        const helpData = {
            faqs: [
                {
                    id: 1,
                    question: "How do I respond to quotes?",
                    answer: "Navigate to the Quotes section, find available quotes that match your services, and click 'Respond' to submit your pricing and terms."
                },
                {
                    id: 2,
                    question: "How are quotes matched to my business?",
                    answer: "Quotes are filtered based on your business location, category, and services. You'll see quotes relevant to your logistics capabilities."
                },
                {
                    id: 3,
                    question: "What happens after I submit a quote response?",
                    answer: "The quote requester will receive your response and can accept, reject, or request modifications. You'll be notified of their decision."
                },
                {
                    id: 4,
                    question: "How do I handle disputes?",
                    answer: "If a dispute is filed against your business, you'll receive a notification. You can respond with your explanation and suggested resolution."
                },
                {
                    id: 5,
                    question: "Can I update my quote responses?",
                    answer: "You can update pending quote responses before they are accepted or rejected by the quote requester."
                }
            ],
            contactInfo: {
                email: "business-support@gsn.com",
                phone: "+1-800-GSN-HELP",
                hours: "Monday - Friday, 9 AM - 6 PM EST"
            }
        };

        res.status(200).json(helpData);
    } catch (error) {
        console.error('Error fetching help information:', error);
        res.status(500).json({ message: 'Server error fetching help information' });
    }
};

// @desc    Submit business support ticket
// @route   POST /api/business/help/ticket
// @access  Private/Business
const submitBusinessTicket = async (req, res) => {
    const businessId = req.user.id;
    const { 
        subject, 
        message, 
        priority = 'medium', 
        category = 'general',
        recipient_type = 'admin',
        recipient_id = null
    } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (recipient_type === 'company' && !recipient_id) {
        return res.status(400).json({ message: 'Company selection is required when sending to company' });
    }

    try {
        // Get business user details for email notifications
        const [userRows] = await db.execute(
            'SELECT name, email, role FROM users WHERE id = ?',
            [businessId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Business user not found' });
        }

        const user = userRows[0];

        // Generate ticket number with recipient info
        const ticketPrefix = recipient_type === 'company' ? 'BSN-COMP' : 'BSN-ADMIN';
        const ticketNumber = `${ticketPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // For now, store recipient info in the subject until we add the columns
        const enhancedSubject = recipient_type === 'company' 
            ? `[TO COMPANY ID:${recipient_id}] ${subject}`
            : `[TO ADMIN] ${subject}`;

        // Prepare recipient name for email
        let recipientName = 'Admin Support';
        if (recipient_type === 'company' && recipient_id) {
            const [companyRows] = await db.execute(
                'SELECT name FROM users WHERE id = ? AND role = "company"',
                [recipient_id]
            );
            
            if (companyRows.length > 0) {
                recipientName = companyRows[0].name;
            } else {
                return res.status(404).json({ message: 'Company not found' });
            }
        }

        const sql = `
            INSERT INTO support_tickets (
                user_id, ticket_number, subject, description, priority, category, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const [result] = await db.execute(sql, [
            businessId, ticketNumber, enhancedSubject, message, priority, category
        ]);

        // 📧 SEND EMAIL NOTIFICATIONS (NON-BLOCKING)
        try {
            const { sendTicketEmail } = await import('../services/ticketEmailService.js');
            
            const ticketData = {
                ticket_number: ticketNumber,
                subject: subject, // Clean subject without prefixes
                description: message,
                priority: priority,
                category: category,
                user_name: user.name,
                user_email: user.email,
                user_role: user.role,
                recipient_type: recipient_type,
                recipient_id: recipient_id,
                recipient_name: recipientName
            };

            // Send email notification
            await sendTicketEmail('ticket_created', ticketData);
            console.log(`✅ Email notifications sent for business ticket ${ticketNumber}`);
        } catch (emailError) {
            console.error('❌ Error sending business ticket creation emails:', emailError);
            // Don't fail the ticket creation if email fails
        }

        res.status(201).json({
            message: 'Support ticket submitted successfully',
            ticketId: result.insertId,
            ticketNumber: ticketNumber,
            recipient_type: recipient_type,
            recipient_id: recipient_id
        });

    } catch (error) {
        console.error('Error submitting support ticket:', error);
        res.status(500).json({ message: 'Server error submitting ticket' });
    }
};

// @desc    Get business support tickets
// @route   GET /api/business/help/tickets
// @access  Private/Business
const getBusinessTickets = async (req, res) => {
    const businessId = req.user.id;

    try {
        const sql = `
            SELECT id, ticket_number, subject, description as message, 
                   priority, category, status, admin_response, 
                   created_at, updated_at, responded_at
            FROM support_tickets
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        const [tickets] = await db.execute(sql, [businessId]);
        
        // Parse recipient info from subject for display
        const enhancedTickets = tickets.map(ticket => {
            let recipient_name = 'Admin Support';
            let recipient_type = 'admin';
            
            if (ticket.subject.includes('[TO COMPANY ID:')) {
                const match = ticket.subject.match(/\[TO COMPANY ID:(\d+)\]/);
                if (match) {
                    recipient_type = 'company';
                    recipient_name = `Company (ID: ${match[1]})`;
                    // Clean the subject
                    ticket.subject = ticket.subject.replace(/\[TO COMPANY ID:\d+\]\s*/, '');
                }
            } else if (ticket.subject.includes('[TO ADMIN]')) {
                ticket.subject = ticket.subject.replace(/\[TO ADMIN\]\s*/, '');
            }
            
            return {
                ...ticket,
                recipient_name,
                recipient_type
            };
        });
        
        res.status(200).json(enhancedTickets);

    } catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
};

// @desc    Get companies that business has worked with
// @route   GET /api/business/companies
// @access  Private/Business
const getBusinessCompanies = async (req, res) => {
    const businessId = req.user.id;

    try {
        // Get companies that have responded to this business's quotes
        const sql = `
            SELECT DISTINCT u.id, u.name, u.email, 
                   COUNT(qr.id) as quote_responses_count,
                   MAX(qr.created_at) as last_interaction
            FROM users u
            INNER JOIN quote_responses qr ON u.id = qr.company_id
            INNER JOIN quotes q ON qr.quote_id = q.id
            WHERE q.user_id = ? AND u.role = 'company'
            GROUP BY u.id, u.name, u.email
            ORDER BY last_interaction DESC, u.name ASC
        `;

        const [companies] = await db.execute(sql, [businessId]);
        res.status(200).json(companies);

    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
};

// @desc    Get business transaction invoices
// @route   GET /api/business/transaction-invoices
// @access  Private/Business
const getBusinessTransactionInvoices = async (req, res) => {
    const businessId = req.user.id;
    console.log('🔍 getBusinessTransactionInvoices: Called with businessId:', businessId);
    console.log('🔍 getBusinessTransactionInvoices: User object:', req.user);

    try {
        const sql = `
            SELECT 
                ti.*,
                q.id as quote_id,
                q.departure_city,
                q.arrival_city,
                q.product_description,
                q.shipping_mode,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users c ON ti.company_id = c.id
            WHERE ti.user_id = ?
            ORDER BY ti.created_at DESC
        `;

        console.log('🔍 getBusinessTransactionInvoices: Executing SQL query...');
        console.log('🔍 getBusinessTransactionInvoices: SQL:', sql);
        console.log('🔍 getBusinessTransactionInvoices: Parameters:', [businessId]);

        const [invoices] = await db.execute(sql, [businessId]);
        
        console.log('📊 getBusinessTransactionInvoices: Query result count:', invoices.length);
        console.log('📊 getBusinessTransactionInvoices: Raw invoices:', invoices);
        
        if (invoices.length > 0) {
            console.log('📊 getBusinessTransactionInvoices: Sample invoice:', invoices[0]);
        }
        
        console.log('✅ getBusinessTransactionInvoices: Sending response with', invoices.length, 'invoices');
        res.status(200).json(invoices);
    } catch (error) {
        console.error('❌ getBusinessTransactionInvoices: Error fetching business transaction invoices:', error);
        console.error('❌ getBusinessTransactionInvoices: Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ message: 'Server error fetching transaction invoices' });
    }
};

// @desc    Get business transaction invoice by ID
// @route   GET /api/business/transaction-invoices/:id
// @access  Private/Business
const getBusinessTransactionInvoiceById = async (req, res) => {
    const businessId = req.user.id;
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                ti.*,
                q.id as quote_id,
                q.departure_city,
                q.arrival_city,
                q.product_description,
                q.shipping_mode,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users c ON ti.company_id = c.id
            WHERE ti.id = ? AND ti.user_id = ?
        `;

        const [rows] = await db.execute(sql, [id, businessId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction invoice not found' });
        }

        const invoice = rows[0];
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching business transaction invoice details:', error);
        res.status(500).json({ message: 'Server error fetching transaction invoice details' });
    }
};

// @desc    Get business directory filters
// @route   GET /api/business-directory/filters
// @access  Public
const getBusinessDirectoryFilters = async (req, res) => {
    try {
        // Get unique categories from business users
        const [categoryRows] = await db.execute(`
            SELECT DISTINCT category 
            FROM users 
            WHERE role = 'business' AND category IS NOT NULL AND category != ''
            ORDER BY category
        `);

        // Get unique countries from business users
        const [countryRows] = await db.execute(`
            SELECT DISTINCT country 
            FROM users 
            WHERE role = 'business' AND country IS NOT NULL AND country != ''
            ORDER BY country
        `);

        // Parse categories (they might be comma-separated)
        const categories = new Set();
        categoryRows.forEach(row => {
            if (row.category) {
                const cats = row.category.split(',').map(c => c.trim()).filter(c => c);
                cats.forEach(cat => categories.add(cat));
            }
        });

        const countries = countryRows.map(row => row.country);

        res.status(200).json({
            categories: Array.from(categories).sort(),
            countries: countries
        });
    } catch (error) {
        console.error('Error fetching business directory filters:', error);
        res.status(500).json({ message: 'Server error fetching filters' });
    }
};

// @desc    Get businesses for directory
// @route   GET /api/business-directory/businesses
// @access  Public
const getBusinessDirectoryBusinesses = async (req, res) => {
    const { 
        category, 
        country, 
        search, 
        page = 1, 
        limit = 12 
    } = req.query;

    try {
        let whereClause = `WHERE role = 'business'`;
        let queryParams = [];

        // Add category filter
        if (category) {
            whereClause += ` AND (category LIKE ? OR category LIKE ? OR category LIKE ?)`;
            queryParams.push(`%${category}%`, `${category},%`, `%,${category}`);
        }

        // Add country filter
        if (country) {
            whereClause += ` AND country = ?`;
            queryParams.push(country);
        }

        // Add search filter
        if (search) {
            whereClause += ` AND (name LIKE ? OR about_company LIKE ? OR category LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Calculate pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalBusinesses = countResult[0].total;

        // Get businesses - use string interpolation for LIMIT and OFFSET to avoid MySQL parameter issues
        const sql = `
            SELECT 
                id, name, email, category, country, state, city,
                about_company, logo, website, created_at
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;

        const [businesses] = await db.execute(sql, queryParams);

        // Calculate pagination info
        const totalPages = Math.ceil(totalBusinesses / parseInt(limit));
        const currentPage = parseInt(page);

        res.status(200).json({
            businesses,
            pagination: {
                currentPage,
                totalPages,
                totalBusinesses,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            }
        });
    } catch (error) {
        console.error('Error fetching business directory businesses:', error);
        res.status(500).json({ message: 'Server error fetching businesses' });
    }
};

// @desc    Get single business for directory
// @route   GET /api/business-directory/business/:id
// @access  Public
const getBusinessDirectoryBusiness = async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                id, name, email, category, country, state, city,
                about_company, logo, website, facebook, twitter, 
                linkedin, instagram, services, created_at
            FROM users 
            WHERE id = ? AND role = 'business'
        `;

        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Business not found' });
        }

        const business = rows[0];

        // Parse services if it's a JSON string
        if (business.services && typeof business.services === 'string') {
            try {
                business.services = JSON.parse(business.services);
            } catch (e) {
                business.services = [];
            }
        }

        res.status(200).json({ business });
    } catch (error) {
        console.error('Error fetching business details:', error);
        res.status(500).json({ message: 'Server error fetching business details' });
    }
};

export {
    getBusinessProfile,
    updateBusinessProfile,
    changeBusinessPassword,
    getBusinessDashboardStats,
    getBusinessQuotes,
    getBusinessQuoteResponses,
    submitQuoteResponse,
    updateQuoteResponse,
    deleteQuoteResponse,
    getBusinessNotifications,
    markBusinessNotificationAsRead,
    getBusinessMessages,
    sendBusinessMessage,
    getBusinessConversations,
    getBusinessConversation,
    markBusinessConversationAsRead,
    getBusinessUnreadCount,
    getBusinessDisputes,
    respondToDispute,
    getBusinessHelp,
    submitBusinessTicket,
    getBusinessTickets,
    getBusinessCompanies,
    getBusinessTransactionInvoices,
    getBusinessTransactionInvoiceById,
    getBusinessDirectoryFilters,
    getBusinessDirectoryBusinesses,
    getBusinessDirectoryBusiness
};