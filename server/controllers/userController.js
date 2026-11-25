// controllers/userController.js

import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createAdminNotification } from './adminController.js';
import { sendUserRegistrationNotificationToAdmin } from '../services/adminNotificationService.js';
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
import { generateReferralCode } from '../utils/referralCodeUtils.js';
import { recordReferral, processReferralReward } from '../services/referralService.js';
import { creditWelcomeBonus } from '../services/walletService.js';
import couponService from '../services/couponService.js';

// Keep-alive function to prevent token expiration
const keepAlive = async (req, res) => {
    try {
        // Simple ping response that confirms the user is authenticated
        // This will keep the backend active and prevent token expiration
        const user = req.user; // Available from protect middleware
        
        res.status(200).json({
            success: true,
            message: 'Keep-alive ping successful',
            timestamp: new Date().toISOString(),
            userId: user.id,
            userRole: user.role
        });
    } catch (error) {
        console.error('Keep-alive error:', error);
        res.status(500).json({
            success: false,
            message: 'Keep-alive ping failed',
            error: error.message
        });
    }
};

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
            return res.status(403).json({ 
                message: 'Your account has been blacklisted. Please contact support.',
                accountBlacklisted: true 
            });
        }
        
        if (user.status === 0) {
            // Check if this is a business or company user pending admin approval
            if (user.role === 'business' || user.role === 'company') {
                return res.status(403).json({ 
                    message: 'Your account is pending admin approval. Please wait for an administrator to activate your account.',
                    accountStatus: 'pending_approval'
                });
            }
            // Generic inactive account message
            else {
                return res.status(403).json({ 
                    message: 'Your account is currently inactive. Please contact support.',
                    accountDeactivated: true 
                });
            }
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
            { expiresIn: '8h' }, // Set to 8 hours for better balance
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name, 
                        email: user.email,
                        role: user.role,
                        // Needed so prices can be shown in the user's local currency.
                        country: user.country,
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

      // 4. Referral codes are generated for company accounts only (see step 6).
      //    The referral program is available in the company panel only.
      let finalReferralCode = null;

      // 5. Determine initial status based on role
      // Regular users are automatically activated
      // Business users and company users need admin approval (status = 0 until approved)
      const initialStatus = role === 'user' ? 1 : 0;
      
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

      // 6. Generate a unique new-format referral code (company accounts only)
      if (role === 'company') {
        let newCode;
        let collision;
        do {
          newCode = generateReferralCode(role);
          const [check] = await db.execute('SELECT id FROM users WHERE referral_code = ?', [newCode]);
          collision = check.length > 0;
        } while (collision);
        await db.execute('UPDATE users SET referral_code = ? WHERE id = ?', [newCode, newUserId]);
        finalReferralCode = newCode;
      }

      // 7. Record referral + fire reward (sequential — reward needs the referral row to exist)
      if (referralCode) {
        try {
          await recordReferral(referralCode, newUserId, role);
        } catch (err) {
          console.error('❌ recordReferral error:', err);
        }
        processReferralReward(newUserId, 'registration').catch(err =>
          console.error('❌ processReferralReward error:', err)
        );
      }

      // 7b. Welcome bonus — credited to every new company (referred or not)
      if (role === 'company') {
        creditWelcomeBonus(newUserId).catch(err =>
          console.error('❌ creditWelcomeBonus error:', err)
        );
      }

      // 🎯 SEND WELCOME MESSAGE TO NEW USER
      // Send welcome message for all user types (but not visible to admin)
      await sendWelcomeMessage(newUserId, role);

      // 🎟️ ISSUE WELCOME COUPON (if admin has configured one)
      couponService.issueWelcomeCoupon(newUserId, role).catch(err =>
        console.error('❌ issueWelcomeCoupon error:', err)
      );

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

      // Create admin notification for all user registrations
      try {
          console.log(`🔔 Creating admin notification for ${role} user: ${name} (ID: ${newUserId})`);
          await sendUserRegistrationNotificationToAdmin(newUserId, name, role, email);
          console.log(`✅ Admin notification created successfully for user ${newUserId}`);
      } catch (notificationError) {
          console.error(`❌ Failed to create admin notification for user ${newUserId}:`, notificationError);
          // Don't fail the registration if notification fails
      }

      // Send real-time notification to admins for all user types
      try {
          console.log(`📡 Sending real-time notification for ${role} user: ${name}`);
          await realTimeNotificationService.notifyNewUserRegistration({
              id: newUserId,
              name: name,
              email: email,
              role: role,
              created_at: new Date().toISOString()
          });
          console.log(`✅ Real-time notification sent successfully for user ${newUserId}`);
      } catch (realtimeError) {
          console.error(`❌ Failed to send real-time notification for user ${newUserId}:`, realtimeError);
          // Don't fail the registration if real-time notification fails
      }

      // 7. Send appropriate response based on role
      if (role === 'user') {
          // Regular users can login immediately - provide token for auto-login
          const payload = {
              id: newUserId,
              role: role,
          };

          jwt.sign(
              payload,
              process.env.JWT_SECRET,
              { expiresIn: '8h' }, // Standardize to 8 hours
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
          // Business users and company users need admin approval
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
                skype, website, facebook, twitter, instagram,
                logo, company_address, about_company
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
        
        // Convert MySQL boolean values (0/1) to JavaScript booleans
        userProfile.status = Boolean(userProfile.status);
        userProfile.is_blacklisted = Boolean(userProfile.is_blacklisted);
        
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
        console.log('🔹 updateCompanyProfileByIdAdmin called');

        const { id } = req.params;
        console.log('📌 Company ID:', id);

        const {
            name, email, phone, category, country, state, city,
            owner_name, owner_phone, incharge_name, incharge_phone,
            skype, website, facebook, twitter, instagram, linkedin,
            map_location, company_address, about_company,
            latitude, longitude
        } = req.body;

        console.log('📦 Request Body:', req.body);

        // Validate input
        if (!name || !email) {
            console.warn('⚠️ Validation failed: name or email missing');
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        const emailCheckSql = `SELECT id FROM users WHERE email = ? AND id != ?`;
        console.log('🔍 Checking email uniqueness:', email);

        const [emailCheck] = await db.execute(emailCheckSql, [email, id]);
        console.log('📄 Email check result:', emailCheck);

        if (emailCheck.length > 0) {
            console.warn('⚠️ Email already taken by another user');
            return res.status(400).json({ message: 'Email is already taken by another user' });
        }

        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => {
            if (value === undefined || value === null || value === '') {
                return null;
            }
            return value;
        };

        const sql = `
            UPDATE users SET
                name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                map_location = ?, company_address = ?, about_company = ?,
                latitude = ?, longitude = ?,
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
            sanitizeValue(map_location), sanitizeValue(company_address), sanitizeValue(about_company),
            sanitizeValue(latitude), sanitizeValue(longitude),
            id
        ];

        console.log('📝 Update SQL:', sql);
        console.log('🧾 SQL Values:', values);

        const [result] = await db.execute(sql, values);
        console.log('✅ Update result:', result);

        if (result.affectedRows === 0) {
            console.warn('❌ No rows affected — company not found or role mismatch');
            return res.status(404).json({ message: 'Company not found' });
        }

        console.log('🎉 Company profile updated successfully');
        res.status(200).json({ message: 'Company profile updated successfully' });

    } catch (error) {
        console.error('🔥 Error updating company profile:', error);
        res.status(500).json({ message: 'Server error updating company profile' });
    }
};

const updateUserProfileById = async (req, res) => {
    try {
        console.log('🔹 updateUserProfileById called');

        const { id } = req.params;
        console.log('📌 User ID:', id);

        const { 
            name, email, mobile, category, country, state, city,
            owner_name, owner_phone, incharge_name, incharge_phone,
            website, skype, logo, about_company
        } = req.body;

        console.log('📦 Request Body:', req.body);

        // Validate input
        if (!name || !email) {
            console.warn('⚠️ Validation failed: name or email missing');
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        const emailCheckSql = `SELECT id FROM users WHERE email = ? AND id != ?`;
        console.log('🔍 Checking email uniqueness:', email);

        const [emailCheck] = await db.execute(emailCheckSql, [email, id]);
        console.log('📄 Email check result:', emailCheck);

        if (emailCheck.length > 0) {
            console.warn('⚠️ Email already exists for another user');
            return res.status(400).json({ message: 'Email is already taken by another user' });
        }

        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => {
            if (value === undefined || value === null || value === '') {
                return null;
            }
            return value;
        };

        const sql = `
            UPDATE users 
            SET name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                website = ?, skype = ?, logo = ?, about_company = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const values = [
            sanitizeValue(name), sanitizeValue(email), sanitizeValue(mobile), 
            sanitizeValue(category), sanitizeValue(country), sanitizeValue(state), sanitizeValue(city),
            sanitizeValue(owner_name), sanitizeValue(owner_phone), 
            sanitizeValue(incharge_name), sanitizeValue(incharge_phone),
            sanitizeValue(website), sanitizeValue(skype), sanitizeValue(logo), 
            sanitizeValue(about_company), id
        ];

        console.log('📝 Update SQL:', sql);
        console.log('🧾 SQL Values:', values);

        const [result] = await db.execute(sql, values);
        console.log('✅ Update result:', result);

        if (result.affectedRows === 0) {
            console.warn('❌ No rows affected — user not found');
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('🎉 User profile updated successfully');
        res.status(200).json({ message: 'User profile updated successfully' });

    } catch (error) {
        console.error('🔥 Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating user profile' });
    }
};


const getCompanies = async (req, res) => {
    try {
        // We select specific fields and alias them to match your frontend requirements
        // is_blacklisted -> onBlacklist
        // phone -> mobile
        // The latest subscription (active first, then most recent) is joined so the
        // admin can filter companies that do / do not have a subscription.
        const sql = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.phone AS mobile, 
                u.role, 
                u.is_blacklisted AS onBlacklist, 
                u.status,
                u.created_at,
                mp.name AS plan_name,
                us.status AS subscription_status,
                us.end_date AS subscription_end
            FROM users u
            LEFT JOIN user_subscriptions us
                ON us.id = (
                    SELECT us2.id
                    FROM user_subscriptions us2
                    WHERE us2.user_id = u.id
                    ORDER BY (us2.status = 'active') DESC, us2.end_date DESC, us2.id DESC
                    LIMIT 1
                )
            LEFT JOIN membership_plans mp ON mp.id = us.plan_id
            WHERE u.role = 'company'
        `;
        
        const [rows] = await db.execute(sql);
        
        // Ensure boolean values are actually booleans (MySQL returns 0/1).
        // hasSubscription = an active subscription whose end date has not passed.
        const now = Date.now();
        const formattedRows = rows.map(user => {
            const end = user.subscription_end ? new Date(user.subscription_end).getTime() : 0;
            return {
                ...user,
                onBlacklist: Boolean(user.onBlacklist),
                status: Boolean(user.status),
                hasSubscription: user.subscription_status === 'active' && end > now,
            };
        });

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
    const { type, value, reason } = req.body; // type will be 'blacklist' or 'status', value is boolean, reason for blacklist

    try {
        let sql = '';
        let sqlValue = value ? 1 : 0; // Convert boolean to MySQL TinyInt
        let params = [];

        if (type === 'blacklist') {
            if (value && !reason) {
                return res.status(400).json({ message: 'Blacklist reason is required' });
            }
            
            if (value) {
                // Blacklisting - set reason and date
                sql = 'UPDATE users SET is_blacklisted = ?, blacklist_reason = ?, blacklist_date = NOW() WHERE id = ?';
                params = [sqlValue, reason, id];
            } else {
                // Unblacklisting - clear reason and date
                sql = 'UPDATE users SET is_blacklisted = ?, blacklist_reason = NULL, blacklist_date = NULL WHERE id = ?';
                params = [sqlValue, id];
            }
        } else if (type === 'status') {
            sql = 'UPDATE users SET status = ? WHERE id = ?';
            params = [sqlValue, id];
        } else {
            return res.status(400).json({ message: 'Invalid update type' });
        }

        // Get user details before updating
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userRows[0];

        await db.execute(sql, params);

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

// @desc    Get all blacklisted companies
// @route   GET /api/user/blacklisted-companies
// @access  Private/Company
const getBlacklistedCompanies = async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                name, 
                email, 
                phone AS mobile, 
                role, 
                is_blacklisted AS onBlacklist, 
                blacklist_reason,
                blacklist_date,
                status,
                country,
                city,
                category,
                created_at
            FROM users 
            WHERE role = 'company' AND is_blacklisted = 1
            ORDER BY blacklist_date DESC
        `;
        
        const [rows] = await db.execute(sql);
        
        // Convert MySQL 1/0 to Javascript true/false
        const companies = rows.map(row => ({
            ...row,
            onBlacklist: Boolean(row.onBlacklist),
            status: Boolean(row.status)
        }));
        
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching blacklisted companies:', error);
        res.status(500).json({ message: 'Server error fetching blacklisted companies' });
    }
};

// @desc    Get public blacklist (excludes sensitive information)
// @route   GET /api/user/public-blacklist
// @access  Public
const getPublicBlacklist = async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                name, 
                blacklist_reason,
                blacklist_date,
                country,
                city,
                category,
                created_at
            FROM users 
            WHERE role = 'company' AND is_blacklisted = 1
            ORDER BY blacklist_date DESC
        `;
        
        const [rows] = await db.execute(sql);
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching public blacklist:', error);
        res.status(500).json({ message: 'Server error fetching public blacklist' });
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
                status,
                logo,
                company_logo,
                incharge_image,
                category,
                country,
                state,
                city,
                owner_name,
                owner_phone,
                incharge_name,
                incharge_phone,
                skype,
                website,
                facebook,
                twitter,
                instagram,
                linkedin,
                services,
                company_address,
                about_company,
                created_at
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
                c.phone as company_phone,
                c.logo as company_logo,
                c.about_company as company_description,
                c.website as company_website,
                qr.price as quote_price,
                qr.transit_time,
                qr.inclusions,
                qr.value_added_services,
                qr.terms,
                qr.notes as quote_notes
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users c ON ti.company_id = c.id
            LEFT JOIN quote_responses qr ON qr.quote_id = q.id AND qr.company_id = c.id
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
                c.phone as company_phone,
                c.logo as company_logo,
                c.about_company as company_description,
                c.website as company_website,
                qr.price as quote_price,
                qr.transit_time,
                qr.inclusions,
                qr.value_added_services,
                qr.terms,
                qr.notes as quote_notes
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users c ON ti.company_id = c.id
            LEFT JOIN quote_responses qr ON qr.quote_id = q.id AND qr.company_id = c.id
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
        // Find user by email (now includes admin users)
        const [rows] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE email = ?', 
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

// @desc    Refresh authentication token
// @route   POST /api/user/refresh-token
// @access  Private
const refreshToken = async (req, res) => {
    try {
        // The user is already authenticated via the protect middleware
        const user = req.user;
        
        // Generate a new token with extended expiration
        const payload = {
            id: user.id,
            role: user.role,
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }, // Fresh 8-hour token
            (err, token) => {
                if (err) {
                    console.error('JWT Refresh Error:', err);
                    return res.status(500).json({ message: 'Error refreshing token' });
                }
                
                res.status(200).json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                    message: 'Token refreshed successfully'
                });
            }
        );

    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Server error refreshing token' });
    }
};

// @desc    Admin — full details + past records for a user / business / company
// @route   GET /api/user/admin-details/:role/:id
// @access  Admin
const adminGetUserDetails = async (req, res) => {
    const { role, id } = req.params;
    const allowedRoles = ['user', 'business', 'company'];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be user, business or company.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = rows[0];
        if (profile.role !== role) {
            return res.status(409).json({ message: `User #${id} is not a ${role}.` });
        }

        delete profile.password;
        profile.status = Boolean(profile.status);
        profile.is_blacklisted = Boolean(profile.is_blacklisted);
        profile.email_verified = Boolean(profile.email_verified);

        const response = { profile };

        // ─── Wallet (company only) ────────────────────────────────────────
        if (role === 'company') {
            const [walletRows] = await db.execute(
                'SELECT balance_bhd, lifetime_earned, lifetime_used FROM referral_wallet WHERE user_id = ?',
                [id]
            );
            response.wallet = walletRows[0]
                ? {
                    balance: Number(walletRows[0].balance_bhd),
                    lifetimeEarned: Number(walletRows[0].lifetime_earned),
                    lifetimeUsed: Number(walletRows[0].lifetime_used)
                }
                : { balance: 0, lifetimeEarned: 0, lifetimeUsed: 0 };

            const [walletTxns] = await db.execute(
                `SELECT id, type, amount_bhd, balance_after, description, status, created_at
                 FROM referral_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
                [id]
            );
            response.walletTransactions = walletTxns;

            const [topups] = await db.execute(
                `SELECT id, amount_bhd, method, status, created_at
                 FROM wallet_topup_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
                [id]
            );
            response.topupRequests = topups;
        }

        // ─── Referrals ────────────────────────────────────────────────────
        const [madeRows] = await db.execute(
            `SELECT r.id, r.status, r.created_at,
                    u.name AS referred_name, u.email AS referred_email, u.role AS referred_role
             FROM referrals r LEFT JOIN users u ON r.referred_id = u.id
             WHERE r.referrer_id = ? ORDER BY r.created_at DESC LIMIT 50`,
            [id]
        );
        response.referralsMade = madeRows;

        const [receivedRows] = await db.execute(
            `SELECT r.id, r.status, r.created_at,
                    u.name AS referrer_name, u.role AS referrer_role
             FROM referrals r LEFT JOIN users u ON r.referrer_id = u.id
             WHERE r.referred_id = ? LIMIT 5`,
            [id]
        );
        response.referredBy = receivedRows;

        // ─── Login history ────────────────────────────────────────────────
        const [logins] = await db.execute(
            'SELECT login_time, ip_address, status FROM login_history WHERE user_id = ? ORDER BY login_time DESC LIMIT 10',
            [id]
        );
        response.loginHistory = logins;

        // ─── Role-specific records ────────────────────────────────────────
        if (role === 'company') {
            const [subs] = await db.execute(
                `SELECT us.id, us.plan_id, mp.name AS plan_name, mp.price AS plan_price,
                        us.start_date, us.end_date, us.status, us.payment_status,
                        us.amount_paid, us.final_amount_bhd, us.wallet_amount_applied,
                        us.payment_method, us.created_at
                 FROM user_subscriptions us
                 LEFT JOIN membership_plans mp ON us.plan_id = mp.id
                 WHERE us.user_id = ? ORDER BY us.created_at DESC`,
                [id]
            );
            response.subscriptions = subs;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const active = subs.find(
                (s) => s.status === 'active' && new Date(s.end_date) >= today
            );
            response.activeSubscription = active || null;
            response.hasActiveSubscription = Boolean(active);

            const [respRows] = await db.execute(
                `SELECT qr.id, qr.quote_id, qr.price, qr.status, qr.transit_time, qr.created_at,
                        q.departure_city, q.arrival_city, q.shipping_mode
                 FROM quote_responses qr LEFT JOIN quotes q ON qr.quote_id = q.id
                 WHERE qr.company_id = ? ORDER BY qr.created_at DESC LIMIT 50`,
                [id]
            );
            response.quoteResponses = respRows;

            const [txns] = await db.execute(
                `SELECT id, amount, status, payment_method, transaction_reference, created_at
                 FROM transactions WHERE company_id = ? ORDER BY created_at DESC LIMIT 50`,
                [id]
            );
            response.transactions = txns;

            const [banks] = await db.execute(
                `SELECT id, bank_name, account_holder_name, account_number, swift_code,
                        iban_number, branch_name, is_active, is_default
                 FROM company_bank_details WHERE company_id = ?`,
                [id]
            );
            response.bankDetails = banks;
            response.paypalEmail = profile.paypal_email || '';

            const [members] = await db.execute(
                'SELECT id, member_name, member_email, member_phone, member_role FROM company_members WHERE company_id = ?',
                [id]
            );
            response.members = members;

            const [branches] = await db.execute(
                'SELECT id, branch_name, country, state, city, branch_email, branch_phone FROM company_branches WHERE company_id = ?',
                [id]
            );
            response.branches = branches;

            const [revs] = await db.execute(
                `SELECT r.id, r.rating, r.review_text, r.status, r.created_at, u.name AS reviewer_name
                 FROM reviews r LEFT JOIN users u ON r.user_id = u.id
                 WHERE r.company_id = ? ORDER BY r.created_at DESC LIMIT 20`,
                [id]
            );
            response.reviews = revs;

            const [disp] = await db.execute(
                'SELECT id, title, status, priority, created_at FROM disputes WHERE company_id = ? ORDER BY created_at DESC LIMIT 20',
                [id]
            );
            response.disputes = disp;

            const [blh] = await db.execute(
                'SELECT id, action, reason, created_at FROM blacklist_history WHERE company_id = ? ORDER BY created_at DESC LIMIT 20',
                [id]
            );
            response.blacklistHistory = blh;
        } else {
            const [quotes] = await db.execute(
                `SELECT id, departure_city, arrival_city, departure_country, arrival_country,
                        shipping_mode, status, created_at
                 FROM quotes WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
                [id]
            );
            response.quotes = quotes;

            const [txns] = await db.execute(
                `SELECT id, amount, status, payment_method, transaction_reference, created_at
                 FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
                [id]
            );
            response.transactions = txns;

            const [invs] = await db.execute(
                'SELECT id, invoice_number, total_amount, status, created_at FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                [id]
            );
            response.invoices = invs;

            const [revs] = await db.execute(
                'SELECT id, rating, review_text, status, created_at FROM reviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
                [id]
            );
            response.reviews = revs;

            const [disp] = await db.execute(
                'SELECT id, title, status, priority, created_at FROM disputes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
                [id]
            );
            response.disputes = disp;

            const [tix] = await db.execute(
                'SELECT id, ticket_number, subject, status, priority, created_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
                [id]
            );
            response.tickets = tix;

            const [wish] = await db.execute(
                `SELECT w.id, w.created_at, c.name AS company_name
                 FROM wishlist w LEFT JOIN users c ON w.company_id = c.id
                 WHERE w.user_id = ? ORDER BY w.created_at DESC LIMIT 20`,
                [id]
            );
            response.wishlist = wish;

            // Bank account added from the profile (business & regular user share
            // the user_bank_details table). Table is created lazily, so guard it.
            try {
                const [banks] = await db.execute(
                    `SELECT id, bank_name, branch_name, branch_address, account_holder_name,
                            account_number, iban_number, swift_code, ifsc_code,
                            payment_instructions, is_active, is_default, created_at
                     FROM user_bank_details WHERE user_id = ?
                     ORDER BY is_default DESC, created_at DESC`,
                    [id]
                );
                response.bankDetails = banks;
            } catch (bankErr) {
                response.bankDetails = [];
            }
        }

        response.counts = {
            walletTransactions: (response.walletTransactions || []).length,
            topups: (response.topupRequests || []).length,
            referralsMade: (response.referralsMade || []).length,
            quotes: (response.quotes || []).length,
            quoteResponses: (response.quoteResponses || []).length,
            subscriptions: (response.subscriptions || []).length,
            transactions: (response.transactions || []).length,
            invoices: (response.invoices || []).length,
            reviews: (response.reviews || []).length,
            disputes: (response.disputes || []).length,
            tickets: (response.tickets || []).length
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching admin user details:', error);
        res.status(500).json({ message: 'Server error fetching user details' });
    }
};

