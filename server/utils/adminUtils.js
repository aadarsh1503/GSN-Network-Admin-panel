// Admin utility functions
import db from '../config/db.js';

/**
 * Get all admin email addresses from the database
 * @returns {Promise<string[]>} Array of admin email addresses
 */
export const getAdminEmails = async () => {
  try {
    const [adminUsers] = await db.execute(
      'SELECT email FROM users WHERE role = "admin" AND email IS NOT NULL AND email != ""'
    );
    
    const adminEmails = adminUsers.map(admin => admin.email);
    console.log(`📧 Found ${adminEmails.length} admin email(s):`, adminEmails);
    
    return adminEmails;
  } catch (error) {
    console.error('❌ Error fetching admin emails:', error);
    return [];
  }
};

/**
 * Get all admin users with full details
 * @returns {Promise<Object[]>} Array of admin user objects
 */
export const getAdminUsers = async () => {
  try {
    const [adminUsers] = await db.execute(
      'SELECT id, name, email, phone FROM users WHERE role = "admin" AND email IS NOT NULL AND email != ""'
    );
    
    console.log(`👥 Found ${adminUsers.length} admin user(s)`);
    
    return adminUsers;
  } catch (error) {
    console.error('❌ Error fetching admin users:', error);
    return [];
  }
};

/**
 * Get admin emails with fallback to environment variable
 * @returns {Promise<string[]>} Array of admin email addresses (guaranteed to have at least one)
 */
export const getAdminEmailsWithFallback = async () => {
  try {
    const adminEmails = await getAdminEmails();
    
    if (adminEmails.length > 0) {
      return adminEmails;
    }
    
    // Fallback to environment variable or default
    const fallbackEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@gsnnetwork.com';
    console.log(`⚠️ No admin users found in database, using fallback email: ${fallbackEmail}`);
    
    return [fallbackEmail];
  } catch (error) {
    console.error('❌ Error in getAdminEmailsWithFallback:', error);
    const fallbackEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@gsnnetwork.com';
    return [fallbackEmail];
  }
};

/**
 * Check if there are any admin users in the database
 * @returns {Promise<boolean>} True if admin users exist
 */
export const hasAdminUsers = async () => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
    );
    
    const count = result[0].count;
    console.log(`🔍 Admin users count: ${count}`);
    
    return count > 0;
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    return false;
  }
};

export default {
  getAdminEmails,
  getAdminUsers,
  getAdminEmailsWithFallback,
  hasAdminUsers
};