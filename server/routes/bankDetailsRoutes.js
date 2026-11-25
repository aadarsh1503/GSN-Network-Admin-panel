// routes/bankDetailsRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import db from '../config/db.js';

console.log('🏦 Bank Details Routes loaded at:', new Date().toISOString());

const router = express.Router();

// ---------------------------------------------------------------------------
// Unified bank details for non-company roles (business / user).
// Companies keep using company_bank_details; business & user accounts use this
// shared table so the profile-completion flow can mandate a main bank account.
// ---------------------------------------------------------------------------
let userBankTableReady = null;
const ensureUserBankDetailsTable = () => {
  if (!userBankTableReady) {
    userBankTableReady = db.execute(
      `CREATE TABLE IF NOT EXISTS user_bank_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        branch_name VARCHAR(255) DEFAULT NULL,
        branch_address VARCHAR(255) DEFAULT NULL,
        account_holder_name VARCHAR(255) DEFAULT NULL,
        account_number VARCHAR(100) DEFAULT NULL,
        iban_number VARCHAR(100) DEFAULT NULL,
        swift_code VARCHAR(50) DEFAULT NULL,
        ifsc_code VARCHAR(50) DEFAULT NULL,
        payment_instructions TEXT DEFAULT NULL,
        is_default TINYINT(1) DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_bank_user (user_id)
      )`
    ).catch((error) => {
      userBankTableReady = null;
      throw error;
    });
  }
  return userBankTableReady;
};

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint hit!');
  res.json({ message: 'Bank details routes are working!' });
});

// @desc    Get active admin bank details for payments
// @route   GET /api/bank-details/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const [bankDetails] = await db.execute(
      `SELECT 
        id, bank_name, branch_name, branch_address, ifsc_code, account_number, 
        account_holder_name, iban_number, swift_code, payment_instructions, 
        is_active, created_at
       FROM admin_bank_details 
       WHERE is_active = 1 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (bankDetails.length === 0) {
      return res.status(404).json({ message: 'No active bank details found' });
    }

    // Admin PayPal receiving id (set from admin panel → Bank Details page)
    const [paypalRows] = await db.execute(
      "SELECT setting_value FROM general_settings WHERE setting_key = 'admin_paypal_id'"
    );

    res.json({ ...bankDetails[0], paypal_id: paypalRows[0]?.setting_value || null });
  } catch (error) {
    console.error('Error fetching active bank details:', error);
    res.status(500).json({ message: 'Server error fetching bank details' });
  }
});

// @desc    Get all admin bank details (Admin only)
// @route   GET /api/bank-details/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const [bankDetails] = await db.execute(
      `SELECT 
        id, bank_name, branch_name, branch_address, ifsc_code, account_number, 
        account_holder_name, iban_number, swift_code, payment_instructions, 
        is_active, created_at, updated_at
       FROM admin_bank_details 
       ORDER BY is_active DESC, created_at DESC`
    );

    res.json(bankDetails);
  } catch (error) {
    console.error('Error fetching admin bank details:', error);
    res.status(500).json({ message: 'Server error fetching bank details' });
  }
});

// @desc    Get all companies with their bank details + PayPal (Admin)
// @route   GET /api/bank-details/admin/companies
// @access  Private/Admin
router.get('/admin/companies', protect, authorize('admin'), async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    let where = "WHERE u.role = 'company'";
    const params = [];
    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(search, search);
    }

    const [rows] = await db.execute(
      `SELECT
         u.id           AS company_id,
         u.name         AS company_name,
         u.email        AS company_email,
         u.phone        AS company_phone,
         u.paypal_email AS paypal_email,
         u.status       AS account_status,
         u.created_at   AS registered_at,
         cbd.id         AS bank_detail_id,
         cbd.bank_name,
         cbd.branch_name,
         cbd.account_holder_name,
         cbd.account_number,
         cbd.iban_number,
         cbd.swift_code,
         cbd.ifsc_code,
         cbd.payment_instructions,
         cbd.is_active,
         cbd.is_default,
         cbd.created_at AS bank_detail_created_at
       FROM users u
       LEFT JOIN company_bank_details cbd ON cbd.company_id = u.id
       ${where}
       ORDER BY u.name ASC, cbd.is_default DESC, cbd.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching companies bank details:', error);
    res.status(500).json({ message: 'Server error fetching companies bank details' });
  }
});

// @desc    Get own PayPal account (Company)
// @route   GET /api/bank-details/paypal
// @access  Private/Company
router.get('/paypal', protect, authorize('company'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT paypal_email FROM users WHERE id = ?', [req.user.id]);
    res.json({ paypal_email: rows[0]?.paypal_email || null });
  } catch (error) {
    console.error('Error fetching company paypal:', error);
    res.status(500).json({ message: 'Server error fetching PayPal account' });
  }
});