// @desc    Admin — permanently delete a user and all their related records
// @route   DELETE /api/user/admin-delete/:id
// @access  Admin
const adminDeleteUser = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();

    try {
        const [rows] = await conn.execute('SELECT id, role, name FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        if (user.role === 'admin') {
            conn.release();
            return res.status(403).json({ message: 'Admin accounts cannot be deleted.' });
        }

        await conn.beginTransaction();

        const [quoteRows] = await conn.query('SELECT id FROM quotes WHERE user_id = ?', [id]);
        const quoteIds = quoteRows.map((r) => r.id);
        const quoteIn = quoteIds.length ? quoteIds : [0];

        const [respRows] = await conn.query(
            'SELECT id FROM quote_responses WHERE company_id = ? OR quote_id IN (?)',
            [id, quoteIn]
        );
        const respIds = respRows.map((r) => r.id);
        const respIn = respIds.length ? respIds : [0];

        // Quote-response children
        await conn.query('DELETE FROM quote_response_bank_details WHERE quote_response_id IN (?)', [respIn]);

        // Payment records tied to the user / their quotes
        await conn.query(
            'DELETE FROM payment_proofs WHERE user_id = ? OR company_id = ? OR quote_id IN (?) OR quote_response_id IN (?)',
            [id, id, quoteIn, respIn]
        );
        await conn.query(
            'DELETE FROM payment_verifications WHERE user_id = ? OR company_id = ? OR quote_id IN (?) OR quote_response_id IN (?)',
            [id, id, quoteIn, respIn]
        );

        await conn.query('DELETE FROM user_quote_status WHERE user_id = ? OR company_id = ? OR quote_id IN (?)', [id, id, quoteIn]);
        await conn.query('DELETE FROM transaction_invoices WHERE user_id = ? OR company_id = ? OR quote_id IN (?)', [id, id, quoteIn]);
        await conn.query('DELETE FROM quote_responses WHERE id IN (?)', [respIn]);
        await conn.query('DELETE FROM quotes WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM invoices WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM transactions WHERE user_id = ? OR company_id = ?', [id, id]);

        // Subscriptions
        await conn.query('DELETE FROM subscription_requests WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM user_subscriptions WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM subscription_audit WHERE user_id = ?', [id]);

        // Company-owned data
        await conn.query('DELETE FROM company_bank_details WHERE company_id = ?', [id]);
        await conn.query('DELETE FROM company_members WHERE company_id = ?', [id]);
        await conn.query('DELETE FROM company_branches WHERE company_id = ?', [id]);
        await conn.query('DELETE FROM blacklist_history WHERE company_id = ?', [id]);

        // Engagement
        await conn.query('DELETE FROM reviews WHERE user_id = ? OR company_id = ?', [id, id]);
        await conn.query('DELETE FROM disputes WHERE user_id = ? OR company_id = ?', [id, id]);
        await conn.query('DELETE FROM support_tickets WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [id, id]);
        await conn.query('DELETE FROM wishlist WHERE user_id = ? OR company_id = ?', [id, id]);
        await conn.query('DELETE FROM profile_views WHERE company_id = ? OR viewer_id = ?', [id, id]);
        await conn.query('DELETE FROM login_history WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM user_notifications WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM suggestions WHERE user_id = ?', [id]);

        // Coupons
        await conn.query('DELETE FROM coupon_redemptions WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM user_coupons WHERE user_id = ?', [id]);

        // Wallet & referrals
        await conn.query('DELETE FROM referral_transactions WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM referral_wallet WHERE user_id = ?', [id]);
        await conn.query('DELETE FROM referrals WHERE referrer_id = ? OR referred_id = ?', [id, id]);
        await conn.query('DELETE FROM wallet_topup_requests WHERE user_id = ?', [id]);

        // Finally the user
        await conn.query('DELETE FROM users WHERE id = ?', [id]);

        await conn.commit();
        res.status(200).json({ message: `User "${user.name}" deleted successfully`, id: Number(id) });
    } catch (error) {
        try { await conn.rollback(); } catch (e) { /* ignore */ }
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    } finally {
        conn.release();
    }
};

