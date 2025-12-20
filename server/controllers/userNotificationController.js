// controllers/userNotificationController.js
import db from '../config/db.js';

// @desc    Get user notifications (including quote response notifications)
// @route   GET /api/user-notifications
// @access  Private/User
const getUserNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        // First, get the user's role to determine what notifications they should see
        const [userInfo] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
        
        if (userInfo.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userRole = userInfo[0].role;
        
        // Get quote response notifications (only for users who own quotes)
        const quoteResponseSql = `
            SELECT 
                CONCAT('quote_response_', qr.id) as id,
                'quote_response' as type,
                qr.id as quote_response_id,
                qr.quote_id,
                qr.company_id,
                qr.price,
                qr.transit_time,
                qr.created_at,
                c.name as company_name,
                c.logo as company_logo,
                q.product_description,
                q.departure_country,
                q.arrival_country,
                0 as is_responded,
                NULL as user_response
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            JOIN users c ON qr.company_id = c.id
            WHERE q.user_id = ?
            ORDER BY qr.created_at DESC
            LIMIT 20
        `;

        const [quoteResponses] = await db.execute(quoteResponseSql, [userId]);

        // Get regular notifications based on user role
        let regularNotificationsSql;
        let targetAudiences = [];
        
        if (userRole === 'admin') {
            // Admins see all notifications
            targetAudiences = ['all', 'admins'];
        } else if (userRole === 'company') {
            // Companies see notifications for all and companies
            targetAudiences = ['all', 'companies'];
        } else if (userRole === 'business') {
            // Business users see notifications for all and businesses
            targetAudiences = ['all', 'businesses'];
        } else if (userRole === 'user') {
            // Regular users see notifications for all and users
            targetAudiences = ['all', 'users'];
        } else {
            // Default: only see 'all' notifications
            targetAudiences = ['all'];
        }
        
        regularNotificationsSql = `
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
            WHERE n.target_audience IN (${targetAudiences.map(() => '?').join(', ')})
            ORDER BY n.created_at DESC
            LIMIT 10
        `;

        const [regularNotifications] = await db.execute(regularNotificationsSql, [userId, ...targetAudiences]);

        // Combine and sort all notifications
        const allNotifications = [
            ...quoteResponses.map(qr => ({
                id: qr.id,
                type: qr.type,
                title: `New Quote Response from ${qr.company_name}`,
                message: `Price: ${qr.price} | Transit Time: ${qr.transit_time}`,
                data: {
                    quote_response_id: qr.quote_response_id,
                    quote_id: qr.quote_id,
                    company_id: qr.company_id,
                    price: qr.price,
                    transit_time: qr.transit_time,
                    company_name: qr.company_name,
                    company_logo: qr.company_logo,
                    product_description: qr.product_description,
                    departure_country: qr.departure_country,
                    arrival_country: qr.arrival_country
                },
                created_at: qr.created_at,
                is_read: qr.is_responded,
                user_response: qr.user_response,
                priority: qr.is_responded ? 'normal' : 'high'
            })),
            ...regularNotifications.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                image: n.image,
                created_at: n.created_at,
                is_read: n.is_read,
                priority: 'normal'
            }))
        ];

        // Sort by priority (high first) then by created_at (newest first)
        allNotifications.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        res.status(200).json(allNotifications);

    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// @desc    Get unread notification count
// @route   GET /api/user-notifications/unread-count
// @access  Private/User
const getUnreadNotificationCount = async (req, res) => {
    const userId = req.user.id;

    try {
        // First, get the user's role
        const [userInfo] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
        
        if (userInfo.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userRole = userInfo[0].role;
        
        // Count quote responses (only for users who own quotes)
        const [quoteResponseCount] = await db.execute(`
            SELECT COUNT(*) as count
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            WHERE q.user_id = ?
        `, [userId]);

        // Determine target audiences based on user role
        let targetAudiences = [];
        
        if (userRole === 'admin') {
            targetAudiences = ['all', 'admins'];
        } else if (userRole === 'company') {
            targetAudiences = ['all', 'companies'];
        } else if (userRole === 'business') {
            targetAudiences = ['all', 'businesses'];
        } else if (userRole === 'user') {
            targetAudiences = ['all', 'users'];
        } else {
            targetAudiences = ['all'];
        }

        // Count unread regular notifications based on role
        const [regularNotificationCount] = await db.execute(`
            SELECT COUNT(*) as count
            FROM notifications n
            LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
            WHERE n.target_audience IN (${targetAudiences.map(() => '?').join(', ')})
            AND (un.is_read IS NULL OR un.is_read = 0)
        `, [userId, ...targetAudiences]);

        const totalUnread = quoteResponseCount[0].count + regularNotificationCount[0].count;

        res.status(200).json({ unreadCount: totalUnread });

    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ message: 'Server error fetching unread count' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/user-notifications/:id/read
// @access  Private/User
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        if (id.startsWith('notification_')) {
            const notificationId = id.replace('notification_', '');
            
            // Insert or update user_notifications
            await db.execute(`
                INSERT INTO user_notifications (user_id, notification_id, is_read, read_at)
                VALUES (?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
            `, [userId, notificationId]);
        }
        // Quote response notifications are marked as read when user responds

        res.status(200).json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

export {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead
};