// @desc    Save own PayPal account (Company, optional)
// @route   PUT /api/bank-details/paypal
// @access  Private/Company
router.put('/paypal', protect, authorize('company'), async (req, res) => {
  try {
    const { paypal_email } = req.body;
    if (paypal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal_email)) {
      return res.status(400).json({ message: 'Please provide a valid PayPal email address' });
    }
    await db.execute('UPDATE users SET paypal_email = ? WHERE id = ?', [paypal_email || null, req.user.id]);
    res.json({ message: 'PayPal account saved successfully', paypal_email: paypal_email || null });
  } catch (error) {
    console.error('Error saving company paypal:', error);
    res.status(500).json({ message: 'Server error saving PayPal account' });
  }
});

// @desc    Get company bank details
// @route   GET /api/bank-details
// @access  Private/Company
router.get('/', protect, authorize('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const [bankDetails] = await db.execute(
      `SELECT 
        id, company_id, bank_name, branch_name, ifsc_code, account_number, 
        account_holder_name, iban_number, swift_code, 
        payment_instructions, is_active, is_default, created_at, updated_at
       FROM company_bank_details 
       WHERE company_id = ? 
       ORDER BY is_default DESC, created_at DESC`,
      [companyId]
    );

    res.json(bankDetails);
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({ message: 'Server error fetching bank details' });
  }
});

// @desc    Create company bank details
// @route   POST /api/bank-details
// @access  Private/Company
router.post('/', protect, authorize('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    const {
      bank_name,
      branch_name,
      ifsc_code = null, // Default to null if not provided
      iban_number,
      account_number,
      account_holder_name,
      swift_code,
      payment_instructions,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!bank_name || !branch_name || !account_number || !account_holder_name) {
      return res.status(400).json({ 
        message: 'Bank name, branch name, account number, and account holder name are required' 
      });
    }

    // Validate that IBAN is provided
    if (!iban_number) {
      return res.status(400).json({ 
        message: 'IBAN number is required' 
      });
    }

    // Validate that SWIFT code is provided
    if (!swift_code) {
      return res.status(400).json({ 
        message: 'SWIFT code is required' 
      });
    }

    const [result] = await db.execute(
      `INSERT INTO company_bank_details 
       (company_id, bank_name, branch_name, ifsc_code, iban_number, account_number, 
        account_holder_name, swift_code, payment_instructions, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, bank_name, branch_name, ifsc_code, iban_number, account_number, 
       account_holder_name, swift_code, payment_instructions, is_active]
    );

    res.status(201).json({ 
      message: 'Bank details created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating bank details:', error);
    res.status(500).json({ message: 'Server error creating bank details' });
  }
});

// @desc    Update company bank details
// @route   PUT /api/bank-details/:id
// @access  Private/Company
router.put('/:id', protect, authorize('company'), async (req, res) => {
  try {
    console.log('🔄 Updating company bank details...');
    console.log('Request body:', req.body);
    
    const companyId = req.user.id;
    const bankDetailsId = req.params.id;
    const {
      bank_name,
      branch_name,
      ifsc_code = null, // Default to null if not provided
      iban_number,
      account_number,
      account_holder_name,
      swift_code,
      payment_instructions,
      is_active
    } = req.body;

    console.log('Extracted fields:', {
      bank_name, branch_name, ifsc_code, iban_number, account_number,
      account_holder_name, swift_code, payment_instructions, is_active
    });

    // Verify ownership
    const [existing] = await db.execute(
      'SELECT id FROM company_bank_details WHERE id = ? AND company_id = ?',
      [bankDetailsId, companyId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Bank details not found' });
    }

    console.log('💾 Updating company bank details...');
    await db.execute(
      `UPDATE company_bank_details SET 
       bank_name = ?, branch_name = ?, ifsc_code = ?, iban_number = ?,
       account_number = ?, account_holder_name = ?, swift_code = ?, 
       payment_instructions = ?, is_active = ?
       WHERE id = ? AND company_id = ?`,
      [bank_name, branch_name, ifsc_code, iban_number, account_number, account_holder_name, 
       swift_code, payment_instructions, is_active, bankDetailsId, companyId]
    );

    console.log('✅ Company bank details updated successfully');
    res.json({ message: 'Bank details updated successfully' });
  } catch (error) {
    console.error('❌ Error updating bank details:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error updating bank details' });
  }
});

// @desc    Delete company bank details
// @route   DELETE /api/bank-details/:id
// @access  Private/Company
router.delete('/:id', protect, authorize('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    const bankDetailsId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM company_bank_details WHERE id = ? AND company_id = ?',
      [bankDetailsId, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bank details not found' });
    }

    res.json({ message: 'Bank details deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank details:', error);
    res.status(500).json({ message: 'Server error deleting bank details' });
  }
});

// @desc    Create admin bank details (Admin only)
// @route   POST /api/bank-details/admin
// @access  Private/Admin
router.post('/admin', (req, res, next) => {
  console.log('🚀 POST /admin route hit!');
  next();
}, protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📝 Creating admin bank details...');
    console.log('Request body:', req.body);
    
    const {
      bank_name,
      branch_name,
      ifsc_code = null, // Default to null if not provided
      iban_number,
      account_number,
      account_holder_name,
      swift_code,
      payment_instructions,
      is_active = true
    } = req.body;

    console.log('Extracted fields:', {
      bank_name, branch_name, ifsc_code, iban_number, account_number,
      account_holder_name, swift_code, payment_instructions, is_active
    });

    // Validate required fields
    if (!bank_name || !branch_name || !account_number || !account_holder_name) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Bank name, branch name, account number, and account holder name are required' 
      });
    }

    // Validate that IBAN is provided
    if (!iban_number) {
      console.log('❌ Missing IBAN number');
      return res.status(400).json({ 
        message: 'IBAN number is required' 
      });
    }

    // Validate that SWIFT code is provided
    if (!swift_code) {
      console.log('❌ Missing SWIFT code');
      return res.status(400).json({ 
        message: 'SWIFT code is required' 
      });
    }

    console.log('✅ All validations passed');

    // If setting as active, deactivate other admin bank details
    if (is_active) {
      console.log('🔄 Deactivating other admin bank details...');
      await db.execute('UPDATE admin_bank_details SET is_active = FALSE');
    }

    console.log('💾 Inserting new admin bank details...');
    const [result] = await db.execute(
      `INSERT INTO admin_bank_details 
       (bank_name, branch_name, ifsc_code, iban_number, account_number, 
        account_holder_name, swift_code, payment_instructions, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bank_name, branch_name, ifsc_code, iban_number, account_number, 
       account_holder_name, swift_code, payment_instructions, is_active]
    );

    console.log('✅ Admin bank details created successfully, ID:', result.insertId);

    res.status(201).json({ 
      message: 'Admin bank details created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Error creating admin bank details:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    res.status(500).json({ message: 'Server error creating admin bank details' });
  }
});

