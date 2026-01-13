// controllers/messageController.js
import db from '../config/db.js';

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, subject, message, quoteId } = req.body;

    if (!receiverId || !message) {
        return res.status(400).json({ message: 'Receiver and message are required' });
    }

    // Ensure no undefined values
    const cleanSubject = subject || null;
    const cleanQuoteId = quoteId || null;

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

        const values = [senderId, receiverId, subject || null, message, quoteId || null];
        const [result] = await db.execute(sql, values);

        res.status(201).json({
            message: 'Message sent successfully',
            messageId: result.insertId
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

// @desc    Get user's messages (inbox)
// @route   GET /api/messages/inbox
// @access  Private
const getInboxMessages = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT m.*, u.name as sender_name, u.email as sender_email, u.logo as sender_logo
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = ?
            ORDER BY m.created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching inbox messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

// @desc    Get user's sent messages
// @route   GET /api/messages/sent
// @access  Private
const getSentMessages = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT m.*, u.name as receiver_name, u.email as receiver_email, u.logo as receiver_logo
            FROM messages m
            JOIN users u ON m.receiver_id = u.id
            WHERE m.sender_id = ?
            ORDER BY m.created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching sent messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = async (req, res) => {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    try {
        const sql = `
            SELECT m.*, 
                   sender.name as sender_name, sender.logo as sender_logo, sender.role as sender_role,
                   receiver.name as receiver_name, receiver.logo as receiver_logo, receiver.role as receiver_role,
                   st.ticket_number, st.subject as ticket_subject, st.status as ticket_status
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            LEFT JOIN support_tickets st ON m.ticket_id = st.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `;

        const [rows] = await db.execute(sql, [currentUserId, userId, userId, currentUserId]);
        
        // Enhance messages with proper sender display names
        const enhancedMessages = rows.map(msg => ({
            ...msg,
            sender_display_name: msg.sender_role === 'admin' ? 'Admin Support' : msg.sender_name,
            receiver_display_name: msg.receiver_role === 'admin' ? 'Admin Support' : msg.receiver_name
        }));
        
        res.status(200).json(enhancedMessages);

    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ message: 'Server error fetching conversation' });
    }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markMessageAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Only allow receiver to mark message as read
        const [result] = await db.execute(
            'UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found or access denied' });
        }

        res.status(200).json({ message: 'Message marked as read' });

    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: 'Server error updating message' });
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = 0',
            [userId]
        );

        res.status(200).json({ unreadCount: rows[0].unread_count });

    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error fetching unread count' });
    }
};

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get all unique users that have conversations with current user
        const sql = `
            SELECT DISTINCT
                u.id as other_user_id,
                u.name as other_user_name,
                u.logo as other_user_logo,
                u.role as other_user_role
            FROM messages m
            JOIN users u ON (u.id = m.sender_id OR u.id = m.receiver_id)
            WHERE (m.sender_id = ? OR m.receiver_id = ?) AND u.id != ?
        `;

        const [conversationRows] = await db.execute(sql, [userId, userId, userId]);

        // Get additional data for each conversation
        const conversations = [];
        for (const conv of conversationRows) {
            // Get last message
            const [lastMessageRows] = await db.execute(`
                SELECT message, created_at 
                FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                ORDER BY created_at DESC 
                LIMIT 1
            `, [userId, conv.other_user_id, conv.other_user_id, userId]);

            // Get unread count
            const [unreadRows] = await db.execute(`
                SELECT COUNT(*) as unread_count 
                FROM messages 
                WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
            `, [conv.other_user_id, userId]);

            // Check for system messages (including ticket messages)
            const [systemRows] = await db.execute(`
                SELECT COUNT(*) as system_count 
                FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                AND (
                    (subject IS NOT NULL AND (subject LIKE '%Quote Response%' OR subject LIKE '%Status Update%' OR subject LIKE '%Quote #%'))
                    OR ticket_id IS NOT NULL
                )
            `, [userId, conv.other_user_id, conv.other_user_id, userId]);

            // Display proper name for admin
            const displayName = conv.other_user_role === 'admin' ? 'Admin Support' : conv.other_user_name;

            conversations.push({
                other_user_id: conv.other_user_id,
                other_user_name: displayName,
                other_user_logo: conv.other_user_logo,
                other_user_role: conv.other_user_role,
                last_message: lastMessageRows[0]?.message || '',
                last_message_time: lastMessageRows[0]?.created_at || null,
                unread_count: unreadRows[0]?.unread_count || 0,
                has_system_messages: systemRows[0]?.system_count > 0
            });
        }

        // Sort by last message time
        conversations.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

        res.status(200).json(conversations);

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error fetching conversations' });
    }
};

