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
                   sender.name as sender_name, sender.logo as sender_logo,
                   receiver.name as receiver_name, receiver.logo as receiver_logo
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `;

        const [rows] = await db.execute(sql, [currentUserId, userId, userId, currentUserId]);
        res.status(200).json(rows);

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
                u.logo as other_user_logo
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

            // Check for system messages
            const [systemRows] = await db.execute(`
                SELECT COUNT(*) as system_count 
                FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                AND subject IS NOT NULL 
                AND (subject LIKE '%Quote Response%' OR subject LIKE '%Status Update%' OR subject LIKE '%Quote #%')
            `, [userId, conv.other_user_id, conv.other_user_id, userId]);

            conversations.push({
                other_user_id: conv.other_user_id,
                other_user_name: conv.other_user_name,
                other_user_logo: conv.other_user_logo,
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

export {
    sendMessage,
    getInboxMessages,
    getSentMessages,
    getConversation,
    markMessageAsRead,
    getUnreadCount,
    getConversations,
    markConversationAsRead
};