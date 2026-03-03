import db from '../config/db.js';

// @desc    Get AWS settings
// @route   GET /api/admin/aws-settings
// @access  Private/Admin
export const getAWSSettings = async (req, res) => {
    try {
        console.log('🔍 [AWS Settings] GET request received');
        console.log('   User:', req.user);
        console.log('   User Role:', req.user?.role);
        
        const sql = `SELECT * FROM aws_settings WHERE is_active = 1 ORDER BY id DESC LIMIT 1`;
        const [rows] = await db.execute(sql);
        
        if (rows.length === 0) {
            console.log('⚠️  [AWS Settings] No settings found in database');
            return res.status(404).json({ message: 'AWS settings not found' });
        }

        // Send the full secret key (no masking)
        const settings = {
            ...rows[0]
        };

        console.log('✅ [AWS Settings] Settings retrieved successfully');
        console.log('   Secret key length:', settings.secret_access_key?.length);
        console.log('   Secret key preview:', settings.secret_access_key?.substring(0, 10) + '...');
        res.status(200).json(settings);
    } catch (error) {
        console.error('❌ [AWS Settings] Error fetching AWS settings:', error);
        res.status(500).json({ message: 'Server error fetching AWS settings' });
    }
};

// @desc    Update AWS settings
// @route   PUT /api/admin/aws-settings
// @access  Private/Admin
export const updateAWSSettings = async (req, res) => {
    try {
        const { access_key_id, secret_access_key, region, ses_from_email, ses_from_name } = req.body;
        const adminId = req.user.id;

        // Validation
        if (!access_key_id || !region || !ses_from_email || !ses_from_name) {
            return res.status(400).json({ message: 'All fields except secret key are required' });
        }

        // Get current settings
        const [currentSettings] = await db.execute(
            `SELECT * FROM aws_settings WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
        );

        let sql;
        let params;

        if (currentSettings.length > 0) {
            // Update existing settings
            // Only update secret_access_key if a new one is provided (not the masked value)
            if (secret_access_key && !secret_access_key.includes('•')) {
                sql = `
                    UPDATE aws_settings 
                    SET access_key_id = ?, 
                        secret_access_key = ?, 
                        region = ?, 
                        ses_from_email = ?, 
                        ses_from_name = ?,
                        updated_by = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `;
                params = [access_key_id, secret_access_key, region, ses_from_email, ses_from_name, adminId, currentSettings[0].id];
            } else {
                // Don't update secret_access_key if it's masked
                sql = `
                    UPDATE aws_settings 
                    SET access_key_id = ?, 
                        region = ?, 
                        ses_from_email = ?, 
                        ses_from_name = ?,
                        updated_by = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `;
                params = [access_key_id, region, ses_from_email, ses_from_name, adminId, currentSettings[0].id];
            }
        } else {
            // Insert new settings
            if (!secret_access_key || secret_access_key.includes('•')) {
                return res.status(400).json({ message: 'Secret access key is required for initial setup' });
            }

            sql = `
                INSERT INTO aws_settings 
                (access_key_id, secret_access_key, region, ses_from_email, ses_from_name, updated_by, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            `;
            params = [access_key_id, secret_access_key, region, ses_from_email, ses_from_name, adminId];
        }

        await db.execute(sql, params);

        res.status(200).json({ message: 'AWS settings updated successfully' });
    } catch (error) {
        console.error('Error updating AWS settings:', error);
        res.status(500).json({ message: 'Server error updating AWS settings' });
    }
};

// @desc    Test AWS SES connection
// @route   POST /api/admin/aws-settings/test
// @access  Private/Admin
export const testAWSConnection = async (req, res) => {
    try {
        console.log('🔍 [AWS Settings] Test connection request received');
        console.log('   User:', req.user);
        console.log('   User Role:', req.user?.role);
        console.log('   Request body:', req.body);
        
        const { testEmail } = req.body;

        if (!testEmail) {
            return res.status(400).json({ message: 'Test email address is required' });
        }

        // Get current AWS settings
        const [settings] = await db.execute(
            `SELECT * FROM aws_settings WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
        );

        if (settings.length === 0) {
            return res.status(404).json({ message: 'AWS settings not configured' });
        }

        const awsSettings = settings[0];
        console.log('📧 [AWS Settings] Sending test email to:', testEmail);

        // Import AWS SDK
        const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');

        // Configure AWS SES client with database credentials
        const sesClient = new SESClient({
            region: awsSettings.region,
            credentials: {
                accessKeyId: awsSettings.access_key_id,
                secretAccessKey: awsSettings.secret_access_key
            }
        });

        // Send test email
        const params = {
            Source: `${awsSettings.ses_from_name} <${awsSettings.ses_from_email}>`,
            Destination: {
                ToAddresses: [testEmail]
            },
            Message: {
                Subject: {
                    Data: 'AWS SES Test Email',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: `
                            <h2>AWS SES Connection Test</h2>
                            <p>This is a test email to verify your AWS SES configuration.</p>
                            <p><strong>Configuration Details:</strong></p>
                            <ul>
                                <li>Region: ${awsSettings.region}</li>
                                <li>From Email: ${awsSettings.ses_from_email}</li>
                                <li>From Name: ${awsSettings.ses_from_name}</li>
                            </ul>
                            <p>If you received this email, your AWS SES is configured correctly!</p>
                        `,
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        const command = new SendEmailCommand(params);
        await sesClient.send(command);

        console.log('✅ [AWS Settings] Test email sent successfully');
        res.status(200).json({ 
            message: 'Test email sent successfully! Check your inbox.',
            success: true 
        });
    } catch (error) {
        console.error('❌ [AWS Settings] Error testing AWS connection:', error);
        res.status(500).json({ 
            message: `Failed to send test email: ${error.message}`,
            success: false 
        });
    }
};
