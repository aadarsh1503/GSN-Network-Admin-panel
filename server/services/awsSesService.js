// AWS SES Service - Direct email sending via Amazon SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate AWS credentials
const validateAWSCredentials = () => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;
    
    if (!accessKeyId || !secretAccessKey || !region) {
        throw new Error(`Missing AWS credentials: 
            AWS_ACCESS_KEY_ID: ${accessKeyId ? 'Set' : 'Missing'}
            AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? 'Set' : 'Missing'}
            AWS_REGION: ${region ? 'Set' : 'Missing'}`);
    }
    
    console.log('🔑 AWS Credentials validation:');
    console.log(`   Access Key ID: ${accessKeyId.substring(0, 8)}...`);
    console.log(`   Secret Key: ${secretAccessKey.substring(0, 8)}...`);
    console.log(`   Region: ${region}`);
    
    return { accessKeyId, secretAccessKey, region };
};

// Configure AWS SES Client
let sesClient;
try {
    const credentials = validateAWSCredentials();
    sesClient = new SESClient({
        region: credentials.region,
        credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey
        }
    });
    console.log('✅ AWS SES Client initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize AWS SES Client:', error.message);
}

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || 'info@promo.gulfstarnetwork.com';
const FROM_NAME = process.env.AWS_SES_FROM_NAME || 'GSN Network';

// Send single email via AWS SES
export const sendSingleEmailViaSES = async (toEmail, subject, htmlContent, textContent = '') => {
    try {
        if (!sesClient) {
            throw new Error('AWS SES Client not initialized. Check your AWS credentials.');
        }
        
        console.log(`📧 Sending single email via AWS SES to: ${toEmail}`);
        
        const params = {
            Source: `${FROM_NAME} <${FROM_EMAIL}>`,
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
        console.log(`📧 Starting AWS SES bulk email campaign for ${userType} with ${users.length} users`);
        console.log(`📧 Subject: ${subject}`);
        console.log(`📧 From: ${FROM_NAME} <${FROM_EMAIL}>`);
        
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
                // Prepare destinations for bulk send
                const destinations = batch.map(user => ({
                    Destination: {
                        ToAddresses: [user.email]
                    },
                    ReplacementTemplateData: JSON.stringify({
                        name: user.name || 'Valued Customer'
                    })
                }));

                // Prepare the bulk email parameters
                const bulkParams = {
                    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
                    Template: 'DefaultTemplate', // We'll use a simple approach instead
                    DefaultTemplateData: JSON.stringify({
                        subject: subject,
                        content: htmlContent
                    }),
                    Destinations: destinations
                };

                // Since we don't have a template set up, let's send individual emails in this batch
                // This is more reliable for the initial implementation
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
        
        // Try to send a test email to the from address (should be verified)
        const testResult = await sendSingleEmailViaSES(
            FROM_EMAIL,
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
        // For now, return basic info. In production, you might want to use GetSendStatistics
        return {
            service: 'AWS SES',
            region: process.env.AWS_REGION,
            fromEmail: FROM_EMAIL,
            status: 'Connected'
        };
    } catch (error) {
        console.error('Error getting SES stats:', error);
        return {
            service: 'AWS SES',
            region: process.env.AWS_REGION,
            fromEmail: FROM_EMAIL,
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