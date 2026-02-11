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
            // Admin sees everything - convert timestamps to ISO format
            const [allRows] = await db.execute(`
                SELECT *, 
                       DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as created_at_iso
                FROM notifications 
                ORDER BY created_at DESC
            `);
            
            // Replace created_at with ISO format
            const formattedRows = allRows.map(row => ({
                ...row,
                created_at: row.created_at_iso || row.created_at
            }));
            
            return res.status(200).json(formattedRows);
        }

        // Get user-specific notifications and general notifications for their role
        const sql = `
            SELECT DISTINCT n.*, 
                   un.is_read, 
                   un.read_at,
                   CASE 
                       WHEN un.user_id IS NOT NULL THEN 1 
                       ELSE 0 
                   END as is_user_specific,
                   DATE_FORMAT(CONVERT_TZ(n.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as created_at_iso
            FROM notifications n
            LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
            WHERE (
                -- User-specific notifications (only if there's a matching entry in user_notifications)
                (n.target_role = 'user_specific' AND un.user_id = ?)
                OR 
                -- General notifications for all users or their role (excluding user-specific ones)
                ((n.target_audience = 'all' OR 
                 (n.target_audience = 'companies' AND ? = 'company') OR
                 (n.target_audience = 'businesses' AND ? = 'business') OR
                 (n.target_audience = 'users' AND ? = 'user'))
                AND n.target_role != 'user_specific')
            )
            ORDER BY n.created_at DESC
            LIMIT 50
        `;

        const [rows] = await db.execute(sql, [userId, userId, userRole, userRole, userRole]);

        // Replace created_at with ISO format for consistent frontend parsing
        const formattedRows = rows.map(row => ({
            ...row,
            created_at: row.created_at_iso || row.created_at
        }));

        res.status(200).json(formattedRows);

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
                -- User-specific notifications (only if there's a matching entry)
                (n.target_role = 'user_specific' AND un.user_id = ?)
                OR
                -- General notifications for all users or their role (excluding user-specific ones)
                ((n.target_audience = 'all' OR 
                 (n.target_audience = 'companies' AND ? = 'company') OR
                 (n.target_audience = 'businesses' AND ? = 'business') OR
                 (n.target_audience = 'users' AND ? = 'user') OR
                 (n.target_audience = 'admins' AND ? = 'admin'))
                AND n.target_role != 'user_specific')
            )
            AND (un.is_read IS NULL OR un.is_read = 0)
            AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        const [result] = await db.execute(sql, [userId, userId, userRole, userRole, userRole, userRole]);
        console.log(`Unread count for user ${userId} (${userRole}): ${result[0].count}`);

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
    const userRole = req.user.role;
    const { pageType } = req.body; // 'notifications', 'quotes', 'messages', etc.

    console.log(`Marking notifications as read for user ${userId} with role ${userRole}, pageType: ${pageType}`);

    try {
        let sql;
        let params = [userId];

        if (pageType === 'all') {
            // Mark all notifications as read for this user based on their role
            // Split into two operations to avoid creating duplicate user-specific notifications
            
            // 1. First, handle general notifications (create records if they don't exist)
            const generalNotificationsSql = `
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                SELECT ?, n.id, 1, NOW()
                FROM notifications n
                LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
                WHERE (
                    -- General notifications for all users or their role (excluding user-specific ones)
                    ((n.target_audience = 'all' OR 
                     (n.target_audience = 'companies' AND ? = 'company') OR
                     (n.target_audience = 'businesses' AND ? = 'business') OR
                     (n.target_audience = 'users' AND ? = 'user') OR
                     (n.target_audience = 'admins' AND ? = 'admin'))
                    AND n.target_role != 'user_specific')
                )
                AND un.user_id IS NULL
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `;
            
            await db.execute(generalNotificationsSql, [userId, userId, userRole, userRole, userRole, userRole]);
            
            // 2. Then, update existing user-specific notifications (don't create new ones)
            const userSpecificUpdateSql = `
                UPDATE user_notifications un
                JOIN notifications n ON un.notification_id = n.id
                SET un.is_read = 1, un.read_at = NOW()
                WHERE un.user_id = ? AND n.target_role = 'user_specific' AND un.is_read = 0
            `;
            
            const [result] = await db.execute(userSpecificUpdateSql, [userId]);
            
            res.status(200).json({ 
                message: 'Notifications marked as read',
                affectedRows: result.affectedRows 
            });
            return;
        } else if (pageType === 'quotes') {
            // Mark quote-related notifications as read
            sql = `
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                SELECT ?, n.id, 1, NOW()
                FROM notifications n
                LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
                WHERE (n.title LIKE '%Quote%' OR n.message LIKE '%quote%')
                AND (
                    -- User-specific notifications (only if there's a matching entry)
                    (n.target_role = 'user_specific' AND un.user_id = ?)
                    OR
                    -- General notifications for all users or their role (excluding user-specific ones)
                    ((n.target_audience = 'all' OR 
                     (n.target_audience = 'companies' AND ? = 'company') OR
                     (n.target_audience = 'businesses' AND ? = 'business') OR
                     (n.target_audience = 'users' AND ? = 'user') OR
                     (n.target_audience = 'admins' AND ? = 'admin'))
                    AND n.target_role != 'user_specific')
                )
                AND (un.user_id IS NULL OR un.is_read = 0)
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `;
            params = [userId, userId, userId, userRole, userRole, userRole, userRole];
        } else if (pageType === 'messages') {
            // Mark message-related notifications as read
            sql = `
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                SELECT ?, n.id, 1, NOW()
                FROM notifications n
                LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
                WHERE (n.title LIKE '%Message%' OR n.message LIKE '%message%')
                AND (
                    -- User-specific notifications (only if there's a matching entry)
                    (n.target_role = 'user_specific' AND un.user_id = ?)
                    OR
                    -- General notifications for all users or their role (excluding user-specific ones)
                    ((n.target_audience = 'all' OR 
                     (n.target_audience = 'companies' AND ? = 'company') OR
                     (n.target_audience = 'businesses' AND ? = 'business') OR
                     (n.target_audience = 'users' AND ? = 'user') OR
                     (n.target_audience = 'admins' AND ? = 'admin'))
                    AND n.target_role != 'user_specific')
                )
                AND (un.user_id IS NULL OR un.is_read = 0)
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `;
            params = [userId, userId, userId, userRole, userRole, userRole, userRole];
        } else {
            // Mark specific type notifications as read
            sql = `
                UPDATE user_notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE user_id = ? AND is_read = 0
            `;
        }

        const [result] = await db.execute(sql, params);
        console.log(`Marked ${result.affectedRows} notifications as read for user ${userId}`);

        res.status(200).json({ 
            message: 'Notifications marked as read',
            affectedRows: result.affectedRows 
        });

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error marking notifications as read' });
    }
};

export { sendNotification, getMyNotifications, getUnreadCount, markNotificationsAsRead };