// @desc    Export every user of a given role with their complete profile data
// @route   GET /api/user/admin-export/:role
// @access  Private/Admin
const adminExportUsers = async (req, res) => {
    const { role } = req.params;
    const allowedRoles = ['user', 'business', 'company'];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be user, business or company.' });
    }

    try {
        // Every column is returned so the admin gets the full profile (logo links,
        // address, socials, ...). The password hash is the only thing stripped.
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
            [role]
        );

        rows.forEach((row) => {
            delete row.password;
            if (row.is_blacklisted !== undefined) row.is_blacklisted = Boolean(row.is_blacklisted);
            if (row.status !== undefined) row.status = Boolean(row.status);
            if (row.email_verified !== undefined) row.email_verified = Boolean(row.email_verified);
        });

        if (role === 'company') {
            // SELECT * keeps this working regardless of which optional bank columns
            // exist in a given environment (the client only maps the ones it knows).
            const [banks] = await db.execute(
                'SELECT * FROM company_bank_details ORDER BY is_default DESC, id ASC'
            );
            const byCompany = banks.reduce((acc, bank) => {
                (acc[bank.company_id] = acc[bank.company_id] || []).push(bank);
                return acc;
            }, {});
            rows.forEach((row) => { row.bankDetails = byCompany[row.id] || []; });
        }

        res.status(200).json({ role, total: rows.length, users: rows });
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({ message: 'Server error exporting users' });
    }
};

