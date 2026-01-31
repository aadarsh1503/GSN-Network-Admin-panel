import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

// Create transporter with GSN branding
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  // 1. Admin notification - New payment proof submitted
  adminNewPaymentProof: (data) => ({
    subject: 'New Subscription Payment Proof Submitted – Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #bca142, #D9B95B); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #bca142; }
          .cta-button { display: inline-block; background: #bca142; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Payment Proof Submitted</h1>
            <p>GSN Network - Admin Notification</p>
          </div>
          <div class="content">
            <h2>Payment Verification Required</h2>
            <p>A company has submitted payment proof for subscription verification. Please review the details below:</p>
            
            <div class="info-box">
              <h3>📋 Company Details</h3>
              <p><strong>Company Name:</strong> ${data.companyName}</p>
              <p><strong>Email:</strong> ${data.companyEmail}</p>
              <p><strong>Submission Date:</strong> ${data.submissionDate}</p>
            </div>
            
            <div class="info-box">
              <h3>💳 Subscription Details</h3>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Duration:</strong> ${data.planDuration}</p>
              <p><strong>Price:</strong> ${data.planPrice}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Transaction Reference:</strong> ${data.transactionReference}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/subscriptions-management" class="cta-button">
                🔍 Review Payment Proof
              </a>
            </div>
            
            <p><strong>Action Required:</strong> Please log into the admin panel to verify the payment proof and approve or reject the subscription.</p>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Freight Forwarding & Logistics</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 2. Company confirmation - Payment proof submitted
  companyPaymentSubmitted: (data) => ({
    subject: 'Payment Proof Submitted Successfully – Awaiting Admin Review',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #bca142, #D9B95B); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #28a745; }
          .status-badge { background: #ffc107; color: #212529; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Proof Submitted</h1>
            <p>GSN Network - Subscription Service</p>
          </div>
          <div class="content">
            <h2>Thank you, ${data.companyName}!</h2>
            <p>Your payment details have been successfully submitted and are now under review.</p>
            
            <div class="info-box">
              <h3>📋 Submission Details</h3>
              <p><strong>Plan Selected:</strong> ${data.planName}</p>
              <p><strong>Payment Reference:</strong> ${data.transactionReference}</p>
              <p><strong>Submission Date:</strong> ${data.submissionDate}</p>
              <p><strong>Status:</strong> <span class="status-badge">Under Review</span></p>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3>📧 Important Message</h3>
              <p><strong>Your payment details have been forwarded to the admin. Please wait while the admin reviews and verifies your submission.</strong></p>
              <p>You will receive an email notification once the review is complete.</p>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Freight Forwarding & Logistics</p>
            <p>Support: root@khaleeji.app | Website: ${process.env.FRONTEND_URL}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 3. Company approval - Subscription activated
  companyPaymentApproved: (data) => ({
    subject: 'Subscription Activated Successfully 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #28a745; }
          .success-badge { background: #28a745; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; }
          .cta-button { display: inline-block; background: #bca142; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Activated!</h1>
            <p>GSN Network - Welcome to Premium</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${data.companyName}!</h2>
            <p>Your subscription has been successfully activated. You now have full access to all premium features.</p>
            
            <div class="info-box">
              <h3>📋 Subscription Details</h3>
              <p><strong>Status:</strong> <span class="success-badge">Activated</span></p>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Start Date:</strong> ${data.startDate}</p>
              <p><strong>Expiry Date:</strong> ${data.expiryDate}</p>
              <p><strong>Invoice ID:</strong> ${data.invoiceId || 'Will be generated shortly'}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/company/dashboard" class="cta-button">
                🚀 Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>🎯 What's Next?</h3>
              <ul>
                <li>Access all premium features in your dashboard</li>
                <li>View your subscription details in the account section</li>
                <li>Download your invoice from the invoices page</li>
                <li>Contact support if you need any assistance</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>📞 Support Contact</h3>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
              <p>Our support team is available to help you get the most out of your subscription.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Freight Forwarding & Logistics</p>
            <p>Thank you for choosing GSN Network for your business needs!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 4. Admin confirmation - Subscription activated
  adminPaymentApproved: (data) => ({
    subject: 'Subscription Activated – Confirmation',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Subscription Activated</h1>
            <p>GSN Network - Admin Confirmation</p>
          </div>
          <div class="content">
            <h2>Subscription Successfully Activated</h2>
            <p>The following subscription has been activated and the company has been notified:</p>
            
            <div class="info-box">
              <h3>📋 Activation Details</h3>
              <p><strong>Company:</strong> ${data.companyName}</p>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Activation Date:</strong> ${data.activationDate}</p>
              <p><strong>Validity Period:</strong> ${data.startDate} to ${data.expiryDate}</p>
              <p><strong>Approved By:</strong> ${data.adminName}</p>
            </div>
            
            <p>The company has been sent a confirmation email with their subscription details and access information.</p>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Admin System</p>
            <p>This is an automated confirmation email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 5. Company rejection - Payment rejected
  companyPaymentRejected: (data) => ({
    subject: 'Subscription Payment Rejected – Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #dc3545; }
          .rejection-badge { background: #dc3545; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; }
          .cta-button { display: inline-block; background: #bca142; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Rejected</h1>
            <p>GSN Network - Action Required</p>
          </div>
          <div class="content">
            <h2>Dear ${data.companyName},</h2>
            <p>We regret to inform you that your subscription payment proof has been rejected after review.</p>
            
            <div class="info-box">
              <h3>📋 Rejection Details</h3>
              <p><strong>Status:</strong> <span class="rejection-badge">Rejected</span></p>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Rejection Date:</strong> ${data.rejectionDate}</p>
            </div>
            
            <div style="background: #f8d7da; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3>🔍 Rejection Reason</h3>
              <p><strong>${data.rejectionReason}</strong></p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>🔧 What Needs to be Corrected</h3>
              <p>${data.correctionNeeded || 'Please review the rejection reason above and resubmit with correct payment proof.'}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/company/plans" class="cta-button">
                🔄 Re-upload Payment Proof
              </a>
            </div>
            
            <div class="info-box">
              <h3>📞 Need Help?</h3>
              <p>If you have questions about the rejection or need assistance with resubmission:</p>
              <p><strong>Support Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
              <p>Our support team is here to help you resolve this issue quickly.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Freight Forwarding & Logistics</p>
            <p>We appreciate your understanding and look forward to serving you.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 6. Admin log - Payment rejected
  adminPaymentRejected: (data) => ({
    subject: 'Subscription Payment Rejected – Logged',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6c757d, #5a6268); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #6c757d; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Payment Rejection Logged</h1>
            <p>GSN Network - Admin Audit Trail</p>
          </div>
          <div class="content">
            <h2>Subscription Payment Rejection Record</h2>
            <p>The following subscription payment has been rejected and logged for audit purposes:</p>
            
            <div class="info-box">
              <h3>📋 Rejection Log</h3>
              <p><strong>Company:</strong> ${data.companyName}</p>
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Rejection Reason:</strong> ${data.rejectionReason}</p>
              <p><strong>Date & Time:</strong> ${data.rejectionDateTime}</p>
              <p><strong>Rejected By:</strong> ${data.adminName}</p>
              <p><strong>Admin Email:</strong> ${data.adminEmail}</p>
            </div>
            
            <p>The company has been notified of the rejection with the provided reason and instructions for resubmission.</p>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Admin Audit System</p>
            <p>This log entry has been recorded for compliance and audit purposes.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Main email sending function
const sendSubscriptionEmail = async (emailType, data) => {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[emailType];
    
    if (!template) {
      throw new Error(`Email template '${emailType}' not found`);
    }
    
    const emailContent = template(data);
    
    const mailOptions = {
      from: `"GSN Network (Gulf Star Network)" <${process.env.EMAIL_FROM}>`,
      to: data.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Log email in database
    await logEmailHistory({
      recipient_email: data.recipientEmail,
      email_type: emailType,
      subject: emailContent.subject,
      status: 'sent',
      message_id: result.messageId,
      subscription_id: data.subscriptionId || null,
      company_id: data.companyId || null,
      admin_id: data.adminId || null
    });
    
    console.log(`✅ Email sent successfully: ${emailType} to ${data.recipientEmail}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send email (${emailType}):`, error);
    
    // Log failed email
    await logEmailHistory({
      recipient_email: data.recipientEmail,
      email_type: emailType,
      subject: emailTemplates[emailType] ? emailTemplates[emailType](data).subject : 'Unknown',
      status: 'failed',
      error_message: error.message,
      subscription_id: data.subscriptionId || null,
      company_id: data.companyId || null,
      admin_id: data.adminId || null
    });
    
    return { success: false, error: error.message };
  }
};

// Log email history in database
const logEmailHistory = async (emailData) => {
  try {
    await db.execute(`
      INSERT INTO email_history (
        recipient_email, email_type, subject, status, message_id, 
        error_message, subscription_id, company_id, admin_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      emailData.recipient_email,
      emailData.email_type,
      emailData.subject,
      emailData.status,
      emailData.message_id || null,
      emailData.error_message || null,
      emailData.subscription_id,
      emailData.company_id,
      emailData.admin_id
    ]);
  } catch (error) {
    console.error('Failed to log email history:', error);
  }
};

// Workflow functions for each step
export const subscriptionEmailWorkflow = {
  // 1. Company submits payment proof
  async paymentProofSubmitted(subscriptionData) {
    const { companyId, companyName, companyEmail, planName, planDuration, planPrice, paymentMethod, transactionReference, subscriptionId } = subscriptionData;
    
    // Get all admin emails
    const [admins] = await db.execute('SELECT id, email, name FROM users WHERE role = "admin"');
    
    const submissionDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
    
    // Send email to all admins
    for (const admin of admins) {
      await sendSubscriptionEmail('adminNewPaymentProof', {
        recipientEmail: admin.email,
        companyName,
        companyEmail,
        planName,
        planDuration,
        planPrice,
        paymentMethod,
        transactionReference,
        submissionDate,
        subscriptionId,
        companyId,
        adminId: admin.id
      });
    }
    
    // Send confirmation to company
    await sendSubscriptionEmail('companyPaymentSubmitted', {
      recipientEmail: companyEmail,
      companyName,
      planName,
      transactionReference,
      submissionDate,
      subscriptionId,
      companyId
    });
  },
  
  // 2. Admin approves payment
  async paymentApproved(approvalData) {
    const { companyId, companyName, companyEmail, planName, startDate, expiryDate, invoiceId, adminId, adminName, adminEmail } = approvalData;
    
    const activationDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
    
    // Send approval to company
    await sendSubscriptionEmail('companyPaymentApproved', {
      recipientEmail: companyEmail,
      companyName,
      planName,
      startDate,
      expiryDate,
      invoiceId,
      companyId
    });
    
    // Send confirmation to admin
    await sendSubscriptionEmail('adminPaymentApproved', {
      recipientEmail: adminEmail,
      companyName,
      planName,
      activationDate,
      startDate,
      expiryDate,
      adminName,
      adminId,
      companyId
    });
  },
  
  // 3. Admin rejects payment
  async paymentRejected(rejectionData) {
    const { companyId, companyName, companyEmail, planName, rejectionReason, correctionNeeded, adminId, adminName, adminEmail } = rejectionData;
    
    const rejectionDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
    
    const rejectionDateTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
    
    // Send rejection to company
    await sendSubscriptionEmail('companyPaymentRejected', {
      recipientEmail: companyEmail,
      companyName,
      planName,
      rejectionReason,
      correctionNeeded,
      rejectionDate,
      companyId
    });
    
    // Send log to admin
    await sendSubscriptionEmail('adminPaymentRejected', {
      recipientEmail: adminEmail,
      companyName,
      planName,
      rejectionReason,
      rejectionDateTime,
      adminName,
      adminEmail,
      adminId,
      companyId
    });
  }
};

export default subscriptionEmailWorkflow;