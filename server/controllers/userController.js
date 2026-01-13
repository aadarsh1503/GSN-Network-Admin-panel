// controllers/userController.js

import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAdminNotification } from './adminController.js';
import realTimeNotificationService from '../services/realTimeNotificationService.js';
import { sendWelcomeMessage } from './messageController.js';
import { queueSubscriptionEmails } from '../services/emailQueue.js';
import { 
  generateResetToken, 
  storeResetToken, 
  sendPasswordResetEmail, 
  verifyResetToken, 
  markTokenAsUsed 
} from '../services/passwordResetService.js';

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- NEW LOGIC: Check Blacklist and Status ---
        // If is_blacklisted is 1 (true) OR status is 0 (false/inactive)
        if (user.is_blacklisted) {
            return res.status(403).json({ message: 'Your account has been blacklisted. Please contact support.' });
        }
        
        if (user.status === 0) {
             return res.status(403).json({ message: 'Your account is currently inactive.' });
        }
        // ---------------------------------------------

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: user.id,
            role: user.role,
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name, 
                        email: user.email,
                        role: user.role,
                    },
                });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, phone, password, role, category, country, referralCode } = req.body;

  // 1. Basic Validation - Allow 'user' role without category requirement
  if (!name || !email || !phone || !password || !role || !country) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  // Category is required for company and business roles, but not for user role
  if ((role === 'company' || role === 'business') && !category) {
      return res.status(400).json({ message: 'Category is required for company and business accounts.' });
  }

  try {
      // 2. Check if user already exists
      const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
          return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      // 3. Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Generate permanent referral code if not provided
      let finalReferralCode = referralCode;
      if (!finalReferralCode) {
          // Generate a unique referral code: GSN + user ID (will be available after insert) + random 4 digits
          // We'll update this after the user is created
          finalReferralCode = null; // Will be set after user creation
      }

      // 5. Determine initial status based on role
      // Regular users and business users are automatically activated, only companies need approval
      const initialStatus = (role === 'user' || role === 'business') ? 1 : 0;
      
      // Insert new user into the database
      let sql, values;
      
      if (role === 'user') {
          // For users, don't include category in the query
          sql = `
              INSERT INTO users (name, email, phone, password, role, country, referral_code, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          values = [name, email, phone, hashedPassword, role, country, finalReferralCode, initialStatus];
      } else {
          // For companies and businesses, include category
          sql = `
              INSERT INTO users (name, email, phone, password, role, category, country, referral_code, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          values = [name, email, phone, hashedPassword, role, category, country, finalReferralCode, initialStatus];
      }
      
      const [result] = await db.execute(sql, values);

      const newUserId = result.insertId;

      // 6. Generate and update referral code if it wasn't provided
      if (!referralCode) {
          const generatedReferralCode = `GSN${newUserId}${String(newUserId).padStart(4, '0')}`;
          await db.execute('UPDATE users SET referral_code = ? WHERE id = ?', [generatedReferralCode, newUserId]);
          finalReferralCode = generatedReferralCode;
      }

      // 🎯 SEND WELCOME MESSAGE TO NEW USER
      // Send welcome message for all user types (but not visible to admin)
      await sendWelcomeMessage(newUserId, role);

      // 🚀 QUEUE REGISTRATION EMAILS (NON-BLOCKING)
      // Send welcome email to user
      queueSubscriptionEmails.userRegistration({
          userId: newUserId,
          userName: name,
          userEmail: email,
          userRole: role
      }).then(jobId => {
          console.log(`✅ User welcome email queued (Job ID: ${jobId})`);
      }).catch(error => {
          console.error('❌ Failed to queue user welcome email:', error);
      });

      // Send admin notification email
      queueSubscriptionEmails.adminRegistrationNotification({
          userId: newUserId,
          userName: name,
          userEmail: email,
          userPhone: phone,
          userRole: role
      }).then(jobId => {
          console.log(`✅ Admin registration notification queued (Job ID: ${jobId})`);
      }).catch(error => {
          console.error('❌ Failed to queue admin registration notification:', error);
      });

      // Create admin notification only for company registrations
      if (role === 'company') {
          await createAdminNotification(
              'registration',
              `New Company Owner Registration`,
              `${name} (${email}) has registered as a Company Owner and is pending approval.`,
              newUserId
          );

          // Send real-time notification to admins
          await realTimeNotificationService.notifyNewUserRegistration({
              id: newUserId,
              name: name,
              email: email,
              role: role,
              created_at: new Date().toISOString()
          });
      } else {
          // Send real-time notification for user and business registrations (for admin awareness)
          await realTimeNotificationService.notifyNewUserRegistration({
              id: newUserId,
              name: name,
              email: email,
              role: role,
              created_at: new Date().toISOString()
          });
      }

      // 7. Send appropriate response based on role
      if (role === 'user' || role === 'business') {
          // Regular users and business users can login immediately - provide token for auto-login
          const payload = {
              id: newUserId,
              role: role,
          };

          jwt.sign(
              payload,
              process.env.JWT_SECRET,
              { expiresIn: '1h' },
              (err, token) => {
                  if (err) {
                      console.error('JWT Error:', err);
                      // Fallback without token
                      res.status(201).json({
                          message: 'Registration successful! You can now login to your account.',
                          accountStatus: 'active',
                          user: {
                              id: newUserId,
                              name: name,
                              email: email,
                              role: role,
                              status: 1
                          },
                      });
                  } else {
                      res.status(201).json({
                          message: `Registration successful! Welcome to GSN.`,
                          accountStatus: 'active',
                          token: token,
                          user: {
                              id: newUserId,
                              name: name,
                              email: email,
                              role: role,
                              status: 1
                          },
                      });
                  }
              }
          );
      } else {
          // Only companies need admin approval
          res.status(201).json({
              message: 'Registration successful! Your account is pending admin approval. You will be able to login once an administrator activates your account.',
              accountStatus: 'pending_approval',
              user: {
                  id: newUserId,
                  name: name,
                  email: email,
                  role: role,
                  status: 0
              },
          });
      }

  } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
  }
};