// @desc    Update admin bank details (Admin only)
// @route   PUT /api/bank-details/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🔄 Updating admin bank details...');
    console.log('Request body:', req.body);
    
    const bankDetailsId = req.params.id;
    const {
      bank_name,
      branch_name,
      ifsc_code = null, // Default to null if not provided
      iban_number,
      account_number,
      account_holder_name,
      swift_code,
      payment_instructions,
      is_active
    } = req.body;

    console.log('Extracted fields:', {
      bank_name, branch_name, ifsc_code, iban_number, account_number,
      account_holder_name, swift_code, payment_instructions, is_active
    });

    // Check if bank details exist
    const [existing] = await db.execute(
      'SELECT id FROM admin_bank_details WHERE id = ?',
      [bankDetailsId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Admin bank details not found' });
    }

    // If setting as active, deactivate other admin bank details
    if (is_active) {
      console.log('🔄 Deactivating other admin bank details...');
      await db.execute('UPDATE admin_bank_details SET is_active = FALSE WHERE id != ?', [bankDetailsId]);
    }

    console.log('💾 Updating admin bank details...');
    await db.execute(
      `UPDATE admin_bank_details SET 
       bank_name = ?, branch_name = ?, ifsc_code = ?, iban_number = ?,
       account_number = ?, account_holder_name = ?, swift_code = ?, 
       payment_instructions = ?, is_active = ?
       WHERE id = ?`,
      [bank_name, branch_name, ifsc_code, iban_number, account_number, account_holder_name, 
       swift_code, payment_instructions, is_active, bankDetailsId]
    );

    console.log('✅ Admin bank details updated successfully');
    res.json({ message: 'Admin bank details updated successfully' });
  } catch (error) {
    console.error('❌ Error updating admin bank details:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error updating admin bank details' });
  }
});

// @desc    Delete admin bank details (Admin only)
// @route   DELETE /api/bank-details/admin/:id
// @access  Private/Admin
router.delete('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bankDetailsId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM admin_bank_details WHERE id = ?',
      [bankDetailsId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin bank details not found' });
    }

    res.json({ message: 'Admin bank details deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin bank details:', error);
    res.status(500).json({ message: 'Server error deleting admin bank details' });
  }
});

