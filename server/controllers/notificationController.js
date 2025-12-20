import db from '../config/db.js';

// @desc    Send a notification
// @route   POST /api/notifications/send
// @access  Private/Admin
const sendNotification = async (req, res) => {
    // req.file is available here thanks to multer/cloudinary middleware
    // req.body contains text fields
    const { userType, title, message } = req.body;

    if (!userType || !title || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        let imageUrl = null;
        
        // Multer with CloudinaryStorage puts the remote URL in req.file.path
        if (req.file && req.file.path) {
            imageUrl = req.file.path; 
        }

        const sql = `
            INSERT INTO notifications (target_role, title, message, image)
            VALUES (?, ?, ?, ?)
        `;

        await db.execute(sql, [userType, title, message, imageUrl]);

        res.status(201).json({ message: 'Notification sent successfully', imageUrl });

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Server error while sending notification' });
    }
};

// @desc    Get notifications relevant to the logged-in user
// @route   GET /api/notifications/my-notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        if (userRole === 'admin') {
            // Admin sees everything
            const [allRows] = await db.execute('SELECT * FROM notifications ORDER BY created_at DESC');
            return res.status(200).json(allRows);
        }

        // Get user-specific notifications and general notifications for their role
        const sql = `
            SELECT DISTINCT n.*, 
                   un.is_read, 
                   un.read_at,
                   CASE 
                       WHEN un.user_id IS NOT NULL THEN 1 
                       ELSE 0 
                   END as is_user_specific
            FROM notifications n
            LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
            WHERE (
                -- User-specific notifications
                un.user_id = ?
                OR 
                -- General notifications for all users or their role
                (n.target_audience = 'all' OR 
                 (n.target_audience = 'companies' AND ? = 'company') OR
                 (n.target_audience = 'businesses' AND ? = 'business') OR
                 (n.target_audience = 'users' AND ? = 'user'))
                AND n.target_role != 'user_specific'
            )
            ORDER BY n.created_at DESC
            LIMIT 50
        `;

        const [rows] = await db.execute(sql, [userId, userId, userRole, userRole, userRole]);

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Count unread notifications (user-specific + general for their role)
        const sql = `
            SELECT COUNT(DISTINCT n.id) as count
            FROM notifications n
            LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
            WHERE (
                -- User-specific notifications that are unread
                (un.user_id = ? AND (un.is_read IS NULL OR un.is_read = 0))
                OR 
                -- General notifications for their role that they haven't seen
                ((n.target_audience = 'all' OR 
                  (n.target_audience = 'companies' AND ? = 'company') OR
                  (n.target_audience = 'businesses' AND ? = 'business') OR
                  (n.target_audience = 'users' AND ? = 'user'))
                 AND n.target_role != 'user_specific'
                 AND un.user_id IS NULL)
            )
            AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        const [result] = await db.execute(sql, [userId, userId, userRole, userRole, userRole]);

        res.status(200).json({ count: result[0].count });

    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error fetching unread count' });
    }
};

// @desc    Mark notifications as read when user visits a page
// @route   POST /api/notifications/mark-read
// @access  Private
const markNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    const { pageType } = req.body; // 'notifications', 'quotes', 'messages', etc.

    try {
        let sql;
        let params = [userId];

        if (pageType === 'all') {
            // Mark all notifications as read
            sql = `
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                SELECT ?, n.id, 1, NOW()
                FROM notifications n
                LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
                WHERE (
                    -- User-specific notifications
                    EXISTS (SELECT 1 FROM user_notifications un2 WHERE un2.notification_id = n.id AND un2.user_id = ?)
                    OR 
                    -- General notifications for their role
                    (n.target_audience = 'all' OR n.target_audience = 'companies')
                    AND n.target_role != 'user_specific'
                )
                AND un.user_id IS NULL
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `;
            params = [userId, userId, userId];
        } else if (pageType === 'quotes') {
            // Mark quote-related notifications as read
            sql = `
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                SELECT ?, n.id, 1, NOW()
                FROM notifications n
                LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
                WHERE (n.title LIKE '%Quote%' OR n.message LIKE '%quote%')
                AND (
                    EXISTS (SELECT 1 FROM user_notifications un2 WHERE un2.notification_id = n.id AND un2.user_id = ?)
                    OR 
                    (n.target_audience = 'all' OR n.target_audience = 'companies')
                    AND n.target_role != 'user_specific'
                )
                AND un.user_id IS NULL
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `;
            params = [userId, userId, userId];
        } else if (pageType === 'messages') {
            // Mark message-related notifications as read
            sql = `
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                SELECT ?, n.id, 1, NOW()
                FROM notifications n
                LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
                WHERE (n.title LIKE '%Message%' OR n.message LIKE '%message%')
                AND (
                    EXISTS (SELECT 1 FROM user_notifications un2 WHERE un2.notification_id = n.id AND un2.user_id = ?)
                    OR 
                    (n.target_audience = 'all' OR n.target_audience = 'companies')
                    AND n.target_role != 'user_specific'
                )
                AND un.user_id IS NULL
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `;
            params = [userId, userId, userId];
        } else {
            // Mark specific type notifications as read
            sql = `
                UPDATE user_notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE user_id = ? AND is_read = 0
            `;
        }

        await db.execute(sql, params);

        res.status(200).json({ message: 'Notifications marked as read' });

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error marking notifications as read' });
    }
};

export { sendNotification, getMyNotifications, getUnreadCount, markNotificationsAsRead };