// @desc    Bulk import users (CSV/Excel parsed on the client) for a given role
// @route   POST /api/user/admin-bulk-import
// @access  Private/Admin
const adminBulkImportUsers = async (req, res) => {
    const { role, users } = req.body;
    const allowedRoles = ['user', 'business', 'company'];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be user, business or company.' });
    }
    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: 'No rows found in the uploaded file.' });
    }
    if (users.length > 1000) {
        return res.status(400).json({ message: 'Too many rows — maximum 1000 users per upload.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Regular users and business owners are activated immediately on import.
    // Company owners start inactive until an admin approves them.
    const initialStatus = role === 'company' ? 0 : 1;

    const inserted = [];
    const skipped = [];
    const failed = [];

    // Track values already handled in this upload so the same email or phone
    // number cannot be imported twice from one file.
    const seenEmails = new Set();
    const seenPhones = new Set();

    for (let i = 0; i < users.length; i++) {
        const raw = users[i] || {};
        const rowNumber = i + 2; // header occupies row 1 of the uploaded sheet

        const name = (raw.name ?? '').toString().trim();
        const email = (raw.email ?? '').toString().trim().toLowerCase();
        const country = (raw.country ?? '').toString().trim();
        const phone = (raw.phone ?? raw.mobile ?? '').toString().trim();
        // Category is optional for imports — empty values are stored as NULL.
        const category = (raw.category ?? '').toString().trim() || null;
        const phoneKey = phone.replace(/\D/g, '');

        if (!name || !email || !country || !phone) {
            failed.push({ row: rowNumber, email, reason: 'Missing required field (name, email, country, phone).' });
            continue;
        }
        if (!emailRegex.test(email)) {
            failed.push({ row: rowNumber, email, reason: 'Invalid email address.' });
            continue;
        }

        // Duplicate email / phone number inside the uploaded file itself.
        if (seenEmails.has(email)) {
            skipped.push({ row: rowNumber, email, reason: 'Duplicate email inside the uploaded file.' });
            continue;
        }
        if (phoneKey && seenPhones.has(phoneKey)) {
            skipped.push({ row: rowNumber, email, reason: 'Duplicate phone number inside the uploaded file.' });
            continue;
        }
        seenEmails.add(email);
        if (phoneKey) seenPhones.add(phoneKey);

        try {
            const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (existingEmail.length > 0) {
                skipped.push({ row: rowNumber, email, reason: 'Email already registered.' });
                continue;
            }

            const [existingPhone] = await db.execute('SELECT id FROM users WHERE phone = ?', [phone]);
            if (existingPhone.length > 0) {
                skipped.push({ row: rowNumber, email, reason: 'Phone number already registered.' });
                continue;
            }

            const generatedPassword = crypto.randomBytes(5).toString('hex'); // 10 chars
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            const [result] = await db.execute(
                `INSERT INTO users (name, email, phone, password, role, category, country, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, hashedPassword, role, category, country, initialStatus]
            );

            inserted.push({ id: result.insertId, name, email, password: generatedPassword });
        } catch (err) {
            console.error(`Bulk import failed for row ${rowNumber}:`, err.message);
            failed.push({
                row: rowNumber,
                email,
                reason: err.code === 'ER_DUP_ENTRY' ? 'Email or phone number already registered.' : 'Could not save this row.',
            });
        }
    }

    res.status(200).json({
        message: `${inserted.length} of ${users.length} user(s) imported successfully.`,
        summary: {
            total: users.length,
            inserted: inserted.length,
            skipped: skipped.length,
            failed: failed.length,
        },
        inserted,
        skipped,
        failed,
    });
};

export {
    adminGetUserDetails,
    adminDeleteUser,
    adminExportUsers,
    adminBulkImportUsers,
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
    getBlacklistedCompanies,
    getPublicBlacklist,
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
    verifyResetTokenEndpoint,
    refreshToken,
    keepAlive
};