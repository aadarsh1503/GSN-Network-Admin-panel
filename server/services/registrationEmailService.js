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
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Registration email templates
const registrationEmailTemplates = {
  // 1. Welcome email for regular users
  userWelcome: (data) => ({
    subject: 'Welcome to GSN Network - Your Account is Ready! 🎉',
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
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to GSN Network!</h1>
            <p>Your freight forwarding journey starts here</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Welcome to GSN Network (Gulf Star Network) - your trusted partner in freight forwarding and logistics solutions.</p>
            
            <div class="info-box">
              <h3>🎯 Your Account Details</h3>
              <p><strong>Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Account Type:</strong> Regular User</p>
              <p><strong>Registration Date:</strong> ${data.registrationDate}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>🚀 What You Can Do Now</h3>
              <ul>
                <li>Browse our comprehensive company directory</li>
                <li>Submit freight quote requests</li>
                <li>Compare quotes from multiple companies</li>
                <li>Track your shipments and logistics</li>
                <li>Access customer support</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/login" class="cta-button">
                🚀 Start Exploring
              </a>
            </div>
            
            <div class="info-box">
              <h3>📞 Need Help?</h3>
              <p>Our support team is here to help you get started:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Freight Forwarding & Logistics</p>
            <p>Thank you for choosing GSN Network for your logistics needs!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 2. Welcome email for business users
  businessWelcome: (data) => ({
    subject: 'Welcome to GSN Network - Business Account Activated! 🏢',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #007bff; }
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Welcome to GSN Network!</h1>
            <p>Your business logistics partner</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Welcome to GSN Network! Your business account has been successfully created and is ready to use.</p>
            
            <div class="info-box">
              <h3>🎯 Your Business Account</h3>
              <p><strong>Business Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Account Type:</strong> Business User</p>
              <p><strong>Registration Date:</strong> ${data.registrationDate}</p>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>💼 Business Features Available</h3>
              <ul>
                <li>Submit multiple freight quote requests</li>
                <li>Manage business logistics operations</li>
                <li>Access to business dashboard</li>
                <li>Priority customer support</li>
                <li>Bulk quote management</li>
                <li>Business analytics and reporting</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/business/dashboard" class="cta-button">
                📊 Access Business Dashboard
              </a>
            </div>
            
            <div class="info-box">
              <h3>📞 Business Support</h3>
              <p>Dedicated support for your business needs:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Your Business Logistics Partner</p>
            <p>Empowering businesses with reliable freight solutions!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 3. Welcome email for company users (pending approval)
  companyWelcomePending: (data) => ({
    subject: 'GSN Network Registration - Pending Admin Approval ⏳',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #ffc107; }
          .warning-box { background: #fff3cd; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #ffc107; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏳ Registration Received!</h1>
            <p>GSN Network - Company Registration</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Thank you for registering your company with GSN Network. We have received your registration request.</p>
            
            <div class="info-box">
              <h3>📋 Registration Details</h3>
              <p><strong>Company Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Account Type:</strong> Company Account</p>
              <p><strong>Registration Date:</strong> ${data.registrationDate}</p>
            </div>
            
            <div class="warning-box">
              <h3>⚠️ Important: Admin Approval Required</h3>
              <p><strong>Your company account is currently pending admin approval.</strong></p>
              <p>Before you can access your company dashboard and start using GSN Network services, our admin team needs to review and approve your registration.</p>
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Our admin team will review your company details</li>
                <li>You will receive an email notification once approved</li>
                <li>After approval, you can access all company features</li>
                <li>The approval process typically takes 24-48 hours</li>
              </ul>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>🏢 Company Features (Available After Approval)</h3>
              <ul>
                <li>Complete company dashboard</li>
                <li>Receive and respond to freight quotes</li>
                <li>Manage company profile and services</li>
                <li>Access to company directory listing</li>
                <li>Customer relationship management</li>
                <li>Business analytics and reporting</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>📞 Questions About Your Registration?</h3>
              <p>If you have any questions about the approval process:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
              <p>Our support team will be happy to assist you.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Freight Forwarding & Logistics</p>
            <p>We appreciate your interest in joining our network!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 4. Admin notification for new user registration
  adminNewUserNotification: (data) => ({
    subject: `New ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)} Registration - ${data.userName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #CDA435, #D9B95B); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #CDA435; }
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New User Registration</h1>
            <p>GSN Network - Admin Notification</p>
          </div>
          <div class="content">
            <h2>New ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)} Registration</h2>
            <p>A new ${data.userRole} has registered on the GSN Network platform.</p>
            
            <div class="info-box">
              <h3>👤 User Details</h3>
              <p><strong>Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Phone:</strong> ${data.userPhone || 'Not provided'}</p>
              <p><strong>Role:</strong> ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}</p>
              <p><strong>Registration Date:</strong> ${data.registrationDate}</p>
              <p><strong>User ID:</strong> ${data.userId}</p>
            </div>
            
            ${data.userRole === 'company' ? `
            <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>⚠️ Action Required: Company Approval</h3>
              <p><strong>This company registration requires admin approval before the user can access their account.</strong></p>
              <p>Please review the company details and approve or reject the registration.</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/users" class="cta-button">
                👥 Manage Users
              </a>
            </div>
            
            <div class="info-box">
              <h3>📊 Registration Summary</h3>
              <p>This notification is part of the automated user registration monitoring system.</p>
              <p>All new registrations are logged and tracked for administrative oversight.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Admin System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 5. Company approval notification
  companyApproved: (data) => ({
    subject: 'Company Account Approved - Welcome to GSN Network! 🎉',
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
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Company Account Approved!</h1>
            <p>Welcome to GSN Network</p>
          </div>
          <div class="content">
            <h2>Congratulations ${data.userName}!</h2>
            <p>Your company registration has been approved by our admin team. You can now access all company features on GSN Network.</p>
            
            <div class="info-box">
              <h3>✅ Account Status</h3>
              <p><strong>Company:</strong> ${data.userName}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">APPROVED</span></p>
              <p><strong>Approval Date:</strong> ${data.approvalDate}</p>
              <p><strong>Approved By:</strong> GSN Network Admin Team</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>🚀 Your Company Features</h3>
              <ul>
                <li>Complete company dashboard access</li>
                <li>Receive and respond to freight quotes</li>
                <li>Manage your company profile and services</li>
                <li>Listed in our company directory</li>
                <li>Customer relationship management tools</li>
                <li>Business analytics and reporting</li>
                <li>Priority customer support</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/company/dashboard" class="cta-button">
                🏢 Access Company Dashboard
              </a>
            </div>
            
            <div class="info-box">
              <h3>📞 Company Support</h3>
              <p>Our dedicated support team is here to help:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Your Logistics Partner</p>
            <p>Thank you for joining our network of trusted logistics providers!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 6. Admin notification for company approval
  adminCompanyApprovalNotification: (data) => ({
    subject: `Company Approved - ${data.userName} is now active`,
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
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Company Approved</h1>
            <p>GSN Network - Admin Notification</p>
          </div>
          <div class="content">
            <h2>Company Successfully Approved</h2>
            <p>A company has been approved and activated on the GSN Network platform.</p>
            
            <div class="info-box">
              <h3>🏢 Company Details</h3>
              <p><strong>Company Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Phone:</strong> ${data.userPhone || 'Not provided'}</p>
              <p><strong>User ID:</strong> ${data.userId}</p>
              <p><strong>Approval Date:</strong> ${data.approvalDate}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>✅ Actions Completed</h3>
              <ul>
                <li>Company account status updated to active</li>
                <li>Company approval email sent to ${data.userEmail}</li>
                <li>Company can now access full dashboard features</li>
                <li>Company is now listed in the directory</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/users" class="cta-button">
                👥 Manage Users
              </a>
            </div>
            
            <div class="info-box">
              <h3>📊 Company Approval Summary</h3>
              <p>This notification confirms that the company approval process has been completed successfully.</p>
              <p>The company now has full access to GSN Network services.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Admin System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 7. Account deactivation notification to company
  accountDeactivated: (data) => ({
    subject: 'Account Deactivated - GSN Network',
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
          .warning-box { background: #f8d7da; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #dc3545; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Account Deactivated</h1>
            <p>GSN Network - Account Status Update</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName},</h2>
            <p>We are writing to inform you that your account has been deactivated by our admin team.</p>
            
            <div class="warning-box">
              <h3>🚫 Account Status</h3>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">DEACTIVATED</span></p>
              <p><strong>Deactivation Date:</strong> ${data.actionDate}</p>
              <p><strong>Account Type:</strong> ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}</p>
            </div>
            
            <div class="info-box">
              <h3>📋 What This Means</h3>
              <ul>
                <li>You cannot access your account dashboard</li>
                <li>All account features are temporarily suspended</li>
                <li>Your data remains secure and preserved</li>
                <li>This action can be reversed by contacting support</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>📞 Need Help?</h3>
              <p>If you believe this is an error or need assistance:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
              <p>Our support team will review your case and assist you.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Account Management</p>
            <p>This is an automated notification. Please contact support for assistance.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 8. Account blacklisted notification to company
  accountBlacklisted: (data) => ({
    subject: 'Account Blacklisted - GSN Network',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6c757d, #495057); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #6c757d; }
          .warning-box { background: #f8d7da; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #dc3545; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Account Blacklisted</h1>
            <p>GSN Network - Security Notice</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName},</h2>
            <p>We are writing to inform you that your account has been added to our blacklist due to policy violations or security concerns.</p>
            
            <div class="warning-box">
              <h3>🚫 Account Status</h3>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">BLACKLISTED</span></p>
              <p><strong>Blacklist Date:</strong> ${data.actionDate}</p>
              <p><strong>Account Type:</strong> ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}</p>
            </div>
            
            <div class="info-box">
              <h3>📋 Restrictions Applied</h3>
              <ul>
                <li>Account access is completely restricted</li>
                <li>All platform activities are suspended</li>
                <li>Cannot create new accounts with same details</li>
                <li>All ongoing transactions are frozen</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>📞 Appeal Process</h3>
              <p>If you believe this action was taken in error, you can appeal:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
              <p>Please provide detailed information about your case for review.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Security Team</p>
            <p>This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 9. Account unblacklisted notification to company
  accountUnblacklisted: (data) => ({
    subject: 'Account Restored - Welcome Back to GSN Network! 🎉',
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
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Restored!</h1>
            <p>Welcome Back to GSN Network</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName},</h2>
            <p>Great news! Your account has been restored and removed from our blacklist. You can now access all GSN Network services again.</p>
            
            <div class="info-box">
              <h3>✅ Account Status</h3>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACTIVE</span></p>
              <p><strong>Restoration Date:</strong> ${data.actionDate}</p>
              <p><strong>Account Type:</strong> ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3>🚀 You Can Now</h3>
              <ul>
                <li>Access your full account dashboard</li>
                <li>Use all platform features and services</li>
                <li>Submit and manage quotes</li>
                <li>Contact other members</li>
                <li>Access customer support</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/login" class="cta-button">
                🚀 Access Your Account
              </a>
            </div>
            
            <div class="info-box">
              <h3>📞 Support Available</h3>
              <p>If you have any questions or need assistance:</p>
              <p><strong>Email:</strong> root@khaleeji.app</p>
              <p><strong>Website:</strong> ${process.env.FRONTEND_URL}</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Welcome Back!</p>
            <p>Thank you for your patience during the review process.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // 10. Admin notification for account status changes
  adminAccountStatusNotification: (data) => ({
    subject: `Account ${data.action} - ${data.userName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #CDA435, #D9B95B); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #CDA435; }
          .cta-button { display: inline-block; background: #CDA435; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Account Status Update</h1>
            <p>GSN Network - Admin Notification</p>
          </div>
          <div class="content">
            <h2>Account ${data.action}</h2>
            <p>An account status change has been processed on the GSN Network platform.</p>
            
            <div class="info-box">
              <h3>👤 Account Details</h3>
              <p><strong>User:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Phone:</strong> ${data.userPhone || 'Not provided'}</p>
              <p><strong>Role:</strong> ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}</p>
              <p><strong>User ID:</strong> ${data.userId}</p>
            </div>
            
            <div class="info-box">
              <h3>🔄 Status Change</h3>
              <p><strong>Action:</strong> ${data.action}</p>
              <p><strong>Date:</strong> ${data.actionDate}</p>
              <p><strong>Type:</strong> ${data.changeType}</p>
              <p><strong>New Status:</strong> ${data.newStatus}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/users" class="cta-button">
                👥 Manage Users
              </a>
            </div>
            
            <div class="info-box">
              <h3>📊 Notification Summary</h3>
              <p>This notification confirms that the account status change has been processed and the user has been notified.</p>
            </div>
          </div>
          <div class="footer">
            <p>GSN Network (Gulf Star Network) - Admin System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Main email sending function
const sendRegistrationEmail = async (emailType, data) => {
  try {
    const transporter = createTransporter();
    const template = registrationEmailTemplates[emailType];
    
    if (!template) {
      throw new Error(`Registration email template '${emailType}' not found`);
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
    await logRegistrationEmail({
      recipient_email: data.recipientEmail,
      email_type: emailType,
      subject: emailContent.subject,
      status: 'sent',
      message_id: result.messageId,
      user_id: data.userId || null,
      user_role: data.userRole || null
    });
    
    console.log(`✅ Registration email sent successfully: ${emailType} to ${data.recipientEmail}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send registration email (${emailType}):`, error);
    
    // Log failed email
    await logRegistrationEmail({
      recipient_email: data.recipientEmail,
      email_type: emailType,
      subject: registrationEmailTemplates[emailType] ? registrationEmailTemplates[emailType](data).subject : 'Unknown',
      status: 'failed',
      error_message: error.message,
      user_id: data.userId || null,
      user_role: data.userRole || null
    });
    
    return { success: false, error: error.message };
  }
};

// Log registration email history
const logRegistrationEmail = async (emailData) => {
  try {
    await db.execute(`
      INSERT INTO email_history (
        recipient_email, email_type, subject, status, message_id, 
        error_message, company_id, admin_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      emailData.recipient_email,
      emailData.email_type,
      emailData.subject,
      emailData.status,
      emailData.message_id || null,
      emailData.error_message || null,
      emailData.user_role === 'company' ? emailData.user_id : null,
      null // admin_id not applicable for registration emails
    ]);
  } catch (error) {
    console.error('Failed to log registration email history:', error);
  }
};

// Registration email workflow functions
export const registrationEmailWorkflow = {
  // Send welcome email to new user
  async sendUserWelcome(userData) {
    const { userId, userName, userEmail, userRole } = userData;
    
    const registrationDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let emailType;
    switch (userRole) {
      case 'user':
        emailType = 'userWelcome';
        break;
      case 'business':
        emailType = 'businessWelcome';
        break;
      case 'company':
        emailType = 'companyWelcomePending';
        break;
      default:
        emailType = 'userWelcome';
    }
    
    await sendRegistrationEmail(emailType, {
      recipientEmail: userEmail,
      userName,
      userEmail,
      userRole,
      userId,
      registrationDate
    });
  },
  
  // Send admin notification for new registration
  async sendAdminNotification(userData) {
    const { userId, userName, userEmail, userPhone, userRole } = userData;
    
    // Get all admin emails
    const [admins] = await db.execute('SELECT id, email, name FROM users WHERE role = "admin"');
    
    const registrationDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send notification to all admins
    for (const admin of admins) {
      await sendRegistrationEmail('adminNewUserNotification', {
        recipientEmail: admin.email,
        userName,
        userEmail,
        userPhone,
        userRole,
        userId,
        registrationDate
      });
    }
  },
  
  // Send company approval notification
  async sendCompanyApproval(userData) {
    const { userId, userName, userEmail } = userData;
    
    const approvalDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    await sendRegistrationEmail('companyApproved', {
      recipientEmail: userEmail,
      userName,
      userEmail,
      userId,
      approvalDate
    });
  },

  // Send admin notification for company approval
  async sendAdminCompanyApprovalNotification(userData) {
    const { userId, userName, userEmail, userPhone } = userData;
    
    // Get all admin emails
    const [admins] = await db.execute('SELECT id, email, name FROM users WHERE role = "admin"');
    
    const approvalDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send notification to all admins
    for (const admin of admins) {
      await sendRegistrationEmail('adminCompanyApprovalNotification', {
        recipientEmail: admin.email,
        userName,
        userEmail,
        userPhone,
        userId,
        approvalDate
      });
    }
  },

  // Send account deactivation notification
  async sendAccountDeactivated(userData) {
    const { userId, userName, userEmail, userRole } = userData;
    
    const actionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await sendRegistrationEmail('accountDeactivated', {
      recipientEmail: userEmail,
      userName,
      userEmail,
      userRole,
      userId,
      actionDate
    });
  },

  // Send account blacklisted notification
  async sendAccountBlacklisted(userData) {
    const { userId, userName, userEmail, userRole } = userData;
    
    const actionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await sendRegistrationEmail('accountBlacklisted', {
      recipientEmail: userEmail,
      userName,
      userEmail,
      userRole,
      userId,
      actionDate
    });
  },

  // Send account unblacklisted notification
  async sendAccountUnblacklisted(userData) {
    const { userId, userName, userEmail, userRole } = userData;
    
    const actionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await sendRegistrationEmail('accountUnblacklisted', {
      recipientEmail: userEmail,
      userName,
      userEmail,
      userRole,
      userId,
      actionDate
    });
  },

  // Send admin notification for account status changes
  async sendAdminAccountStatusNotification(userData) {
    const { userId, userName, userEmail, userPhone, userRole, action, changeType, newStatus } = userData;
    
    // Get all admin emails
    const [admins] = await db.execute('SELECT id, email, name FROM users WHERE role = "admin"');
    
    const actionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send notification to all admins
    for (const admin of admins) {
      await sendRegistrationEmail('adminAccountStatusNotification', {
        recipientEmail: admin.email,
        userName,
        userEmail,
        userPhone,
        userRole,
        userId,
        action,
        changeType,
        newStatus,
        actionDate
      });
    }
  }
};

export default registrationEmailWorkflow;