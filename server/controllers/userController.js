// controllers/userController.js

import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

      // 4. Determine initial status based on role
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
          values = [name, email, phone, hashedPassword, role, country, referralCode || null, initialStatus];
      } else {
          // For companies and businesses, include category
          sql = `
              INSERT INTO users (name, email, phone, password, role, category, country, referral_code, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          values = [name, email, phone, hashedPassword, role, category, country, referralCode || null, initialStatus];
      }
      
      const [result] = await db.execute(sql, values);

      const newUserId = result.insertId;

      // 5. Send appropriate response based on role
      if (role === 'user') {
          // Regular users can login immediately
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
            'SELECT id, name, email, phone, role FROM users WHERE id = ?', 
            [userId]
        );
        const user = rows[0];

        if (user) {
            // Your frontend code expects `username` and `phone_number`
            // Let's create a consistent object to return
            const userProfile = {
                id: user.id,
                user: user.name, // Use name or username field
                email: user.email,
                phone_number: user.phone, // Use phone field
                role: user.role
            };
            res.status(200).json(userProfile);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
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

export {
    loginUser,
    getAdminData,
    registerUser,
    getUserProfile,
    getCompanies,      
    toggleCompanyStatus,
    getBusinessUsers,
    getRegularUsers,
    changePassword,
    getAllUsers
};