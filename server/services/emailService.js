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
            from: `"GSN Network (Gulf Star Network)" <${process.env.EMAIL_FROM}>`,
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

    statusUpdate: (userName, quoteId, status, companyName, quoteDetails) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
            <!-- Header with Yellow Theme -->
            <div style="background-color: #fac800; color: #2c3e50; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #2c3e50;">📋 Quote Status Update</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; color: #2c3e50; opacity: 0.8;">Your shipment quote has been updated</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 20px;">
                <p style="font-size: 16px; color: #2c3e50; margin-bottom: 25px;">Dear <strong>${userName}</strong>,</p>
                
                <p style="font-size: 16px; color: #495057; line-height: 1.6; margin-bottom: 25px;">
                    We're writing to inform you that your freight quote status has been updated by the freight forwarder. 
                    Please find the updated details below:
                </p>
                
                <!-- Quote Details Card -->
                <div style="background-color: #fefce8; border: 1px solid #fac800; border-radius: 8px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #fac800; padding-bottom: 10px;">
                        📦 Quote Information
                    </h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Quote ID:</td>
                            <td style="padding: 10px 0; text-align: right;">
                                <span style="background-color: #fac800; color: #2c3e50; padding: 4px 12px; border-radius: 20px; font-weight: 600;">#${quoteId}</span>
                            </td>
                        </tr>
                        
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Freight Forwarder:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50; font-weight: 600;">${companyName}</td>
                        </tr>
                        
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Updated Status:</td>
                            <td style="padding: 10px 0; text-align: right;">
                                <span style="background-color: ${status === 'approved' ? '#28a745' : status === 'running' ? '#fac800' : status === 'completed' ? '#17a2b8' : '#6c757d'}; color: ${status === 'running' ? '#2c3e50' : 'white'}; padding: 6px 16px; border-radius: 20px; font-weight: 600; text-transform: uppercase;">
                                    ${status === 'running' ? '🚛 ' : status === 'completed' ? '✅ ' : status === 'approved' ? '✅ ' : '📋 '}${status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            </td>
                        </tr>
                        
                        ${quoteDetails && quoteDetails.fullOrigin ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Origin Address:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${quoteDetails.fullOrigin}</td>
                        </tr>
                        
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Destination Address:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${quoteDetails.fullDestination}</td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && quoteDetails.shipping_mode ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Shipping Mode:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${quoteDetails.shipping_mode}</td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && quoteDetails.cargo_type ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Product Description:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${quoteDetails.cargo_type}</td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && (quoteDetails.weight || quoteDetails.quantity) ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Cargo Details:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">
                                ${quoteDetails.quantity ? `Qty: ${quoteDetails.quantity}` : ''}
                                ${quoteDetails.weight ? `${quoteDetails.quantity ? ' | ' : ''}Weight: ${quoteDetails.weight}` : ''}
                            </td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && (quoteDetails.packing || quoteDetails.type) ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Packaging Details:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">
                                ${quoteDetails.type ? `Type: ${quoteDetails.type}` : ''}
                                ${quoteDetails.packing ? `${quoteDetails.type ? ' | ' : ''}Packing: ${quoteDetails.packing}` : ''}
                            </td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && quoteDetails.dimensions ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Dimensions:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${quoteDetails.dimensions}</td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && quoteDetails.incoterms ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Incoterms:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${quoteDetails.incoterms}</td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && (quoteDetails.is_hazardous || quoteDetails.is_stackable || quoteDetails.has_insurance) ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Special Requirements:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">
                                ${quoteDetails.is_hazardous ? '<span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; margin: 2px; font-size: 11px;">⚠️ Hazardous</span>' : ''}
                                ${quoteDetails.is_stackable ? '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 10px; margin: 2px; font-size: 11px;">📦 Stackable</span>' : ''}
                                ${quoteDetails.has_insurance ? '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 10px; margin: 2px; font-size: 11px;">🛡️ Insured</span>' : ''}
                            </td>
                        </tr>
                        ` : ''}
                        
                        ${quoteDetails && quoteDetails.arrival_date ? `
                        <tr style="border-bottom: 1px solid #ffe02a;">
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Expected Arrival:</td>
                            <td style="padding: 10px 0; text-align: right; color: #2c3e50;">${new Date(quoteDetails.arrival_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</td>
                        </tr>
                        ` : ''}
                        
                        <tr>
                            <td style="padding: 10px 0; font-weight: 600; color: #495057;">Last Updated:</td>
                            <td style="padding: 10px 0; text-align: right; color: #6c757d;">${new Date().toLocaleString('en-US', { 
                                weekday: 'long',
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}</td>
                        </tr>
                    </table>
                </div>
                
                ${quoteDetails && quoteDetails.notes ? `
                <!-- Additional Notes Section -->
                <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #0c5460; margin: 0 0 15px 0; font-size: 16px;">📝 Additional Notes:</h4>
                    <p style="color: #0c5460; margin: 0; line-height: 1.6; font-style: italic;">"${quoteDetails.notes}"</p>
                </div>
                ` : ''}
                
                <!-- Status Explanation -->
                <div style="background-color: #fff3cd; border-left: 4px solid #fac800; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">ℹ️ What does "${status.charAt(0).toUpperCase() + status.slice(1)}" mean?</h4>
                    <p style="color: #856404; margin: 0; line-height: 1.5;">
                        ${status === 'approved' ? 'Your quote has been approved and is ready for shipment. The freight forwarder will contact you soon with next steps.' :
                          status === 'running' ? 'Your shipment is currently in transit. You can track its progress and expect updates along the way.' :
                          status === 'completed' ? 'Your shipment has been successfully delivered to the destination. Thank you for choosing our service!' :
                          status === 'pending' ? 'Your quote is being reviewed by our team. We will update you once there are any changes.' :
                          'Your quote status has been updated. Please check your dashboard for more details.'}
                    </p>
                </div>
                
                <!-- Action Buttons -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${process.env.FRONTEND_URL}/user/quotes/${quoteId}" 
                       style="background-color: #fac800; color: #2c3e50; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: 600; margin-right: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(250, 200, 0, 0.3);">
                       📋 View Full Quote Details
                    </a>
                    
                    <a href="${process.env.FRONTEND_URL}/user/quotes" 
                       style="background-color: transparent; color: #fac800; padding: 14px 28px; text-decoration: none; border: 2px solid #fac800; border-radius: 25px; font-weight: 600; display: inline-block;">
                       📦 View All My Quotes
                    </a>
                </div>
                
                <!-- Contact Information -->
                <div style="background-color: #fefce8; border: 1px solid #ffe02a; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">📞 Need Help?</h4>
                    <p style="color: #6c757d; margin: 0; line-height: 1.6;">
                        If you have any questions about this update or need assistance with your shipment, 
                        please don't hesitate to contact our support team or reach out to your freight forwarder directly.
                    </p>
                </div>
            </div>
            
            <!-- Footer with Yellow Theme -->
            <div style="background-color: #2c3e50; color: white; padding: 25px 20px; text-align: center;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h1 style="color: #fac800; margin: 0; font-size: 24px;">GSN Network</h1>
                    <p style="color: #ffe02a; margin: 5px 0; font-size: 14px;">Gulf Star Network</p>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: white;">Thank you for choosing GSN Network!</p>
                <p style="margin: 0; font-size: 14px; color: #bdc3c7;">
                    We're committed to providing you with the best freight forwarding experience.
                </p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #495057;">
                    <p style="margin: 0; font-size: 12px; color: #95a5a6;">
                        Best regards,<br>
                        <strong style="color: #fac800;">GSN Network (Gulf Star Network)</strong><br>
                        <span style="color: #ffe02a;">Connecting Global Trade</span>
                    </p>
                </div>
            </div>
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
const sendStatusUpdateNotification = async (userEmail, userName, quoteId, status, companyName = 'Freight Forwarder', quoteDetails = null) => {
    const subject = `📋 Quote Status Update - Quote #${quoteId} | ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const htmlContent = emailTemplates.statusUpdate(userName, quoteId, status, companyName, quoteDetails);
    
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