// @desc    Get admin-only data
// @route   GET /api/users/admin-data
// @access  Private/Admin
const getAdminData = (req, res) => {
    // ... (no changes in this function)
  res.status(200).json({
      message: 'Success! You are seeing admin-only content.',
      user: req.user
  });
};
const getUserProfile = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    const userId = req.user.id;

    try {
        // Fetch the user from the database, but specifically exclude the password
        const [rows] = await db.execute(
            'SELECT id, name, email, phone, role, country, logo, created_at FROM users WHERE id = ?', 
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        res.status(200).json({ user });
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile by ID (Admin only)
// @route   GET /api/user/profile/:id
// @access  Admin
const getUserProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                id, name, email, phone, role, category, country, state, city,
                status, is_blacklisted, created_at, updated_at,
                owner_name, owner_phone, incharge_name, incharge_phone,
                skype, website, facebook, twitter, instagram
            FROM users 
            WHERE id = ?
        `;
        
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = rows[0];
        // Convert MySQL 1/0 to Javascript true/false
        user.status = Boolean(user.status);
        user.is_blacklisted = Boolean(user.is_blacklisted);
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
};

// @desc    Get company profile by ID (Admin only) - Full company data
// @route   GET /api/user/company-profile/:id
// @access  Admin
const getCompanyProfileByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ? AND role = "company"', [id]);
        const userProfile = rows[0];

        if (!userProfile) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        delete userProfile.password;
        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching company profile:', error);
        res.status(500).json({ message: 'Server error fetching company profile' });
    }
};

// @desc    Update company profile by ID (Admin only) - Full company data
// @route   PUT /api/user/company-profile/:id
// @access  Admin
const updateCompanyProfileByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, email, phone, category, country, state, city,
            owner_name, owner_phone, incharge_name, incharge_phone,
            skype, website, facebook, twitter, instagram, linkedin,
            services, map_location, company_address, about_company
        } = req.body;
        
        // Validate input
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }
        
        // Check if email is already taken by another user
        const emailCheckSql = `SELECT id FROM users WHERE email = ? AND id != ?`;
        const [emailCheck] = await db.execute(emailCheckSql, [email, id]);
        
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'Email is already taken by another user' });
        }

        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        // Handle services - if it's an array, stringify it
        let servicesString = services;
        if (typeof services !== 'string' && services) {
            servicesString = JSON.stringify(services);
        }
        
        const sql = `
            UPDATE users SET
                name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                services = ?, map_location = ?, company_address = ?, about_company = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND role = 'company'
        `;
        
        const values = [
            sanitizeValue(name), sanitizeValue(email), sanitizeValue(phone), 
            sanitizeValue(category), sanitizeValue(country), sanitizeValue(state), sanitizeValue(city),
            sanitizeValue(owner_name), sanitizeValue(owner_phone), 
            sanitizeValue(incharge_name), sanitizeValue(incharge_phone),
            sanitizeValue(skype), sanitizeValue(website), sanitizeValue(facebook), 
            sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(linkedin),
            sanitizeValue(servicesString), sanitizeValue(map_location), 
            sanitizeValue(company_address), sanitizeValue(about_company),
            id
        ];
        
        const [result] = await db.execute(sql, values);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }
        
        res.status(200).json({ message: 'Company profile updated successfully' });
    } catch (error) {
        console.error('Error updating company profile:', error);
        res.status(500).json({ message: 'Server error updating company profile' });
    }
};
const updateUserProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, email, mobile, category, country, state, city,
            owner_name, owner_phone, incharge_name, incharge_phone,
            website, skype
        } = req.body;
        
        // Validate input
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }
        
        // Check if email is already taken by another user
        const emailCheckSql = `SELECT id FROM users WHERE email = ? AND id != ?`;
        const [emailCheck] = await db.execute(emailCheckSql, [email, id]);
        
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'Email is already taken by another user' });
        }
        
        const sql = `
            UPDATE users 
            SET name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                website = ?, skype = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const [result] = await db.execute(sql, [
            name, email, mobile, category, country, state, city,
            owner_name, owner_phone, incharge_name, incharge_phone,
            website, skype, id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ message: 'User profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating user profile' });
    }
};

