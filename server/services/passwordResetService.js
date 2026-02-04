import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from '../config/db.js';

dotenv.config();

// Create transporter
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

// Email template for password reset
const createPasswordResetEmailTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #bca142 0%, #B8941F 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
            .header p { color: #FFF3CD; margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; }
            .footer p { color: #6c757d; margin: 0; font-size: 14px; }
            .btn { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #bca142 0%, #B8941F 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 16px; }
            .btn:hover { background: linear-gradient(135deg, #B8941F 0%, #A67C1A 100%); }
            .info-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #bca142; }
            .warning-box { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .security-note { background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #17a2b8; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>GSN Network - Secure Account Recovery</p>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>We received a request to reset your password for your GSN Network account. If you made this request, please click the button below to reset your password.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" class="btn">
                        🔑 Reset My Password
                    </a>
                </div>
                
                <div class="info-box">
                    <h3>📋 Important Information</h3>
                    <p><strong>This link will expire in 1 hour</strong> for security reasons.</p>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
                </div>
                
                <div class="warning-box">
                    <h3>⚠️ Security Notice</h3>
                    <p><strong>If you didn't request this password reset:</strong></p>
                    <ul>
                        <li>Please ignore this email - your password will remain unchanged</li>
                        <li>Consider changing your password if you suspect unauthorized access</li>
                        <li>Contact our support team if you have security concerns</li>
                    </ul>
                </div>
                
                <div class="security-note">
                    <h3>🛡️ Security Tips</h3>
                    <p><strong>When creating your new password:</strong></p>
                    <ul>
                        <li>Use at least 6 characters</li>
                        <li>Choose something memorable but secure</li>
                        <li>Don't reuse old passwords</li>
                        <li>Don't share your password with anyone</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">If you need assistance, please contact our support team. We're here to help!</p>
            </div>
            <div class="footer">
                <p><strong>GSN Network (Gulf Star Network)</strong></p>
                <p>Professional Freight Forwarding & Logistics Solutions</p>
                <p style="margin-top: 15px; font-style: italic;">This is an automated security email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate password reset token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store reset token in database
export const storeResetToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
  
  try {
    // Delete any existing reset tokens for this user
    await db.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    
    // Insert new reset token using UTC_TIMESTAMP for consistency
    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())',
      [userId, token, expiresAt]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error storing reset token:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  const transporter = createTransporter();
  
  try {
    const html = createPasswordResetEmailTemplate(resetUrl, userName);
    
    const mailOptions = {
      from: `"GSN Network Security" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🔐 Password Reset Request - GSN Network',
      html: html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    
    // Log to database
    try {
      await db.execute(
        `INSERT INTO email_notifications (recipient_email, subject, message, type, status, created_at) 
         VALUES (?, ?, ?, 'password_reset', 'sent', UTC_TIMESTAMP())`,
        [email, 'Password Reset Request', 'Password reset email sent']
      );
    } catch (dbError) {
      console.error('Error logging email to database:', dbError.message);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Verify reset token
export const verifyResetToken = async (token) => {
  try {
    const [rows] = await db.execute(
      `SELECT prt.*, u.id as user_id, u.email, u.name, u.role 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.token = ? AND prt.expires_at > UTC_TIMESTAMP() AND prt.used = 0`,
      [token]
    );
    
    if (rows.length === 0) {
      return { success: false, error: 'Invalid or expired reset token' };
    }
    
    return { success: true, user: rows[0] };
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return { success: false, error: error.message };
  }
};

// Mark reset token as used
export const markTokenAsUsed = async (token) => {
  try {
    await db.execute(
      'UPDATE password_reset_tokens SET used = 1, used_at = UTC_TIMESTAMP() WHERE token = ?',
      [token]
    );
    return { success: true };
  } catch (error) {
    console.error('Error marking token as used:', error);
    return { success: false, error: error.message };
  }
};

// Clean up expired tokens (optional - can be run as a cron job)
export const cleanupExpiredTokens = async () => {
  try {
    const [result] = await db.execute(
      'DELETE FROM password_reset_tokens WHERE expires_at < UTC_TIMESTAMP() OR used = 1'
    );
    console.log(`🧹 Cleaned up ${result.affectedRows} expired/used reset tokens`);
    return { success: true, deletedCount: result.affectedRows };
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateResetToken,
  storeResetToken,
  sendPasswordResetEmail,
  verifyResetToken,
  markTokenAsUsed,
  cleanupExpiredTokens
};