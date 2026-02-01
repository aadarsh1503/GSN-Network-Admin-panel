import db from '../config/db.js';
import { sendEmail, sendBulkEmails as sendBulkEmailsService } from '../services/improvedEmailService.js';
import { sendBulkEmailViaSendy, getSendySubscriberCount } from '../services/sendyService.js';

// @desc    Send bulk emails to users based on type
// @route   POST /api/admin/send-emails
// @access  Private/Admin
export const sendBulkEmails = async (req, res) => {
    try {
        const { userType, subject, body, emailMethod = 'smtp' } = req.body;

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

        let result;

        if (emailMethod === 'sendy') {
            // Send via Sendy to specific list based on user type
            result = await sendBulkEmailViaSendy(users, subject, body, userType);
            
            if (result.success) {
                // Log the campaign to database
                try {
                    // First ensure the table exists
                    await db.execute(`
                        CREATE TABLE IF NOT EXISTS email_campaigns (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_type VARCHAR(50) NOT NULL,
                            subject VARCHAR(255) NOT NULL,
                            method ENUM('sendy', 'smtp') NOT NULL,
                            total_users INT NOT NULL DEFAULT 0,
                            successful_users INT NOT NULL DEFAULT 0,
                            failed_users INT NOT NULL DEFAULT 0,
                            target_list_id VARCHAR(100) NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_user_type (user_type),
                            INDEX idx_method (method),
                            INDEX idx_created_at (created_at)
                        )
                    `);
                    
                    // Now insert the campaign record
                    const campaignData = [
                        userType, 
                        subject, 
                        'sendy', 
                        users.length, 
                        result.subscriptionResults?.successful || 0,
                        result.subscriptionResults?.failed || 0,
                        result.targetListId
                    ];
                    
                    const insertResult = await db.execute(
                        `INSERT INTO email_campaigns (user_type, subject, method, total_users, successful_users, failed_users, target_list_id, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                        campaignData
                    );
                } catch (logError) {
                    console.error('❌ Failed to log Sendy campaign:', logError);
                }

                res.status(200).json({
                    message: result.message,
                    method: 'sendy',
                    totalUsers: users.length,
                    campaignSent: true,
                    userType: result.userType,
                    targetListId: result.targetListId,
                    subscriptionResults: result.subscriptionResults,
                    details: {
                        userType,
                        subject,
                        recipients: users.map(u => u.email),
                        note: `Users added to ${userType} Sendy list and campaign sent`
                    }
                });
            } else {
                res.status(500).json({
                    message: result.message || 'Failed to send via Sendy',
                    method: 'sendy',
                    subscriptionResults: result.subscriptionResults
                });
            }
        } else {
            // Send via SMTP using improved bulk email service
            const result = await sendBulkEmailsService(users, subject, body);

            // Log the campaign to database
            try {
                // First ensure the table exists
                await db.execute(`
                    CREATE TABLE IF NOT EXISTS email_campaigns (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_type VARCHAR(50) NOT NULL,
                        subject VARCHAR(255) NOT NULL,
                        method ENUM('sendy', 'smtp') NOT NULL,
                        total_users INT NOT NULL DEFAULT 0,
                        successful_users INT NOT NULL DEFAULT 0,
                        failed_users INT NOT NULL DEFAULT 0,
                        target_list_id VARCHAR(100) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_user_type (user_type),
                        INDEX idx_method (method),
                        INDEX idx_created_at (created_at)
                    )
                `);
                
                // Now insert the campaign record
                const campaignData = [userType, subject, 'smtp', result.total, result.successful, result.failed];
                
                console.log('📝 Inserting SMTP campaign record with data:', {
                    userType,
                    subject,
                    method: 'smtp',
                    total: result.total,
                    successful: result.successful,
                    failed: result.failed
                });
                
                await db.execute(
                    `INSERT INTO email_campaigns (user_type, subject, method, total_users, successful_users, failed_users, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    campaignData
                );
            } catch (logError) {
                console.error('❌ Failed to log SMTP campaign:', logError);
            }

            // Provide detailed error information
            let responseMessage = 'Bulk email sending completed via SMTP';
            if (result.failed > 0) {
                responseMessage += ` (${result.failed} emails failed - see logs for details)`;
            }

            res.status(200).json({
                message: responseMessage,
                method: 'smtp',
                totalUsers: result.total,
                successful: result.successful,
                failed: result.failed,
                errorSummary: result.errors.length > 0 ? 
                    result.errors.reduce((acc, error) => {
                        acc[error.errorType] = (acc[error.errorType] || 0) + 1;
                        return acc;
                    }, {}) : null,
                details: {
                    userType,
                    subject,
                    recipients: users.map(u => u.email)
                }
            });
        }

    } catch (error) {
        console.error('❌ Error sending bulk emails:', error);
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

        // Get Sendy subscriber count
        const sendySubscriberCount = await getSendySubscriberCount();

        res.status(200).json({
            emailStats: stats,
            userCounts: userCounts.reduce((acc, curr) => {
                acc[curr.type] = curr.count;
                return acc;
            }, {}),
            sendySubscriberCount
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

// @desc    Get email campaign history
// @route   GET /api/admin/email-campaigns
// @access  Private/Admin
export const getEmailCampaigns = async (req, res) => {
    console.log('🚀 getEmailCampaigns API called');

    try {
        const { page = 1, limit = 10, method, userType, dateFrom, dateTo } = req.query;

        console.log('📥 Incoming query params:', {
            page,
            limit,
            method,
            userType,
            dateFrom,
            dateTo
        });

        const offset = (page - 1) * limit;
        console.log('📐 Pagination calculated:', { offset });

        // ==============================
        // TABLE CHECK
        // ==============================
        try {
            console.log('🔍 Checking if email_campaigns table exists...');
            const [tableCheck] = await db.execute(
                "SHOW TABLES LIKE 'email_campaigns'"
            );

            console.log('📋 Table check result:', tableCheck);

            if (tableCheck.length === 0) {
                console.log('⚠️ email_campaigns table not found. Creating table...');

                await db.execute(`
                    CREATE TABLE email_campaigns (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_type VARCHAR(50) NOT NULL,
                        subject VARCHAR(255) NOT NULL,
                        method ENUM('sendy', 'smtp') NOT NULL,
                        total_users INT NOT NULL DEFAULT 0,
                        successful_users INT NOT NULL DEFAULT 0,
                        failed_users INT NOT NULL DEFAULT 0,
                        target_list_id VARCHAR(100) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_user_type (user_type),
                        INDEX idx_method (method),
                        INDEX idx_created_at (created_at)
                    )
                `);

                console.log('✅ email_campaigns table created successfully');
            } else {
                console.log('✅ email_campaigns table already exists');
            }
        } catch (tableError) {
            console.error('❌ Error while checking/creating table:', tableError);

            return res.status(200).json({
                campaigns: [],
                pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            });
        }

        // ==============================
        // FILTERS
        // ==============================
        let whereClause = 'WHERE 1=1';
        let params = [];

        if (method && method !== 'all') {
            whereClause += ' AND method = ?';
            params.push(method);
        }

        if (userType && userType !== 'all') {
            whereClause += ' AND user_type = ?';
            params.push(userType);
        }

        if (dateFrom) {
            whereClause += ' AND DATE(created_at) >= ?';
            params.push(dateFrom);
        }

        if (dateTo) {
            whereClause += ' AND DATE(created_at) <= ?';
            params.push(dateTo);
        }

        // ==============================
        // MAIN QUERY
        // ==============================
        const limitInt = parseInt(limit) || 10;
        const offsetInt = parseInt(offset) || 0;
        
        // Build query with LIMIT and OFFSET directly in SQL to avoid parameter binding issues
        const campaignsQuery = `
            SELECT 
                id,
                user_type,
                subject,
                method,
                total_users,
                successful_users,
                failed_users,
                target_list_id,
                created_at
            FROM email_campaigns 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ${limitInt} OFFSET ${offsetInt}
        `;

        const [campaigns] = await db.execute(campaignsQuery, params);

        // ==============================
        // COUNT QUERY
        // ==============================
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM email_campaigns 
            ${whereClause}
        `;

        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0]?.total || 0;

        console.log('📈 Total campaigns count:', total);

        // ==============================
        // RESPONSE
        // ==============================
        const response = {
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: limitInt,
                total,
                pages: Math.ceil(total / limitInt)
            }
        };

        console.log('✅ Final response:', response);

        res.status(200).json(response);

    } catch (error) {
        console.error('🔥 Unexpected error in getEmailCampaigns:', error);

        res.status(200).json({
            campaigns: [],
            pagination: {
                page: parseInt(req.query.page || 1),
                limit: parseInt(req.query.limit || 10),
                total: 0,
                pages: 0
            }
        });
    }
};


export default {
    sendBulkEmails,
    getEmailStats,
    getEmailLogs,
    getEmailCampaigns
};