const getCompanies = async (req, res) => {
    try {
        // We select specific fields and alias them to match your frontend requirements
        // is_blacklisted -> onBlacklist
        // phone -> mobile
        const sql = `
            SELECT 
                id, 
                name, 
                email, 
                phone AS mobile, 
                role, 
                is_blacklisted AS onBlacklist, 
                status 
            FROM users 
            WHERE role = 'company'
        `;
        
        const [rows] = await db.execute(sql);
        
        // Ensure boolean values are actually booleans (MySQL returns 0/1)
        const formattedRows = rows.map(user => ({
            ...user,
            onBlacklist: Boolean(user.onBlacklist),
            status: Boolean(user.status)
        }));

        res.status(200).json(formattedRows);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
};

// @desc    Toggle Blacklist or Status
// @route   PUT /api/users/company-status/:id
// @access  Private/Admin
const toggleCompanyStatus = async (req, res) => {
    const { id } = req.params;
    const { type, value } = req.body; // type will be 'blacklist' or 'status', value is boolean

    try {
        let sql = '';
        let sqlValue = value ? 1 : 0; // Convert boolean to MySQL TinyInt

        if (type === 'blacklist') {
            sql = 'UPDATE users SET is_blacklisted = ? WHERE id = ?';
        } else if (type === 'status') {
            sql = 'UPDATE users SET status = ? WHERE id = ?';
        } else {
            return res.status(400).json({ message: 'Invalid update type' });
        }

        // Get user details before updating
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userRows[0];

        await db.execute(sql, [sqlValue, id]);

        // 🚀 SEND EMAILS FOR ALL STATUS CHANGES (NON-BLOCKING)
        try {
            const { queueSubscriptionEmails } = await import('../services/emailQueue.js');
            
            if (type === 'status') {
                if (value === true) {
                    // Account Activation
                    if (user.role === 'company') {
                        console.log(`🔔 Company activated via frontend, queuing approval email for: ${user.name} (${user.email})`);
                        
                        console.log('📧 Attempting to queue company approval email...');
                        const jobId = await queueSubscriptionEmails.companyApproval({
                            userId: user.id,
                            userName: user.name,
                            userEmail: user.email
                        });
                        
                        console.log(`✅ Company approval email queued successfully (Job ID: ${jobId})`);
                        
                        // Also send admin notification about the approval
                        console.log('📧 Queuing admin notification for company approval...');
                        const adminJobId = await queueSubscriptionEmails.adminCompanyApprovalNotification({
                            userId: user.id,
                            userName: user.name,
                            userEmail: user.email,
                            userPhone: user.phone || 'Not provided'
                        });
                        
                        console.log(`✅ Admin notification for company approval queued (Job ID: ${adminJobId})`);
                    }
                } else {
                    // Account Deactivation
                    console.log(`🔔 Account deactivated, queuing deactivation email for: ${user.name} (${user.email})`);
                    
                    const deactivationJobId = await queueSubscriptionEmails.accountDeactivated({
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userRole: user.role
                    });
                    
                    console.log(`✅ Account deactivation email queued (Job ID: ${deactivationJobId})`);
                    
                    // Send admin notification
                    const adminDeactivationJobId = await queueSubscriptionEmails.adminAccountStatusNotification({
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userPhone: user.phone || 'Not provided',
                        userRole: user.role,
                        action: 'Deactivated',
                        changeType: 'Status Change',
                        newStatus: 'Inactive'
                    });
                    
                    console.log(`✅ Admin deactivation notification queued (Job ID: ${adminDeactivationJobId})`);
                }
            } else if (type === 'blacklist') {
                if (value === true) {
                    // Account Blacklisted
                    console.log(`🔔 Account blacklisted, queuing blacklist email for: ${user.name} (${user.email})`);
                    
                    const blacklistJobId = await queueSubscriptionEmails.accountBlacklisted({
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userRole: user.role
                    });
                    
                    console.log(`✅ Account blacklist email queued (Job ID: ${blacklistJobId})`);
                    
                    // Send admin notification
                    const adminBlacklistJobId = await queueSubscriptionEmails.adminAccountStatusNotification({
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userPhone: user.phone || 'Not provided',
                        userRole: user.role,
                        action: 'Blacklisted',
                        changeType: 'Security Action',
                        newStatus: 'Blacklisted'
                    });
                    
                    console.log(`✅ Admin blacklist notification queued (Job ID: ${adminBlacklistJobId})`);
                } else {
                    // Account Unblacklisted
                    console.log(`🔔 Account unblacklisted, queuing restoration email for: ${user.name} (${user.email})`);
                    
                    const unblacklistJobId = await queueSubscriptionEmails.accountUnblacklisted({
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userRole: user.role
                    });
                    
                    console.log(`✅ Account restoration email queued (Job ID: ${unblacklistJobId})`);
                    
                    // Send admin notification
                    const adminUnblacklistJobId = await queueSubscriptionEmails.adminAccountStatusNotification({
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        userPhone: user.phone || 'Not provided',
                        userRole: user.role,
                        action: 'Restored',
                        changeType: 'Security Action',
                        newStatus: 'Active'
                    });
                    
                    console.log(`✅ Admin restoration notification queued (Job ID: ${adminUnblacklistJobId})`);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to queue status change emails:', error);
            console.error('❌ Error details:', error.stack);
        }

        res.status(200).json({ message: 'Company status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error updating status' });
    }
};
const getBusinessUsers = async (req, res) => {
    try {
        // Fetch only users where role is 'business'
        const sql = `
            SELECT 
                id, 
                name, 
                email, 
                phone AS mobile, 
                role, 
                is_blacklisted AS onBlacklist, 
                status 
            FROM users 
            WHERE role = 'business'
        `;
        
        const [rows] = await db.execute(sql);
        
        // Convert MySQL 1/0 to Javascript true/false
        const formattedRows = rows.map(user => ({
            ...user,
            onBlacklist: Boolean(user.onBlacklist),
            status: Boolean(user.status)
        }));

        res.status(200).json(formattedRows);
    } catch (error) {
        console.error('Error fetching business users:', error);
        res.status(500).json({ message: 'Server error fetching business users' });
    }
};

// @desc    Get all regular users (quote requesters)
// @route   GET /api/users/regular-users
// @access  Private/Admin
const getRegularUsers = async (req, res) => {
    try {
        // Fetch only users where role is 'user'
        const sql = `
            SELECT 
                id, 
                name, 
                email, 
                phone AS mobile, 
                role, 
                is_blacklisted AS onBlacklist, 
                status,
                created_at
            FROM users 
            WHERE role = 'user'
            ORDER BY created_at DESC
        `;
        
        const [rows] = await db.execute(sql);
        
        // Convert MySQL 1/0 to Javascript true/false
        const formattedRows = rows.map(user => ({
            ...user,
            onBlacklist: Boolean(user.onBlacklist),
            status: Boolean(user.status)
        }));

        res.status(200).json(formattedRows);
    } catch (error) {
        console.error('Error fetching regular users:', error);
        res.status(500).json({ message: 'Server error fetching regular users' });
    }
};

// @desc    Change user password
// @route   PUT /api/user/change-password
// @access  Private
const changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    try {
        // Get current user with password
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error changing password' });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/user/all
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT id, name, email, phone, role, category, country, state, city,
                   status, is_blacklisted, created_at
            FROM users 
            WHERE role != 'admin'
            ORDER BY created_at DESC
        `;
        
        const [rows] = await db.execute(sql);
        
        const formattedRows = rows.map(user => ({
            ...user,
            onBlacklist: Boolean(user.is_blacklisted),
            status: Boolean(user.status)
        }));

        res.status(200).json(formattedRows);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Update user profile
// @route   PUT /api/user/update-profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, phone, country, logo } = req.body;

    try {
        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        const sql = `
            UPDATE users SET 
                name = ?, email = ?, phone = ?, country = ?, logo = ?
            WHERE id = ?
        `;

        const values = [
            sanitizeValue(name),
            sanitizeValue(email), 
            sanitizeValue(phone),
            sanitizeValue(country),
            sanitizeValue(logo),
            userId
        ];

        await db.execute(sql, values);

        res.status(200).json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('❌ Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Get all users for admin messaging
// @route   GET /api/admin/all-users-for-messaging
// @access  Private/Admin
const getAllUsersForMessaging = async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.status,
                u.logo,
                u.created_at,
                CASE 
                    WHEN us.status = 'active' AND us.end_date > NOW() THEN 'active'
                    ELSE 'inactive'
                END as subscription_status,
                mp.name as plan_name,
                us.end_date as subscription_expires
            FROM users u
            LEFT JOIN user_subscriptions us ON u.id = us.user_id 
                AND us.status = 'active' 
                AND us.end_date > NOW()
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE u.role IN ('user', 'company', 'business') AND u.role != 'admin'
            ORDER BY 
                CASE WHEN us.status = 'active' AND us.end_date > NOW() THEN 0 ELSE 1 END,
                u.status DESC,
                u.created_at DESC
        `;

        const [users] = await db.execute(sql);
        
        // Debug log to see what we're getting
        console.log('Users for messaging:', users.length);
        console.log('Active subscribers:', users.filter(u => u.subscription_status === 'active').length);
        
        res.status(200).json(users);

    } catch (error) {
        console.error('Error fetching users for messaging:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Submit user support ticket
// @route   POST /api/user/help/ticket
// @access  Private/User
const submitUserTicket = async (req, res) => {
    const userId = req.user.id;
    const { 
        subject, 
        message, 
        priority = 'medium', 
        category = 'general',
        recipient_type = 'admin',
        recipient_id = null
    } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (recipient_type === 'company' && !recipient_id) {
        return res.status(400).json({ message: 'Company selection is required when sending to company' });
    }

    try {
        // Get user details for email notifications
        const [userRows] = await db.execute(
            'SELECT name, email, role FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Generate ticket number with recipient info
        const ticketPrefix = recipient_type === 'company' ? 'USR-COMP' : 'USR-ADMIN';
        const ticketNumber = `${ticketPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // For now, store recipient info in the subject until we add the columns
        const enhancedSubject = recipient_type === 'company' 
            ? `[TO COMPANY ID:${recipient_id}] ${subject}`
            : `[TO ADMIN] ${subject}`;

        // Prepare recipient name for email
        let recipientName = 'Admin Support';
        if (recipient_type === 'company' && recipient_id) {
            const [companyRows] = await db.execute(
                'SELECT name FROM users WHERE id = ? AND role = "company"',
                [recipient_id]
            );
            
            if (companyRows.length > 0) {
                recipientName = companyRows[0].name;
            } else {
                return res.status(404).json({ message: 'Company not found' });
            }
        }

        const sql = `
            INSERT INTO support_tickets (
                user_id, ticket_number, subject, description, priority, category, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const [result] = await db.execute(sql, [
            userId, ticketNumber, enhancedSubject, message, priority, category
        ]);

        // 📧 SEND EMAIL NOTIFICATIONS (NON-BLOCKING)
        try {
            const { sendTicketEmail } = await import('../services/ticketEmailService.js');
            
            const ticketData = {
                ticket_number: ticketNumber,
                subject: subject, // Clean subject without prefixes
                description: message,
                priority: priority,
                category: category,
                user_name: user.name,
                user_email: user.email,
                user_role: user.role,
                recipient_type: recipient_type,
                recipient_id: recipient_id,
                recipient_name: recipientName
            };

            // Send email notification
            await sendTicketEmail('ticket_created', ticketData);
            console.log(`✅ Email notifications sent for user ticket ${ticketNumber}`);
        } catch (emailError) {
            console.error('❌ Error sending user ticket creation emails:', emailError);
            // Don't fail the ticket creation if email fails
        }

        res.status(201).json({
            message: 'Support ticket submitted successfully',
            ticketId: result.insertId,
            ticketNumber: ticketNumber,
            recipient_type: recipient_type,
            recipient_id: recipient_id
        });

    } catch (error) {
        console.error('Error submitting support ticket:', error);
        res.status(500).json({ message: 'Server error submitting ticket' });
    }
};

// @desc    Get user support tickets
// @route   GET /api/user/help/tickets
// @access  Private/User
const getUserTickets = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT id, ticket_number, subject, description as message, 
                   priority, category, status, admin_response, 
                   created_at, updated_at, responded_at
            FROM support_tickets
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        const [tickets] = await db.execute(sql, [userId]);
        
        // Parse recipient info from subject for display
        const enhancedTickets = tickets.map(ticket => {
            let recipient_name = 'Admin Support';
            let recipient_type = 'admin';
            
            if (ticket.subject.includes('[TO COMPANY ID:')) {
                const match = ticket.subject.match(/\[TO COMPANY ID:(\d+)\]/);
                if (match) {
                    recipient_type = 'company';
                    recipient_name = `Company (ID: ${match[1]})`;
                    // Clean the subject
                    ticket.subject = ticket.subject.replace(/\[TO COMPANY ID:\d+\]\s*/, '');
                }
            } else if (ticket.subject.includes('[TO ADMIN]')) {
                ticket.subject = ticket.subject.replace(/\[TO ADMIN\]\s*/, '');
            }
            
            return {
                ...ticket,
                recipient_name,
                recipient_type
            };
        });
        
        res.status(200).json(enhancedTickets);

    } catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
};

// @desc    Get companies that user has worked with
// @route   GET /api/user/companies
// @access  Private/User
const getUserCompanies = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get companies that have responded to this user's quotes
        const sql = `
            SELECT DISTINCT u.id, u.name, u.email, 
                   COUNT(qr.id) as quote_responses_count,
                   MAX(qr.created_at) as last_interaction
            FROM users u
            INNER JOIN quote_responses qr ON u.id = qr.company_id
            INNER JOIN quotes q ON qr.quote_id = q.id
            WHERE q.user_id = ? AND u.role = 'company'
            GROUP BY u.id, u.name, u.email
            ORDER BY last_interaction DESC, u.name ASC
        `;

        const [companies] = await db.execute(sql, [userId]);
        res.status(200).json(companies);

    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
};

// @desc    Get current company's profile information
// @route   GET /api/user/company-profile
// @access  Private/Company
const getCompanyProfile = async (req, res) => {
    try {
        const companyId = req.user.id;
        
        // Get company profile information
        const [rows] = await db.execute(`
            SELECT 
                id,
                name,
                email,
                phone,
                role,
                status,
                created_at,
                updated_at
            FROM users 
            WHERE id = ? AND role = 'company'
        `, [companyId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        const companyProfile = rows[0];
        res.status(200).json(companyProfile);

    } catch (error) {
        console.error('Error fetching company profile:', error);
        res.status(500).json({ message: 'Server error fetching company profile' });
    }
};

// @desc    Get user transaction invoices
// @route   GET /api/user/transaction-invoices
// @access  Private/User
const getUserTransactionInvoices = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT 
                ti.*,
                q.id as quote_id,
                q.departure_city,
                q.arrival_city,
                q.product_description,
                q.shipping_mode,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users c ON ti.company_id = c.id
            WHERE ti.user_id = ?
            ORDER BY ti.created_at DESC
        `;

        const [invoices] = await db.execute(sql, [userId]);
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching user transaction invoices:', error);
        res.status(500).json({ message: 'Server error fetching transaction invoices' });
    }
};

// @desc    Get user transaction invoice by ID
// @route   GET /api/user/transaction-invoices/:id
// @access  Private/User
const getUserTransactionInvoiceById = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                ti.*,
                q.id as quote_id,
                q.departure_city,
                q.arrival_city,
                q.product_description,
                q.shipping_mode,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users c ON ti.company_id = c.id
            WHERE ti.id = ? AND ti.user_id = ?
        `;

        const [rows] = await db.execute(sql, [id, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction invoice not found' });
        }

        const invoice = rows[0];
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching user transaction invoice details:', error);
        res.status(500).json({ message: 'Server error fetching transaction invoice details' });
    }
};

// @desc    Request password reset
// @route   POST /api/user/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide an email address' });
    }

    try {
        // Find user by email (exclude admin users)
        const [rows] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE email = ? AND role != "admin"', 
            [email]
        );

        // Always return success message for security (don't reveal if email exists)
        const successMessage = 'If an account with that email exists, you will receive a password reset link shortly.';

        if (rows.length === 0) {
            return res.status(200).json({ message: successMessage });
        }

        const user = rows[0];

        // Generate reset token
        const resetToken = generateResetToken();

        // Store token in database
        const storeResult = await storeResetToken(user.id, resetToken);
        if (!storeResult.success) {
            console.error('Error storing reset token:', storeResult.error);
            return res.status(500).json({ message: 'Error processing password reset request' });
        }

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send reset email
        const emailResult = await sendPasswordResetEmail(user.email, resetUrl, user.name);
        if (!emailResult.success) {
            console.error('Error sending reset email:', emailResult.error);
            return res.status(500).json({ message: 'Error sending password reset email' });
        }

        console.log(`✅ Password reset email sent to: ${user.email}`);
        res.status(200).json({ message: successMessage });

    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ message: 'Server error processing password reset request' });
    }
};

