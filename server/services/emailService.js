// services/emailService.js
import nodemailer from 'nodemailer';
import db from '../config/db.js';

// Create transporter using the provided email configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Send email notification
const sendEmail = async (to, subject, htmlContent, type = 'general', quoteId = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Log email notification to database
        await db.execute(
            `INSERT INTO email_notifications (recipient_email, subject, message, type, quote_id, status) 
             VALUES (?, ?, ?, ?, ?, 'sent')`,
            [to, subject, htmlContent, type, quoteId]
        );

        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending email:', error);
        
        // Log failed email to database
        await db.execute(
            `INSERT INTO email_notifications (recipient_email, subject, message, type, quote_id, status) 
             VALUES (?, ?, ?, ?, ?, 'failed')`,
            [to, subject, htmlContent, type, quoteId]
        );

        return { success: false, error: error.message };
    }
};

// Email templates
const emailTemplates = {
    quoteResponse: (userName, companyName, quoteId, price, transitTime) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Quote Response Received</h2>
            <p>Dear ${userName},</p>
            <p>You have received a new quote response for your request (Quote #${quoteId}).</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #495057;">Quote Details:</h3>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Price:</strong> $${price}</p>
                <p><strong>Transit Time:</strong> ${transitTime}</p>
            </div>
            
            <p>Please log in to your account to view the complete details and respond to this quote.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/user/quotes" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                   View Quote Details
                </a>
            </div>
            
            <p>Best regards,<br>GSN Team</p>
        </div>
    `,

    quoteAccepted: (companyName, userName, quoteId) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Quote Accepted!</h2>
            <p>Dear ${companyName},</p>
            <p>Great news! ${userName} has accepted your quote for Quote #${quoteId}.</p>
            
            <p>You can now proceed with the shipment arrangements. Please contact the customer to finalize the details.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/company/my-quotes" 
                   style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                   View Quote Details
                </a>
            </div>
            
            <p>Best regards,<br>GSN Team</p>
        </div>
    `,

    quoteRejected: (companyName, userName, quoteId) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Quote Not Selected</h2>
            <p>Dear ${companyName},</p>
            <p>${userName} has decided not to proceed with your quote for Quote #${quoteId}.</p>
            
            <p>Thank you for your participation. We encourage you to continue responding to other quote requests.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/company/freight-quotes" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                   View Available Quotes
                </a>
            </div>
            
            <p>Best regards,<br>GSN Team</p>
        </div>
    `,

    statusUpdate: (userName, quoteId, status) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Quote Status Update</h2>
            <p>Dear ${userName},</p>
            <p>Your quote status has been updated. Thank you.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Quote ID:</strong> #${quoteId}</p>
                <p><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/user/quotes" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                   View Quote Details
                </a>
            </div>
            
            <p>Best regards,<br>GSN Team</p>
        </div>
    `,

    userAcceptanceThankYou: (userName, quoteId, companyName, companyEmail, companyPhone) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Thank You for Accepting Our Quote!</h2>
            <p>Dear ${userName},</p>
            <p>Thank you for accepting our quote for Quote #${quoteId}. We are excited to work with you!</p>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-top: 0;">Your Selected Freight Forwarder:</h3>
                <p style="margin: 5px 0; color: #155724;"><strong>Company:</strong> ${companyName}</p>
                <p style="margin: 5px 0; color: #155724;"><strong>Email:</strong> ${companyEmail}</p>
                ${companyPhone ? `<p style="margin: 5px 0; color: #155724;"><strong>Phone:</strong> ${companyPhone}</p>` : ''}
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Next Steps:</h3>
                <ul style="color: #495057; padding-left: 20px;">
                    <li>Our team will contact you shortly to finalize the shipment details</li>
                    <li>Please keep your shipping documents ready</li>
                    <li>We will provide you with tracking information once the shipment begins</li>
                    <li>Feel free to contact us if you have any questions</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/user/quotes/${quoteId}" 
                   style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                   View Quote Details
                </a>
                <a href="mailto:${companyEmail}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                   Contact Company
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                We appreciate your business and look forward to serving you!<br><br>
                Best regards,<br>
                GSN Team
            </p>
        </div>
    `
};

// Send quote response notification to user
const sendQuoteResponseNotification = async (userEmail, userName, companyName, quoteId, price, transitTime) => {
    const subject = `New Quote Response - Quote #${quoteId}`;
    const htmlContent = emailTemplates.quoteResponse(userName, companyName, quoteId, price, transitTime);
    
    return await sendEmail(userEmail, subject, htmlContent, 'quote_response', quoteId);
};

// Send quote acceptance notification to company
const sendQuoteAcceptanceNotification = async (companyEmail, companyName, userName, quoteId) => {
    const subject = `Quote Accepted - Quote #${quoteId}`;
    const htmlContent = emailTemplates.quoteAccepted(companyName, userName, quoteId);
    
    return await sendEmail(companyEmail, subject, htmlContent, 'acceptance', quoteId);
};

// Send quote rejection notification to company
const sendQuoteRejectionNotification = async (companyEmail, companyName, userName, quoteId) => {
    const subject = `Quote Update - Quote #${quoteId}`;
    const htmlContent = emailTemplates.quoteRejected(companyName, userName, quoteId);
    
    return await sendEmail(companyEmail, subject, htmlContent, 'rejection', quoteId);
};

// Send status update notification to user
const sendStatusUpdateNotification = async (userEmail, userName, quoteId, status) => {
    const subject = `Quote Status Update - Quote #${quoteId}`;
    const htmlContent = emailTemplates.statusUpdate(userName, quoteId, status);
    
    return await sendEmail(userEmail, subject, htmlContent, 'status_update', quoteId);
};

// Send thank you email to user when they accept a quote
const sendUserAcceptanceThankYou = async (userEmail, userName, quoteId, companyName, companyEmail, companyPhone) => {
    const subject = `Thank You for Accepting Quote #${quoteId}`;
    const htmlContent = emailTemplates.userAcceptanceThankYou(userName, quoteId, companyName, companyEmail, companyPhone);
    
    return await sendEmail(userEmail, subject, htmlContent, 'user_acceptance', quoteId);
};

export {
    sendEmail,
    sendQuoteResponseNotification,
    sendQuoteAcceptanceNotification,
    sendQuoteRejectionNotification,
    sendStatusUpdateNotification,
    sendUserAcceptanceThankYou
};