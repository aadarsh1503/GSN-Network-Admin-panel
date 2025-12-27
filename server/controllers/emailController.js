import db from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

// @desc    Send bulk emails to users based on type
// @route   POST /api/admin/send-emails
// @access  Private/Admin
export const sendBulkEmails = async (req, res) => {
    try {
        const { userType, subject, body } = req.body;

        if (!userType || !subject || !body) {
            return res.status(400).json({ 
                message: 'User type, subject, and body are required' 
            });
        }

        let sql;
        let params = [];

        // Build query based on user type
        switch (userType) {
            case 'all':
                sql = `SELECT email, name FROM users WHERE role != 'admin' AND status = 1`;
                break;
            case 'users':
                sql = `SELECT email, name FROM users WHERE role = 'user' AND status = 1`;
                break;
            case 'companies':
                sql = `SELECT email, name FROM users WHERE role = 'company' AND status = 1`;
                break;
            case 'business_owners':
                sql = `SELECT email, name FROM users WHERE role = 'business' AND status = 1`;
                break;
            case 'subscribers':
                sql = `
                    SELECT DISTINCT u.email, u.name 
                    FROM users u 
                    JOIN user_subscriptions us ON u.id = us.user_id 
                    WHERE us.status = 'active' AND u.status = 1
                `;
                break;
            default:
                return res.status(400).json({ message: 'Invalid user type' });
        }

        // Get users based on the query
        const [users] = await db.execute(sql, params);

        if (users.length === 0) {
            return res.status(404).json({ 
                message: 'No users found for the selected type' 
            });
        }

        // Send emails to all users
        const emailPromises = users.map(user => {
            // Personalize the email body with user's name
            const personalizedBody = body.replace(/\{name\}/g, user.name || 'Valued User');
            return sendEmail(user.email, subject, personalizedBody, 'general');
        });

        const results = await Promise.allSettled(emailPromises);

        // Count successful and failed emails
        const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
        const failed = results.length - successful;

        res.status(200).json({
            message: 'Bulk email sending completed',
            totalUsers: users.length,
            successful,
            failed,
            details: {
                userType,
                subject,
                recipients: users.map(u => u.email)
            }
        });

    } catch (error) {
        console.error('Error sending bulk emails:', error);
        res.status(500).json({ message: 'Server error sending emails' });
    }
};

// @desc    Get email statistics
// @route   GET /api/admin/email-stats
// @access  Private/Admin
export const getEmailStats = async (req, res) => {
    try {
        // Get email statistics from the database
        const statsQuery = `
            SELECT 
                type,
                status,
                COUNT(*) as count
            FROM email_notifications 
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY type, status
            ORDER BY type, status
        `;

        const [stats] = await db.execute(statsQuery);

        // Get user counts by type
        const userCountsQuery = `
            SELECT 
                'all' as type, COUNT(*) as count FROM users WHERE role != 'admin' AND status = 1
            UNION ALL
            SELECT 
                'users' as type, COUNT(*) as count FROM users WHERE role = 'user' AND status = 1
            UNION ALL
            SELECT 
                'companies' as type, COUNT(*) as count FROM users WHERE role = 'company' AND status = 1
            UNION ALL
            SELECT 
                'business_owners' as type, COUNT(*) as count FROM users WHERE role = 'business' AND status = 1
            UNION ALL
            SELECT 
                'subscribers' as type, COUNT(DISTINCT u.id) as count 
                FROM users u 
                LEFT JOIN user_subscriptions us ON u.id = us.user_id 
                WHERE us.status = 'active' AND u.status = 1
        `;

        const [userCounts] = await db.execute(userCountsQuery);

        res.status(200).json({
            emailStats: stats,
            userCounts: userCounts.reduce((acc, curr) => {
                acc[curr.type] = curr.count;
                return acc;
            }, {})
        });

    } catch (error) {
        console.error('Error fetching email stats:', error);
        res.status(500).json({ message: 'Server error fetching email statistics' });
    }
};

// @desc    Get recent email logs
// @route   GET /api/admin/email-logs
// @access  Private/Admin
export const getEmailLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const logsQuery = `
            SELECT 
                id,
                recipient_email,
                subject,
                type,
                status,
                sent_at,
                SUBSTRING(message, 1, 100) as message_preview
            FROM email_notifications 
            ORDER BY sent_at DESC
            LIMIT ? OFFSET ?
        `;

        const [logs] = await db.execute(logsQuery, [parseInt(limit), parseInt(offset)]);

        // Get total count
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM email_notifications');
        const total = countResult[0].total;

        res.status(200).json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching email logs:', error);
        res.status(500).json({ message: 'Server error fetching email logs' });
    }
};

export default {
    sendBulkEmails,
    getEmailStats,
    getEmailLogs
};