// @desc    Get the quote requester's (business / regular user) bank account
// @route   GET /api/bank-details/quote-requester/:quoteId
// @access  Private/Company
router.get('/quote-requester/:quoteId', protect, authorize('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    const { quoteId } = req.params;

    // A company may only view this for a quote it has actually responded to.
    const [allowed] = await db.execute(
      'SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ? LIMIT 1',
      [quoteId, companyId]
    );
    if (allowed.length === 0) {
      return res.status(403).json({ message: 'You are not authorised to view this quote.' });
    }

    const [quotes] = await db.execute(
      `SELECT q.user_id, u.role AS user_role
       FROM quotes q LEFT JOIN users u ON q.user_id = u.id
       WHERE q.id = ?`,
      [quoteId]
    );
    if (quotes.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const { user_id: requesterId, user_role: requesterRole } = quotes[0];

    // Companies do not keep their account here; only business & regular users do.
    if (requesterRole !== 'business' && requesterRole !== 'user') {
      return res.json({ bankDetails: [] });
    }

    await ensureUserBankDetailsTable();
    const [banks] = await db.execute(
      `SELECT id, bank_name, branch_name, branch_address, account_holder_name, account_number,
              iban_number, swift_code, ifsc_code, payment_instructions, is_default
       FROM user_bank_details
       WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [requesterId]
    );

    res.json({ bankDetails: banks });
  } catch (error) {
    console.error('Error fetching requester bank details:', error);
    res.status(500).json({ message: 'Server error fetching requester bank details' });
  }
});

// ===========================================================================
// UNIFIED "MY BANK DETAILS" ENDPOINTS (company / business / user)
// Company -> company_bank_details | business & user -> user_bank_details
// ===========================================================================
const BANK_DETAIL_FIELDS = [
  'bank_name', 'branch_name', 'branch_address', 'account_holder_name',
  'account_number', 'iban_number', 'swift_code', 'ifsc_code', 'payment_instructions',
];

// @desc   Get own bank details (any logged-in non-admin role)
// @route  GET /api/bank-details/my
router.get('/my', protect, async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role === 'company') {
      const [rows] = await db.execute(
        `SELECT id, company_id AS user_id, bank_name, branch_name, branch_address,
                account_holder_name, account_number, iban_number, swift_code, ifsc_code,
                payment_instructions, is_default, is_active, created_at
         FROM company_bank_details
         WHERE company_id = ?
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );
      return res.json(rows);
    }

    if (role === 'business' || role === 'user') {
      await ensureUserBankDetailsTable();
      const [rows] = await db.execute(
        `SELECT id, user_id, bank_name, branch_name, branch_address, account_holder_name,
                account_number, iban_number, swift_code, ifsc_code, payment_instructions,
                is_default, is_active, created_at
         FROM user_bank_details
         WHERE user_id = ?
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );
      return res.json(rows);
    }

    return res.status(403).json({ message: 'Bank details are not available for this account type' });
  } catch (error) {
    console.error('Error fetching own bank details:', error);
    res.status(500).json({ message: 'Server error fetching bank details' });
  }
});

// @desc   Add own bank details
// @route  POST /api/bank-details/my
router.post('/my', protect, async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role === 'company') {
      const {
        bank_name, branch_name, branch_address, ifsc_code = null, iban_number = null,
        account_number, account_holder_name, swift_code = null,
        payment_instructions = null, is_default = true,
      } = req.body;

      if (!bank_name || !account_number || !account_holder_name) {
        return res.status(400).json({ message: 'Bank name, account number and account holder name are required' });
      }

      if (is_default) {
        await db.execute('UPDATE company_bank_details SET is_default = FALSE WHERE company_id = ?', [userId]);
      }

      const [result] = await db.execute(
        `INSERT INTO company_bank_details
         (company_id, bank_name, branch_name, branch_address, ifsc_code, iban_number,
          account_number, account_holder_name, swift_code, payment_instructions, is_default, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [userId, bank_name, branch_name || null, branch_address || null, ifsc_code, iban_number,
         account_number, account_holder_name, swift_code, payment_instructions, is_default ? 1 : 0]
      );

      return res.status(201).json({ message: 'Bank details saved successfully', id: result.insertId });
    }

    if (role === 'business' || role === 'user') {
      await ensureUserBankDetailsTable();

      const values = BANK_DETAIL_FIELDS.map((field) => req.body[field] || null);
      const [bank_name, , , account_holder_name, account_number] = values;

      if (!bank_name || !account_number) {
        return res.status(400).json({ message: 'Bank name and account number are required' });
      }

      const isDefault = req.body.is_default === undefined ? true : !!req.body.is_default;
      if (isDefault) {
        await db.execute('UPDATE user_bank_details SET is_default = FALSE WHERE user_id = ?', [userId]);
      }

      const [result] = await db.execute(
        `INSERT INTO user_bank_details
         (user_id, ${BANK_DETAIL_FIELDS.join(', ')}, is_default, is_active)
         VALUES (?, ${BANK_DETAIL_FIELDS.map(() => '?').join(', ')}, ?, TRUE)`,
        [userId, ...values, isDefault ? 1 : 0]
      );

      return res.status(201).json({ message: 'Bank details saved successfully', id: result.insertId });
    }

    return res.status(403).json({ message: 'Bank details are not available for this account type' });
  } catch (error) {
    console.error('Error creating own bank details:', error);
    res.status(500).json({ message: 'Server error saving bank details' });
  }
});

