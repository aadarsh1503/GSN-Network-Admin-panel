import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

// Create transporter with GSN branding
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// GSN Network Email Template
const createEmailTemplate = (title, content, footerNote = '') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #CDA435 0%, #B8941F 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
            .header p { color: #FFF3CD; margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; }
            .footer p { color: #6c757d; margin: 0; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #CDA435 0%, #B8941F 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .btn:hover { background: linear-gradient(135deg, #B8941F 0%, #A67C1A 100%); }
            .ticket-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #CDA435; }
            .priority-high { border-left-color: #dc3545; }
            .priority-urgent { border-left-color: #dc3545; background-color: #fff5f5; }
            .priority-medium { border-left-color: #ffc107; }
            .priority-low { border-left-color: #28a745; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-answered { background-color: #d1ecf1; color: #0c5460; }
            .status-closed { background-color: #d4edda; color: #155724; }
            .recipient-info { background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .company-ticket { background-color: #f3e5f5; border-left-color: #9c27b0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎫 GSN Support Center</h1>
                <p>Professional Customer Support & Ticket Management</p>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p><strong>GSN Network (Gulf Star Network)</strong></p>
                <p>Professional Freight Forwarding & Logistics Solutions</p>
                ${footerNote ? `<p style="margin-top: 15px; font-style: italic;">${footerNote}</p>` : ''}
            </div>
        </div>
    </body>
    </html>
  `;
};

// Get admin emails - ONLY from database
const getAdminEmails = async () => {
  try {
    console.log('🔍 Fetching admin emails from database...');
    const [admins] = await db.execute(
      'SELECT id, name, email FROM users WHERE role = "admin" AND email IS NOT NULL AND email != ""'
    );
    
    console.log(`📋 Found ${admins.length} admin users in database:`);
    admins.forEach(admin => {
      console.log(`   - ID: ${admin.id}, Name: ${admin.name || 'No name'}, Email: ${admin.email}`);
    });
    
    // Filter out valid emails only
    const adminEmails = admins
      .map(admin => admin.email)
      .filter(email => email && email.trim() && email.includes('@'));
    
    console.log(`📧 Valid admin emails for notifications (${adminEmails.length}):`, adminEmails);
    
    if (adminEmails.length === 0) {
      console.log('⚠️ No valid admin emails found in database!');
      console.log('💡 Please update admin user emails in the database to receive notifications');
      return []; // Return empty array - let the calling function handle this
    }
    
    return adminEmails;
  } catch (error) {
    console.error('❌ Error fetching admin emails:', error);
    return []; // Return empty array on error
  }
};

// Send ticket creation notification
export const sendTicketCreationNotification = async (ticketData, recipientEmails) => {
  const transporter = createTransporter();
  
  try {
    const { ticket_number, subject, description, priority, category, user_name, user_email, user_role, recipient_type, recipient_name } = ticketData;
    
    const priorityClass = `priority-${priority}`;
    const isCompanyTicket = recipient_type === 'company';
    
    const content = `
      <h2>🎫 New Support Ticket Created</h2>
      <p>A new support ticket has been submitted and requires attention.</p>
      
      <div class="ticket-info ${priorityClass} ${isCompanyTicket ? 'company-ticket' : ''}">
        <h3>📋 Ticket Information</h3>
        <p><strong>Ticket Number:</strong> ${ticket_number}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> <span class="status-badge priority-${priority}">${priority.toUpperCase()}</span></p>
        <p><strong>Status:</strong> <span class="status-badge status-pending">PENDING</span></p>
      </div>
      
      <div class="recipient-info">
        <h3>👤 Submitted By</h3>
        <p><strong>Name:</strong> ${user_name}</p>
        <p><strong>Email:</strong> ${user_email}</p>
        <p><strong>Role:</strong> ${user_role.charAt(0).toUpperCase() + user_role.slice(1)}</p>
      </div>
      
      ${isCompanyTicket ? `
        <div class="recipient-info company-ticket">
          <h3>🏢 Ticket Recipient</h3>
          <p><strong>Company:</strong> ${recipient_name}</p>
          <p><strong>Type:</strong> Company Support Ticket</p>
          <p style="color: #9c27b0; font-weight: bold;">⚠️ This ticket was sent to a specific company for support</p>
        </div>
      ` : ''}
      
      <div class="ticket-info">
        <h3>📝 Description</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${description}</p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
        <p><strong>⏰ Action Required:</strong> Please review and respond to this ticket promptly.</p>
        <p>Response time expectations: ${priority === 'urgent' ? '1 hour' : priority === 'high' ? '4 hours' : priority === 'medium' ? '24 hours' : '48 hours'}</p>
      </div>
    `;
    
    const subject_line = `🎫 New ${isCompanyTicket ? 'Company ' : ''}Support Ticket: ${ticket_number} - ${priority.toUpperCase()} Priority`;
    const html = createEmailTemplate('New Support Ticket', content, 'This is an automated notification from GSN Support Center');
    
    // Send to all recipients with individual error handling
    const emailResults = [];
    console.log(`📧 Attempting to send emails to ${recipientEmails.length} recipients:`, recipientEmails);
    
    for (const email of recipientEmails) {
      try {
        const mailOptions = {
          from: `"GSN Support Center" <${process.env.EMAIL_FROM}>`,
          to: email,
          subject: subject_line,
          html: html
        };
        
        console.log(`📤 Sending email to: ${email}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ Ticket creation notification sent successfully to: ${email}`);
        emailResults.push({ email, status: 'sent', error: null });
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${email}:`, emailError.message);
        emailResults.push({ email, status: 'failed', error: emailError.message });
        // Continue sending to other recipients even if one fails
      }
    }
    
    // Log results
    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failCount = emailResults.filter(r => r.status === 'failed').length;
    console.log(`📊 Email sending results: ${successCount} sent, ${failCount} failed`);
    
    // Log to database (even if some emails failed)
    try {
      await db.execute(
        `INSERT INTO email_notifications (recipient_email, subject, message, type, status, created_at) 
         VALUES (?, ?, ?, 'ticket_creation', ?, NOW())`,
        [recipientEmails.join(','), subject_line, content, successCount > 0 ? 'sent' : 'failed']
      );
    } catch (dbError) {
      console.error('❌ Error logging email to database:', dbError.message);
    }
    
    return { 
      success: successCount > 0, 
      emailResults,
      successCount,
      failCount
    };
    
  } catch (error) {
    console.error('❌ Error sending ticket creation notification:', error);
    return { success: false, error: error.message };
  }
};

// Send ticket response notification
export const sendTicketResponseNotification = async (ticketData, responseData, recipientEmail) => {
  const transporter = createTransporter();
  
  try {
    const { ticket_number, subject, priority, user_name, recipient_type, recipient_name, user_role } = ticketData;
    const { status, admin_response, admin_name } = responseData;
    
    const isCompanyTicket = recipient_type === 'company';
    
    // Determine the correct URL based on user role
    let viewTicketsUrl = '/user/help'; // Default for regular users
    if (user_role === 'business') {
      viewTicketsUrl = '/business/help';
    } else if (user_role === 'company') {
      viewTicketsUrl = '/company/my-tickets';
    }
    
    const content = `
      <h2>📬 Support Ticket Response</h2>
      <p>Your support ticket has been updated with a response from our team.</p>
      
      <div class="ticket-info priority-${priority}">
        <h3>📋 Ticket Information</h3>
        <p><strong>Ticket Number:</strong> ${ticket_number}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${status}">${status.toUpperCase()}</span></p>
        <p><strong>Responded By:</strong> ${admin_name || 'GSN Support Team'}</p>
      </div>
      
      ${isCompanyTicket ? `
        <div class="recipient-info company-ticket">
          <h3>🏢 Company Ticket</h3>
          <p>This ticket was originally sent to: <strong>${recipient_name}</strong></p>
        </div>
      ` : ''}
      
      ${admin_response ? `
        <div class="ticket-info">
          <h3>💬 Support Team Response</h3>
          <p style="white-space: pre-wrap; line-height: 1.6; background-color: #f8f9fa; padding: 15px; border-radius: 6px;">${admin_response}</p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}${viewTicketsUrl}" class="btn">
          🎯 View Your Tickets
        </a>
      </div>
      
      <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
        <p><strong>📞 Need Further Assistance?</strong></p>
        <p>If you need additional help, you can reply to this ticket or create a new support request.</p>
        <p>Our support team is here to help you 24/7!</p>
      </div>
    `;
    
    const subject_line = `📬 Ticket Response: ${ticket_number} - ${status.toUpperCase()}`;
    const html = createEmailTemplate('Ticket Response', content, 'Thank you for using GSN Support Center');
    
    const mailOptions = {
      from: `"GSN Support Center" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: subject_line,
      html: html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket response notification sent to: ${recipientEmail}`);
    
    // Log to database
    await db.execute(
      `INSERT INTO email_notifications (recipient_email, subject, message, type, status, created_at) 
       VALUES (?, ?, ?, 'ticket_response', 'sent', NOW())`,
      [recipientEmail, subject_line, content]
    );
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending ticket response notification:', error);
    return { success: false, error: error.message };
  }
};

// Send ticket status update notification
export const sendTicketStatusUpdateNotification = async (ticketData, oldStatus, newStatus, recipientEmail) => {
  const transporter = createTransporter();
  
  try {
    const { ticket_number, subject, priority, user_name, recipient_type, recipient_name, user_role } = ticketData;
    
    const isCompanyTicket = recipient_type === 'company';
    
    // Determine the correct URL based on user role
    let viewTicketsUrl = '/user/help'; // Default for regular users
    if (user_role === 'business') {
      viewTicketsUrl = '/business/help';
    } else if (user_role === 'company') {
      viewTicketsUrl = '/company/my-tickets';
    }
    
    const content = `
      <h2>🔄 Ticket Status Update</h2>
      <p>The status of your support ticket has been updated.</p>
      
      <div class="ticket-info priority-${priority}">
        <h3>📋 Ticket Information</h3>
        <p><strong>Ticket Number:</strong> ${ticket_number}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Previous Status:</strong> <span class="status-badge status-${oldStatus}">${oldStatus.toUpperCase()}</span></p>
        <p><strong>New Status:</strong> <span class="status-badge status-${newStatus}">${newStatus.toUpperCase()}</span></p>
      </div>
      
      ${isCompanyTicket ? `
        <div class="recipient-info company-ticket">
          <h3>🏢 Company Ticket</h3>
          <p>This ticket was originally sent to: <strong>${recipient_name}</strong></p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}${viewTicketsUrl}" class="btn">
          🎯 View Ticket Details
        </a>
      </div>
      
      ${newStatus === 'closed' ? `
        <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
          <p><strong>✅ Ticket Closed</strong></p>
          <p>Your support ticket has been resolved and closed. If you need further assistance, please create a new ticket.</p>
        </div>
      ` : `
        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
          <p><strong>📞 Need Further Assistance?</strong></p>
          <p>Our support team is actively working on your ticket. You'll receive updates as we progress.</p>
        </div>
      `}
    `;
    
    const subject_line = `🔄 Ticket Status Update: ${ticket_number} - Now ${newStatus.toUpperCase()}`;
    const html = createEmailTemplate('Ticket Status Update', content, 'Thank you for using GSN Support Center');
    
    const mailOptions = {
      from: `"GSN Support Center" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: subject_line,
      html: html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket status update notification sent to: ${recipientEmail}`);
    
    // Log to database
    await db.execute(
      `INSERT INTO email_notifications (recipient_email, subject, message, type, status, created_at) 
       VALUES (?, ?, ?, 'ticket_status_update', 'sent', NOW())`,
      [recipientEmail, subject_line, content]
    );
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending ticket status update notification:', error);
    return { success: false, error: error.message };
  }
};

// Main function to send ticket emails based on type
export const sendTicketEmail = async (type, ticketData, additionalData = {}) => {
  try {
    console.log(`📧 Sending ticket email: ${type}`);
    
    switch (type) {
      case 'ticket_created':
        // Determine recipients based on ticket type
        let recipients = [];
        
        if (ticketData.recipient_type === 'company' && ticketData.recipient_id) {
          // Company ticket - send to company and admin
          console.log(`🏢 Company ticket - fetching company email for ID: ${ticketData.recipient_id}`);
          const [companyRows] = await db.execute(
            'SELECT email FROM users WHERE id = ? AND role = "company" AND email IS NOT NULL AND email != ""',
            [ticketData.recipient_id]
          );
          
          if (companyRows.length > 0 && companyRows[0].email) {
            recipients.push(companyRows[0].email);
            console.log(`✅ Added company email: ${companyRows[0].email}`);
          } else {
            console.log(`⚠️ No valid email found for company ID: ${ticketData.recipient_id}`);
          }
          
          // Also send to ALL admin users
          console.log('👥 Fetching all admin emails...');
          const adminEmails = await getAdminEmails();
          if (adminEmails.length > 0) {
            recipients.push(...adminEmails);
            console.log(`✅ Added ${adminEmails.length} admin emails`);
          } else {
            console.log('⚠️ No valid admin emails found in database');
          }
        } else {
          // Admin ticket - send to ALL admin users only
          console.log('👥 Admin ticket - fetching all admin emails...');
          const adminEmails = await getAdminEmails();
          if (adminEmails.length > 0) {
            recipients = adminEmails;
            console.log(`✅ Will send to ${adminEmails.length} admin users`);
          } else {
            console.log('❌ No valid admin emails found - cannot send notifications!');
            return { 
              success: false, 
              error: 'No valid admin emails found in database. Please update admin user emails.' 
            };
          }
        }
        
        // Remove duplicates and filter out invalid emails
        recipients = [...new Set(recipients)].filter(email => email && email.trim() && email.includes('@'));
        
        if (recipients.length === 0) {
          console.log('❌ No valid recipient emails found after filtering');
          return { 
            success: false, 
            error: 'No valid recipient emails found. Please check admin and company email addresses in database.' 
          };
        }
        
        console.log(`📧 Final recipient list (${recipients.length} emails):`, recipients);
        
        return await sendTicketCreationNotification(ticketData, recipients);
        
      case 'ticket_response':
        return await sendTicketResponseNotification(ticketData, additionalData, ticketData.user_email);
        
      case 'ticket_status_update':
        return await sendTicketStatusUpdateNotification(
          ticketData, 
          additionalData.oldStatus, 
          additionalData.newStatus, 
          ticketData.user_email
        );
        
      default:
        console.log(`⚠️ Unknown ticket email type: ${type}`);
        return { success: false, error: 'Unknown email type' };
    }
    
  } catch (error) {
    console.error('❌ Error in sendTicketEmail:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendTicketEmail,
  sendTicketCreationNotification,
  sendTicketResponseNotification,
  sendTicketStatusUpdateNotification
};