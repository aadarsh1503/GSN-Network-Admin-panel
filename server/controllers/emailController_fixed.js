import db from '../config/db.js';
import { sendEmail, sendBulkEmails as sendBulkEmailsService } from '../services/improvedEmailService.js';
import { sendBulkEmailViaSendy, getSendySubscriberCount } from '../services/sendyService.js';
import { sendBulkEmailViaSES, testSESConnection, getSESStats } from '../services/awsSesService.js';

// Helper function to ensure email_campaigns table exists with proper structure
const ensureEmailCampaignsTable = async () => {
    try {
        // Create table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS email_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_type VARCHAR(50) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                method ENUM('sendy', 'smtp', 'aws_ses') NOT NULL,
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
        
        // Check if we need to update existing table to support aws_ses
        try {
            const [columns] = await db.execute("SHOW COLUMNS FROM email_campaigns LIKE 'method'");
            if (columns.length > 0) {
                const methodColumn = columns[0];
                if (!methodColumn.Type.includes('aws_ses')) {
                    console.log('🔄 Updating email_campaigns table to support AWS SES...');
                    await db.execute(`
                        ALTER TABLE email_campaigns 
                        MODIFY COLUMN method ENUM('sendy', 'smtp', 'aws_ses') NOT NULL
                    `);
                    console.log('✅ Table updated to support AWS SES');
                }
            }
        } catch (alterError) {
            console.log('⚠️ Could not update table structure, but continuing...', alterError.message);
        }
    } catch (error) {
        console.error('❌ Error ensuring email_campaigns table:', error);
        throw error;
    }
};

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
            console.log(`🚀 Starting Sendy email campaign for ${userType} with ${users.length} users`);
            console.log(`📧 Subject: ${subject}`);
            console.log(`📧 Body length: ${body.length} characters`);
            
            // Send via Sendy to specific list based on user type
            result = await sendBulkEmailViaSendy(users, subject, body, userType);
            
            console.log(`📧 Sendy campaign result:`, result);
            
            if (result.success) {
                // Log the campaign to database
                try {
                    // Ensure table exists with proper structure
                    await ensureEmailCampaignsTable();
                    
                    // Now insert the campaign record
                    const campaignData = [
                        userType, 
                        subject, 
                        'sendy', 
                        users.length, 
                        result.details?.selectedUsers || users.length,
                        0, // failed users
                        result.details?.targetListId || null
                    ];
                    
                    console.log(`📝 Logging Sendy campaign to database:`, campaignData);
                    
                    const insertResult = await db.execute(
                        `INSERT INTO email_campaigns (user_type, subject, method, total_users, successful_users, failed_users, target_list_id, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                        campaignData
                    );
                    
                    console.log(`✅ Campaign logged to database successfully`);
                } catch (logError) {
                    c