// @desc   Update own bank details
// @route  PUT /api/bank-details/my/:id
router.put('/my/:id', protect, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const bankId = req.params.id;

    if (role === 'company') {
      const [existing] = await db.execute(
        'SELECT id FROM company_bank_details WHERE id = ? AND company_id = ?',
        [bankId, userId]
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Bank details not found' });
      }

      const isDefault = req.body.is_default === undefined ? false : !!req.body.is_default;
      if (isDefault) {
        await db.execute('UPDATE company_bank_details SET is_default = FALSE WHERE company_id = ? AND id != ?', [userId, bankId]);
      }

      await db.execute(
        `UPDATE company_bank_details SET
           bank_name = ?, branch_name = ?, branch_address = ?, ifsc_code = ?, iban_number = ?,
           account_number = ?, account_holder_name = ?, swift_code = ?, payment_instructions = ?,
           is_default = ?, is_active = TRUE
         WHERE id = ? AND company_id = ?`,
        [req.body.bank_name || null, req.body.branch_name || null, req.body.branch_address || null,
         req.body.ifsc_code || null, req.body.iban_number || null, req.body.account_number || null,
         req.body.account_holder_name || null, req.body.swift_code || null,
         req.body.payment_instructions || null, isDefault ? 1 : 0, bankId, userId]
      );

      return res.json({ message: 'Bank details updated successfully' });
    }

    if (role === 'business' || role === 'user') {
      await ensureUserBankDetailsTable();

      const [existing] = await db.execute(
        'SELECT id FROM user_bank_details WHERE id = ? AND user_id = ?',
        [bankId, userId]
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Bank details not found' });
      }

      const isDefault = req.body.is_default === undefined ? false : !!req.body.is_default;
      if (isDefault) {
        await db.execute('UPDATE user_bank_details SET is_default = FALSE WHERE user_id = ? AND id != ?', [userId, bankId]);
      }

      await db.execute(
        `UPDATE user_bank_details SET
           ${BANK_DETAIL_FIELDS.map((field) => `${field} = ?`).join(', ')},
           is_default = ?, is_active = TRUE
         WHERE id = ? AND user_id = ?`,
        [...BANK_DETAIL_FIELDS.map((field) => req.body[field] || null), isDefault ? 1 : 0, bankId, userId]
      );

      return res.json({ message: 'Bank details updated successfully' });
    }

    return res.status(403).json({ message: 'Bank details are not available for this account type' });
  } catch (error) {
    console.error('Error updating own bank details:', error);
    res.status(500).json({ message: 'Server error updating bank details' });
  }
});

// @desc   Delete own bank details
// @route  DELETE /api/bank-details/my/:id
router.delete('/my/:id', protect, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const bankId = req.params.id;

    if (role === 'company') {
      const [result] = await db.execute(
        'DELETE FROM company_bank_details WHERE id = ? AND company_id = ?',
        [bankId, userId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Bank details not found' });
      }
      return res.json({ message: 'Bank details deleted successfully' });
    }

    if (role === 'business' || role === 'user') {
      await ensureUserBankDetailsTable();
      const [result] = await db.execute(
        'DELETE FROM user_bank_details WHERE id = ? AND user_id = ?',
        [bankId, userId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Bank details not found' });
      }
      return res.json({ message: 'Bank details deleted successfully' });
    }

    return res.status(403).json({ message: 'Bank details are not available for this account type' });
  } catch (error) {
    console.error('Error deleting own bank details:', error);
    res.status(500).json({ message: 'Server error deleting bank details' });
  }
});

export default router;