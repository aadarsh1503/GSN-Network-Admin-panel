// AWS SES Service - Direct email sending via Amazon SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import db from '../config/db.js';

// Get AWS credentials from database
const getAWSCredentialsFromDB = async () => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM aws_settings WHERE is_active = 1 ORDER BY id DESC LIMIT 1`
        );
        
        if (rows.length === 0) {
            console.warn('⚠️ No AWS settings found in database, falling back to environment variables');
            return {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'eu-north-1',
                fromEmail: process.env.AWS_SES_FROM_EMAIL || 'info@promo.gulfstarnetwork.com',
                fromName: process.env.AWS_SES_FROM_NAME || 'GSN Network'
            };
        }
        
        const settings = rows[0];
        console.log('✅ AWS credentials loaded from database');
        console.log(`   Region: ${settings.region}`);
        console.log(`   From Email: ${settings.ses_from_email}`);
        console.log(`   From Name: ${settings.ses_from_name}`);
        
        return {
            accessKeyId: settings.access_key_id,
            secretAccessKey: settings.secret_access_key,
            region: settings.region,
            fromEmail: settings.ses_from_email,
            fromName: settings.ses_from_name
        };
    } catch (error) {
        console.error('❌ Error fetching AWS credentials from database:', error);
        // Fallback to environment variables
        return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'eu-north-1',
            fromEmail: process.env.AWS_SES_FROM_EMAIL || 'info@promo.gulfstarnetwork.com',
            fromName: process.env.AWS_SES_FROM_NAME || 'GSN Network'
        };
    }
};

// Create SES client with database credentials
const createSESClient = async () => {
    const credentials = await getAWSCredentialsFromDB();
    
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('AWS credentials not configured. Please configure them in the admin panel.');
    }
    
    return {
        client: new SESClient({
            region: credentials.region,
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            }
        }),
        fromEmail: credentials.fromEmail,
        fromName: credentials.fromName
    };
};

// Send single email via AWS SES
export const sendSingleEmailViaSES = async (toEmail, subject, htmlContent, textContent = '') => {
    try {
        const { client: sesClient, fromEmail, fromName } = await createSESClient();
        
        console.log(`📧 Sending single email via AWS SES to: ${toEmail}`);
        
        const params = {
            Source: `${fromName} <${fromEmail}>`,
            Destination: {
                ToAddresses: [toEmail]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: textContent || htmlContent.replace(/<[^>]*>/g, ''),
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        
        console.log(`✅ Email sent successfully via SES. MessageId: ${result.MessageId}`);
        
        return {
            success: true,
            messageId: result.MessageId,
            message: 'Email sent successfully via AWS SES'
        };
        
    } catch (error) {
        console.error('❌ Error sending email via SES:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to send email via AWS SES'
        };
    }
};

// Send bulk emails via AWS SES
export const sendBulkEmailViaSES = async (users, subject, htmlContent, userType = 'all') => {
    try {
        const { client: sesClient, fromEmail, fromName } = await createSESClient();
        
        console.log(`📧 Starting AWS SES bulk email campaign for ${userType} with ${users.length} users`);
        console.log(`📧 Subject: ${subject}`);
        console.log(`📧 From: ${fromName} <${fromEmail}>`);
        
        const results = {
            successful: 0,
            failed: 0,
            errors: [],
            messageIds: []
        };

        // AWS SES has a limit of 50 destinations per SendBulkEmail call
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < users.length; i += batchSize) {
            batches.push(users.slice(i, i + batchSize));
        }

        console.log(`📧 Processing ${batches.length} batches of up to ${batchSize} emails each`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`📧 Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} emails`);

            try {
                // Send individual emails in this batch
                for (const user of batch) {
                    try {
                        const personalizedContent = htmlContent.replace(/\{name\}/g, user.name || 'Valued Customer');
                        
                        const result = await sendSingleEmailViaSES(user.email, subject, personalizedContent);
                        
                        if (result.success) {
                            results.successful++;
                            results.messageIds.push(result.messageId);
                            console.log(`✅ ${user.email} - Success`);
                        } else {
                            results.failed++;
                            results.errors.push({
                                email: user.email,
                                error: result.error
                            });
                            console.log(`❌ ${user.email} - Failed: ${result.error}`);
                        }
                        
                        // Small delay to respect SES rate limits (14 emails per second max)
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (emailError) {
                        results.failed++;
                        results.errors.push({
                            email: user.email,
                            error: emailError.message
                        });
                        console.log(`❌ ${user.email} - Error: ${emailError.message}`);
                    }
                }

            } catch (batchError) {
                console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
                // Mark all emails in this batch as failed
                batch.forEach(user => {
                    results.failed++;
                    results.errors.push({
                        email: user.email,
                        error: batchError.message
                    });
                });
            }

            // Delay between batches to respect rate limits
            if (batchIndex < batches.length - 1) {
                console.log('⏳ Waiting between batches...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`📊 AWS SES Campaign Results:`);
        console.log(`   ✅ Successful: ${results.successful}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   📧 Total: ${users.length}`);

        return {
            success: true,
            method: 'aws_ses',
            userType,
            totalUsers: users.length,
            successful: results.successful,
            failed: results.failed,
            errors: results.errors,
            messageIds: results.messageIds,
            message: `AWS SES campaign completed: ${results.successful} sent, ${results.failed} failed`
        };

    } catch (error) {
        console.error('❌ Error in AWS SES bulk email campaign:', error);
        return {
            success: false,
            method: 'aws_ses',
            userType,
            totalUsers: users.length,
            successful: 0,
            failed: users.length,
            error: error.message,
            message: 'AWS SES campaign failed'
        };
    }
};

// Test AWS SES connection
export const testSESConnection = async () => {
    try {
        console.log('🔍 Testing AWS SES connection...');
        
        const { fromEmail } = await getAWSCredentialsFromDB();
        
        // Try to send a test email to the from address (should be verified)
        const testResult = await sendSingleEmailViaSES(
            fromEmail,
            'AWS SES Connection Test',
            '<h2>AWS SES Test</h2><p>This is a test email to verify AWS SES connection.</p>',
            'AWS SES Test - This is a test email to verify AWS SES connection.'
        );
        
        if (testResult.success) {
            console.log('✅ AWS SES connection test successful');
            return {
                success: true,
                message: 'AWS SES connection working correctly',
                messageId: testResult.messageId
            };
        } else {
            console.log('❌ AWS SES connection test failed');
            return {
                success: false,
                message: 'AWS SES connection test failed',
                error: testResult.error
            };
        }
        
    } catch (error) {
        console.error('❌ AWS SES connection test error:', error);
        return {
            success: false,
            message: 'AWS SES connection test error',
            error: error.message
        };
    }
};

// Get AWS SES sending statistics
export const getSESStats = async () => {
    try {
        const credentials = await getAWSCredentialsFromDB();
        return {
            service: 'AWS SES',
            region: credentials.region,
            fromEmail: credentials.fromEmail,
            status: 'Connected'
        };
    } catch (error) {
        console.error('Error getting SES stats:', error);
        return {
            service: 'AWS SES',
            region: 'Unknown',
            fromEmail: 'Unknown',
            status: 'Error',
            error: error.message
        };
    }
};

export default {
    sendSingleEmailViaSES,
    sendBulkEmailViaSES,
    testSESConnection,
    getSESStats
};