// Improved Email Service with better error handling and validation
import nodemailer from 'nodemailer';
import db from '../config/db.js';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create transporter with better error handling
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Connection timeout
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        
        // Retry configuration
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        
        // Debug options (disable in production)
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
    });
};

// Validate email address
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return emailRegex.test(email.trim());
};

// Enhanced send email function with better error handling
const sendEmailImproved = async (to, subject, htmlContent, type = 'general', quoteId = null, retries = 3) => {
    // Validate email address
    if (!isValidEmail(to)) {
        const error = `Invalid email address: ${to}`;
        console.error('❌ Email validation failed:', error);
        
        // Log failed email to database
        try {
            await db.execute(
                `INSERT INTO email_notifications (recipient_email, subject, message, type, quote_id, status, error_message) 
                 VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
                [to, subject, htmlContent, type, quoteId, error]
            );
        } catch (dbError) {
            console.error('Failed to log email failure to database:', dbError);
        }
        
        return { success: false, error: error, errorType: 'INVALID_EMAIL' };
    }

    const transporter = createTransporter();
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📧 Sending email to ${to} (Attempt ${attempt}/${retries})`);
            
            const mailOptions = {
                from: `"GSN Network (Gulf Star Network)" <${process.env.EMAIL_FROM}>`,
                to: to.trim(),
                subject: subject,
                html: htmlContent,
                // Add headers for better deliverability
                headers: {
                    'X-Mailer': 'GSN Network Email System',
                    'X-Priority': '3',
                    'X-MSMail-Priority': 'Normal'
                }
            };

            const info = await transporter.sendMail(mailOptions);
            
            // Check if email was rejected
            if (info.rejected && info.rejected.length > 0) {
                const error = `Email rejected by server: ${info.rejected.join(', ')}`;
                console.error('❌ Email rejected:', error);
                
                // Log failed email to database
                await db.execute(
                    `INSERT INTO email_notifications (recipient_email, subject, message, type, quote_id, status, error_message) 
                     VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
                    [to, subject, htmlContent, type, quoteId, error]
                );
                
                return { success: false, error: error, errorType: 'REJECTED' };
            }
            
            // Log successful email to database
            await db.execute(
                `INSERT INTO email_notifications (recipient_email, subject, message, type, quote_id, status) 
                 VALUES (?, ?, ?, ?, ?, 'sent')`,
                [to, subject, htmlContent, type, quoteId]
            );

            console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed for ${to}:`, error.message);
            
            // Analyze error type
            let errorType = 'UNKNOWN';
            let shouldRetry = false;
            
            if (error.code === 'EENVELOPE') {
                errorType = 'INVALID_FORMAT';
            } else if (error.code === 'ENOTFOUND') {
                errorType = 'DOMAIN_NOT_FOUND';
            } else if (error.responseCode === 550) {
                errorType = 'MAILBOX_UNAVAILABLE';
            } else if (error.responseCode === 554) {
                errorType = 'SPAM_REJECTED';
            } else if (error.responseCode === 421) {
                errorType = 'RATE_LIMITED';
                shouldRetry = true; // Retry for rate limiting
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
                errorType = 'CONNECTION_TIMEOUT';
                shouldRetry = true; // Retry for connection issues
            } else if (error.responseCode >= 400 && error.responseCode < 500) {
                errorType = 'CLIENT_ERROR';
            } else if (error.responseCode >= 500) {
                errorType = 'SERVER_ERROR';
                shouldRetry = true; // Retry for server errors
            }
            
            // If this is the last attempt or shouldn't retry, log failure
            if (attempt === retries || !shouldRetry) {
                try {
                    await db.execute(
                        `INSERT INTO email_notifications (recipient_email, subject, message, type, quote_id, status, error_message) 
                         VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
                        [to, subject, htmlContent, type, quoteId, `${errorType}: ${error.message}`]
                    );
                } catch (dbError) {
                    console.error('Failed to log email failure to database:', dbError);
                }
                
                return { 
                    success: false, 
                    error: error.message, 
                    errorType: errorType,
                    attempts: attempt
                };
            }
            
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Batch email sending with improved error handling
const sendBulkEmailsImproved = async (users, subject, body) => {
    console.log(`📧 Starting bulk email send to ${users.length} users`);
    
    const results = {
        total: users.length,
        successful: 0,
        failed: 0,
        errors: []
    };
    
    // Process emails in batches to avoid overwhelming the server
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
        
        const batchPromises = batch.map(async (user) => {
            const personalizedBody = body.replace(/\{name\}/g, user.name || 'Valued User');
            const result = await sendEmailImproved(user.email, subject, personalizedBody, 'bulk');
            
            if (result.success) {
                results.successful++;
            } else {
                results.failed++;
                results.errors.push({
                    email: user.email,
                    error: result.error,
                    errorType: result.errorType
                });
            }
            
            return result;
        });
        
        await Promise.all(batchPromises);
        
        // Add delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
            console.log('⏳ Waiting 2 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`✅ Bulk email completed: ${results.successful} successful, ${results.failed} failed`);
    
    // Log error summary
    if (results.errors.length > 0) {
        console.log('❌ Failed emails summary:');
        const errorSummary = {};
        results.errors.forEach(error => {
            errorSummary[error.errorType] = (errorSummary[error.errorType] || 0) + 1;
        });
        console.log(errorSummary);
    }
    
    return results;
};

// Verify transporter configuration on startup
const verifyEmailConfiguration = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email server is ready to send messages');
        return true;
    } catch (error) {
        console.error('❌ Email transporter verification failed:', error);
        return false;
    }
};

export {
    sendEmailImproved as sendEmail,
    sendBulkEmailsImproved as sendBulkEmails,
    verifyEmailConfiguration,
    isValidEmail
};