// controllers/userController.js

import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAdminNotification } from './adminController.js';

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
      // Regular users are automatically activated, companies/businesses need approval
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

      // 6. Generate and update referral code if it wasn't provided
      if (!referralCode) {
          const generatedReferralCode = `GSN${newUserId}${String(newUserId).padStart(4, '0')}`;
          await db.execute('UPDATE users SET referral_code = ? WHERE id = ?', [generatedReferralCode, newUserId]);
          finalReferralCode = generatedReferralCode;
      }

      // Create admin notification for company and business registrations
      if (role === 'company' || role === 'business') {
          const roleText = role === 'company' ? 'Company Owner' : 'Business Owner';
          await createAdminNotification(
              'registration',
              `New ${roleText} Registration`,
              `${name} (${email}) has registered as a ${roleText} and is pending approval.`,
              newUserId
          );
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
                          message: 'Registration successful! Welcome to GSN.',
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
          // Companies and businesses need admin approval
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
            'SELECT id, name, email, phone, role, country, created_at FROM users WHERE id = ?', 
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
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

        await db.execute(sql, [sqlValue, id]);

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
    const { name, email, phone, country } = req.body;

    try {
        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        const sql = `
            UPDATE users SET 
                name = ?, email = ?, phone = ?, country = ?
            WHERE id = ?
        `;

        const values = [
            sanitizeValue(name),
            sanitizeValue(email), 
            sanitizeValue(phone),
            sanitizeValue(country),
            userId
        ];

        await db.execute(sql, values);

        res.status(200).json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
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
    getCompanies,      
    toggleCompanyStatus,
    getBusinessUsers,
    getRegularUsers,
    changePassword,
    getAllUsers,
    updateUserProfile
};