// @desc    Reset password with token
// @route   POST /api/user/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Please provide token and new password' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // Verify reset token
        const tokenResult = await verifyResetToken(token);
        if (!tokenResult.success) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const user = tokenResult.user;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, user.user_id]
        );

        // Mark token as used
        await markTokenAsUsed(token);

        console.log(`✅ Password reset successful for user: ${user.email}`);
        res.status(200).json({ 
            message: 'Password reset successful. You can now login with your new password.' 
        });

    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(500).json({ message: 'Server error resetting password' });
    }
};

// @desc    Verify reset token (for frontend validation)
// @route   GET /api/user/verify-reset-token/:token
// @access  Public
const verifyResetTokenEndpoint = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        const result = await verifyResetToken(token);
        if (!result.success) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        res.status(200).json({ 
            message: 'Token is valid',
            user: {
                email: result.user.email,
                name: result.user.name
            }
        });

    } catch (error) {
        console.error('Error verifying reset token:', error);
        res.status(500).json({ message: 'Server error verifying token' });
    }
};

export {
    loginUser,
    getAdminData,
    registerUser,
    getUserProfile,
    getUserProfileById,
    updateUserProfileById,
    getCompanyProfileByIdAdmin,
    updateCompanyProfileByIdAdmin,
    getCompanyProfile,
    getCompanies,      
    toggleCompanyStatus,
    getBusinessUsers,
    getRegularUsers,
    changePassword,
    getAllUsers,
    updateUserProfile,
    getAllUsersForMessaging,
    submitUserTicket,
    getUserTickets,
    getUserCompanies,
    getUserTransactionInvoices,
    getUserTransactionInvoiceById,
    forgotPassword,
    resetPassword,
    verifyResetTokenEndpoint
};