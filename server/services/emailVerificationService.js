// Email verification service for business account registration
import crypto from 'crypto';
import db from '../config/db.js';
import nodemailer from 'nodemailer';

// Create email transporter (using existing email configuration)
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store verification token in database
export const storeVerificationToken = async (userId, token) => {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Delete any existing tokens for this user
    await db.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId]);
    
    // Insert new token
    await db.execute(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
    
    return true;
  } catch (error) {
    console.error('Error storing verification token:', error);
    throw error;
  }
};

// Send verification email
export const sendVerificationEmail = async (userEmail, userName, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: `"GSN Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Verify Your Business Account - GSN Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #bca142, #B8941F); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #bca142; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #B8941F; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to GSN Platform!</h1>
              <p>Your business account is almost ready</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <p>Thank you for registering your business account with GSN Platform. To complete your registration and activate your account, please verify your email address.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This verification link will expire in 24 hours. Please verify your email as soon as possible.
              </div>
              
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <h3>What happens next?</h3>
              <ul>
                <li>✅ Click the verification link above</li>
                <li>✅ Your account will be activated automatically</li>
                <li>✅ You can then login and start using GSN Platform</li>
                <li>✅ Access all business features and request quotes</li>
              </ul>
              
              <p>If you didn't create this account, please ignore this email or contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} GSN Platform. All rights reserved.</p>
              <p>Need help? Contact us at support@gsnplatform.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Verify email token
export const verifyEmailToken = async (token) => {
  try {
    // Find the token in database
    const [rows] = await db.execute(
      `SELECT vt.user_id, vt.expires_at, u.name, u.email, u.role 
       FROM email_verification_tokens vt 
       JOIN users u ON vt.user_id = u.id 
       WHERE vt.token = ? AND vt.expires_at > NOW()`,
      [token]
    );
    
    if (rows.length === 0) {
      return { success: false, message: 'Invalid or expired verification token' };
    }
    
    const { user_id, name, email, role } = rows[0];
    
    // Activate the user account
    await db.execute('UPDATE users SET status = 1, email_verified = 1 WHERE id = ?', [user_id]);
    
    // Delete the used token
    await db.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [user_id]);
    
    console.log(`✅ Email verified for user ${user_id} (${email})`);
    
    return {
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      user: { id: user_id, name, email, role }
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    throw error;
  }
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
  try {
    // Find user by email
    const [userRows] = await db.execute(
      'SELECT id, name, email, status, email_verified FROM users WHERE email = ? AND role = "business"',
      [email]
    );
    
    if (userRows.length === 0) {
      return { success: false, message: 'Business account not found with this email' };
    }
    
    const user = userRows[0];
    
    if (user.status === 1 && user.email_verified === 1) {
      return { success: false, message: 'Account is already verified and active' };
    }
    
    // Generate new verification token
    const token = generateVerificationToken();
    await storeVerificationToken(user.id, token);
    
    // Send verification email
    await sendVerificationEmail(user.email, user.name, token);
    
    return {
      success: true,
      message: 'Verification email sent successfully! Please check your inbox.'
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
};

// Clean up expired tokens (can be run as a cron job)
export const cleanupExpiredTokens = async () => {
  try {
    const [result] = await db.execute('DELETE FROM email_verification_tokens WHERE expires_at < NOW()');
    console.log(`🧹 Cleaned up ${result.affectedRows} expired verification tokens`);
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};