// @desc    Mark all messages in conversation as read
// @route   PUT /api/messages/conversation/:userId/read
// @access  Private
const markConversationAsRead = async (req, res) => {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    try {
        const [result] = await db.execute(
            'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
            [userId, currentUserId]
        );

        res.status(200).json({ message: 'Conversation marked as read', updatedCount: result.affectedRows });

    } catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({ message: 'Server error updating conversation' });
    }
};

// @desc    Send welcome message to new user
// @route   POST /api/messages/send-welcome
// @access  Private/System
const sendWelcomeMessage = async (newUserId, userRole) => {
    try {
        // Get admin user ID (assuming there's at least one admin)
        const [adminRows] = await db.execute(
            'SELECT id FROM users WHERE role = "admin" LIMIT 1'
        );

        if (adminRows.length === 0) {
            console.log('No admin found to send welcome message');
            return;
        }

        const adminId = adminRows[0].id;

        // Create role-specific welcome message
        let welcomeMessage = '';
        let subject = '';

        switch (userRole) {
            case 'user':
                subject = 'Welcome to GSN Network!';
                welcomeMessage = `🎉 Welcome to GSN Network!

Thank you for joining our logistics platform! We're excited to have you as part of our community.

Here's what you can do:
• Request quotes from verified logistics providers
• Compare prices and services
• Track your shipments
• Access 24/7 customer support

If you have any questions or need assistance, feel free to reply to this message. Our support team is here to help!

Best regards,
GSN Network Support Team`;
                break;

            case 'business':
                subject = 'Welcome to GSN Network - Business Account!';
                welcomeMessage = `🎉 Welcome to GSN Network!

Congratulations on creating your business account! You're now part of our growing network of logistics professionals.

As a business member, you can:
• Request quotes in bulk amounts for your business needs
• Manage multiple quote requests efficiently
• Build your business reputation through reviews
• Connect with logistics service providers
• Showcase your business profile and requirements

Your account is now active and ready to use. Start requesting quotes and managing your logistics needs with us!

If you need any assistance getting started, don't hesitate to reach out.

Best regards,
GSN Network Support Team`;
                break;

            case 'company':
                subject = 'Welcome to GSN Network - Company Registration Received!';
                welcomeMessage = `🎉 Thank you for registering with GSN Network!

We've received your company registration and it's currently under review by our admin team.

What happens next:
• Our team will verify your company details
• You'll receive an email notification once approved
• After approval, you can access all company features
• Start connecting with customers and growing your business

This review process typically takes 24-48 hours. We appreciate your patience!

If you have any questions about the registration process, feel free to reply to this message.

Best regards,
GSN Network Support Team`;
                break;

            default:
                subject = 'Welcome to GSN Network!';
                welcomeMessage = `🎉 Welcome to GSN Network!

Thank you for joining our platform. We're excited to have you as part of our community!

If you have any questions, feel free to reach out to our support team.

Best regards,
GSN Network Support Team`;
        }

        // Insert welcome message
        const sql = `
            INSERT INTO messages (
                sender_id, receiver_id, subject, message, 
                is_read, created_at
            ) VALUES (?, ?, ?, ?, 0, NOW())
        `;

        await db.execute(sql, [adminId, newUserId, subject, welcomeMessage]);
        
        console.log(`✅ Welcome message sent to new ${userRole} user (ID: ${newUserId})`);

    } catch (error) {
        console.error('❌ Error sending welcome message:', error);
        // Don't throw error as this shouldn't break registration
    }
};

export {
    sendMessage,
    getInboxMessages,
    getSentMessages,
    getConversation,
    markMessageAsRead,
    getUnreadCount,
    getConversations,
    markConversationAsRead,
    sendWelcomeMessage
};