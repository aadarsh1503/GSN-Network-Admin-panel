// routes/bankDetailsRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import db from '../config/db.js';

console.log('🏦 Bank Details Routes loaded at:', new Date().toISOString());

const router = express.Router();

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

    res.json(bankDetails[0]);
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

export default router;