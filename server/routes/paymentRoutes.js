// routes/paymentRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect as authenticateToken, authorize as authorizeRoles } from '../middleware/authMiddleware.js';
import db from '../config/db.js';
import { queueSubscriptionEmails } from '../services/emailQueue.js';
import { getAdminEmailsWithFallback } from '../utils/adminUtils.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payment-proofs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `payment-proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and documents (PDF, DOC, DOCX) are allowed'));
    }
  }
});

// @desc    Get company bank details
// @route   GET /api/payments/company-bank-details
// @access  Private/Company
router.get('/company-bank-details', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const [bankDetails] = await db.execute(
      `SELECT * FROM company_bank_details 
       WHERE company_id = ? AND is_active = TRUE 
       ORDER BY is_default DESC, created_at DESC`,
      [companyId]
    );

    res.json(bankDetails);
  } catch (error) {
    console.error('Error fetching company bank details:', error);
    res.status(500).json({ message: 'Server error fetching bank details' });
  }
});

// @desc    Create company bank details
// @route   POST /api/payments/company-bank-details
// @access  Private/Company
router.post('/company-bank-details', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    const {
      bank_name,
      branch_name,
      branch_address,
      ifsc_code,
      account_number,
      account_holder_name,
      swift_code,
      routing_number,
      instructions,
      is_default
    } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.execute(
        'UPDATE company_bank_details SET is_default = FALSE WHERE company_id = ?',
        [companyId]
      );
    }

    const [result] = await db.execute(
      `INSERT INTO company_bank_details 
       (company_id, bank_name, branch_name, branch_address, ifsc_code, account_number, 
        account_holder_name, swift_code, routing_number, instructions, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, bank_name, branch_name, branch_address, ifsc_code, account_number,
       account_holder_name, swift_code, routing_number, instructions, is_default || false]
    );

    res.status(201).json({ 
      message: 'Bank details created successfully',
      bankDetailsId: result.insertId
    });
  } catch (error) {
    console.error('Error creating bank details:', error);
    res.status(500).json({ message: 'Server error creating bank details' });
  }
});

// @desc    Update company bank details
// @route   PUT /api/payments/company-bank-details/:id
// @access  Private/Company
router.put('/company-bank-details/:id', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const companyId = req.user.id;
    const bankDetailsId = req.params.id;
    const {
      bank_name,
      branch_name,
      branch_address,
      ifsc_code,
      account_number,
      account_holder_name,
      swift_code,
      routing_number,
      instructions,
      is_default
    } = req.body;

    // Verify ownership
    const [existing] = await db.execute(
      'SELECT id FROM company_bank_details WHERE id = ? AND company_id = ?',
      [bankDetailsId, companyId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Bank details not found' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.execute(
        'UPDATE company_bank_details SET is_default = FALSE WHERE company_id = ? AND id != ?',
        [companyId, bankDetailsId]
      );
    }

    await db.execute(
      `UPDATE company_bank_details SET 
       bank_name = ?, branch_name = ?, branch_address = ?, ifsc_code = ?, 
       account_number = ?, account_holder_name = ?, swift_code = ?, 
       routing_number = ?, instructions = ?, is_default = ?
       WHERE id = ? AND company_id = ?`,
      [bank_name, branch_name, branch_address, ifsc_code, account_number,
       account_holder_name, swift_code, routing_number, instructions, is_default || false,
       bankDetailsId, companyId]
    );

    res.json({ message: 'Bank details updated successfully' });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ message: 'Server error updating bank details' });
  }
});

// @desc    Delete company bank details
// @route   DELETE /api/payments/company-bank-details/:id
// @access  Private/Company
router.delete('/company-bank-details/:id', authenticateToken, authorizeRoles('company'), async (req, res) => {
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

// @desc    Attach bank details to quote response
// @route   POST /api/payments/attach-bank-details
// @access  Private/Company
router.post('/attach-bank-details', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const { quote_response_id, company_bank_details_id } = req.body;
    const companyId = req.user.id;

    // Verify quote response belongs to company
    const [quoteResponse] = await db.execute(
      'SELECT id FROM quote_responses WHERE id = ? AND company_id = ?',
      [quote_response_id, companyId]
    );

    if (quoteResponse.length === 0) {
      return res.status(404).json({ message: 'Quote response not found' });
    }

    // Verify bank details belong to company
    const [bankDetails] = await db.execute(
      'SELECT id FROM company_bank_details WHERE id = ? AND company_id = ?',
      [company_bank_details_id, companyId]
    );

    if (bankDetails.length === 0) {
      return res.status(404).json({ message: 'Bank details not found' });
    }

    // Insert or update the association
    await db.execute(
      `INSERT INTO quote_response_bank_details (quote_response_id, company_bank_details_id)
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE company_bank_details_id = VALUES(company_bank_details_id)`,
      [quote_response_id, company_bank_details_id]
    );

    res.json({ message: 'Bank details attached to quote response successfully' });
  } catch (error) {
    console.error('Error attaching bank details:', error);
    res.status(500).json({ message: 'Server error attaching bank details' });
  }
});

// @desc    Upload payment proof
// @route   POST /api/payments/upload-proof
// @access  Private/User,Business
router.post('/upload-proof', authenticateToken, authorizeRoles('user', 'business'), upload.single('payment_proof'), async (req, res) => {
  try {
    const { quote_id, payment_date, payment_notes } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment proof file is required' });
    }

    // Verify quote belongs to user and has a response with payment_pending status
    const [quote] = await db.execute(
      `SELECT q.*, qr.id as quote_response_id, qr.company_id, qr.price as amount
       FROM quotes q
       JOIN quote_responses qr ON q.id = qr.quote_id
       WHERE q.id = ? AND q.user_id = ? AND q.status = 'payment_pending'`,
      [quote_id, userId]
    );

    if (quote.length === 0) {
      return res.status(404).json({ message: 'Quote not found or not ready for payment' });
    }

    const quoteData = quote[0];

    // Insert payment proof
    const [result] = await db.execute(
      `INSERT INTO payment_proofs 
       (quote_id, quote_response_id, user_id, company_id, file_name, file_path, file_size, file_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quote_id, quoteData.quote_response_id, userId, quoteData.company_id, req.file.originalname, 
       req.file.path, req.file.size, req.file.mimetype, payment_notes]
    );

    // Create payment verification record
    await db.execute(
      `INSERT INTO payment_verifications 
       (quote_id, quote_response_id, user_id, company_id, payment_proof_id)
       VALUES (?, ?, ?, ?, ?)`,
      [quote_id, quoteData.quote_response_id, userId, quoteData.company_id, result.insertId]
    );

    // Update quote status to payment_uploaded
    await db.execute(
      'UPDATE quotes SET status = ? WHERE id = ?',
      ['payment_uploaded', quote_id]
    );

    res.status(201).json({ 
      message: 'Payment proof uploaded successfully. The company will verify your payment before work begins.',
      paymentProofId: result.insertId
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ message: 'Server error uploading payment proof' });
  }
});

// @desc    Accept quote with payment proof
// @route   POST /api/payments/accept-quote-with-payment
// @access  Private/User,Business
router.post('/accept-quote-with-payment', authenticateToken, authorizeRoles('user', 'business'), async (req, res) => {
  try {
    const { quote_id, quote_response_id, company_id, payment_proof_id } = req.body;
    const userId = req.user.id;

    // Verify payment proof exists and belongs to user
    const [paymentProof] = await db.execute(
      `SELECT id FROM payment_proofs 
       WHERE id = ? AND user_id = ? AND quote_id = ? AND quote_response_id = ? AND company_id = ?`,
      [payment_proof_id, userId, quote_id, quote_response_id, company_id]
    );

    if (paymentProof.length === 0) {
      return res.status(404).json({ message: 'Payment proof not found or invalid' });
    }

    // Check if user has already accepted any response for this quote
    const [acceptedResponses] = await db.execute(
      'SELECT * FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND status = "accepted"',
      [quote_id, userId]
    );

    if (acceptedResponses.length > 0) {
      return res.status(400).json({ 
        message: 'You have already accepted a quote for this request. Cannot accept multiple quotes.' 
      });
    }

    // Insert acceptance record with payment proof
    await db.execute(
      `INSERT INTO user_quote_status 
       (quote_id, user_id, company_id, quote_response_id, status, accepted_at, payment_proof_id, payment_verification_status) 
       VALUES (?, ?, ?, ?, 'accepted', NOW(), ?, 'pending')`,
      [quote_id, userId, company_id, quote_response_id, payment_proof_id]
    );

    // Update quote status to 'approved' (pending payment verification)
    await db.execute(
      'UPDATE quotes SET status = ? WHERE id = ?',
      ['approved', quote_id]
    );

    // Update quote response status to 'accepted'
    await db.execute(
      'UPDATE quote_responses SET status = ? WHERE id = ?',
      ['accepted', quote_response_id]
    );

    res.json({ message: 'Quote accepted with payment proof. Awaiting payment verification.' });
  } catch (error) {
    console.error('Error accepting quote with payment:', error);
    res.status(500).json({ message: 'Server error accepting quote with payment' });
  }
});

// @desc    Get pending payment verifications for company
// @route   GET /api/payments/pending
// @access  Private/Company
router.get('/pending', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const companyId = req.user.id;

    const [payments] = await db.execute(
      `SELECT pv.id, pv.quote_id, pv.verification_status as payment_status, pv.created_at as payment_date,
              pp.file_path as payment_attachment, pp.notes as payment_notes,
              qr.price as quote_amount,
              u.name as user_name, u.email as user_email,
              cbd.bank_name, cbd.account_holder_name as account_name, cbd.account_number
       FROM payment_verifications pv
       JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
       JOIN quote_responses qr ON pv.quote_response_id = qr.id
       JOIN users u ON pv.user_id = u.id
       LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
       LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
       WHERE pv.company_id = ? AND pv.verification_status = 'pending'
       ORDER BY pv.created_at DESC`,
      [companyId]
    );

    res.json(payments);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ message: 'Server error fetching pending payments' });
  }
});

// @desc    Verify payment
// @route   PUT /api/payments/verify/:id
// @access  Private/Company
router.put('/verify/:id', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const { status, verification_notes } = req.body;
    const paymentId = req.params.id;
    const companyId = req.user.id;

    // Verify the payment verification belongs to the company
    const [verification] = await db.execute(
      'SELECT * FROM payment_verifications WHERE id = ? AND company_id = ?',
      [paymentId, companyId]
    );

    if (verification.length === 0) {
      return res.status(404).json({ message: 'Payment verification not found' });
    }

    // Update payment verification
    await db.execute(
      `UPDATE payment_verifications SET 
       verification_status = ?, verified_by = ?, verification_date = NOW(), 
       company_notes = ?
       WHERE id = ?`,
      [status, req.user.id, verification_notes, paymentId]
    );

    // Update user quote status
    await db.execute(
      `UPDATE user_quote_status SET payment_verification_status = ?
       WHERE quote_response_id = ? AND user_id = ?`,
      [status, verification[0].quote_response_id, verification[0].user_id]
    );

    // If verified, update quote status to 'approved'
    if (status === 'verified') {
      // Update quote status to approved
      await db.execute(
        'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?',
        ['approved', verification[0].quote_id]
      );

      // Also update the quote_responses table to reflect the approval
      await db.execute(
        'UPDATE quote_responses SET status = ? WHERE quote_id = ? AND company_id = ?',
        ['approved', verification[0].quote_id, companyId]
      );

      console.log(`✅ Quote #${verification[0].quote_id} automatically approved due to payment verification`);
    }

    res.json({ 
      message: `Payment ${status} successfully`
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
});

// @desc    Get payment verification history for company
// @route   GET /api/payments/verification-history
// @access  Private/Company
router.get('/verification-history', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const companyId = req.user.id;

    const [verifications] = await db.execute(
      `SELECT pv.*, pp.file_name, pp.file_path, pp.notes as payment_notes,
              q.id as quote_id, q.product_description, q.departure_country, q.arrival_country,
              qr.price, qr.transit_time,
              u.name as user_name, u.email as user_email,
              verifier.name as verified_by_name
       FROM payment_verifications pv
       JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
       JOIN quotes q ON pv.quote_id = q.id
       JOIN quote_responses qr ON pv.quote_response_id = qr.id
       JOIN users u ON pv.user_id = u.id
       LEFT JOIN users verifier ON pv.verified_by = verifier.id
       WHERE pv.company_id = ?
       ORDER BY pv.created_at DESC`,
      [companyId]
    );

    res.json(verifications);
  } catch (error) {
    console.error('Error fetching verification history:', error);
    res.status(500).json({ message: 'Server error fetching verification history' });
  }
});

// @desc    Get user payment status for a quote
// @route   GET /api/payments/user-payment-status/:quoteId
// @access  Private/User,Business
router.get('/user-payment-status/:quoteId', authenticateToken, authorizeRoles('user', 'business'), async (req, res) => {
  try {
    const { quoteId } = req.params;
    const userId = req.user.id;

    const [paymentStatus] = await db.execute(
      `SELECT uqs.*, pp.file_name, pp.file_path, pp.upload_date, pp.notes as payment_notes,
              pv.verification_status, pv.verification_date, pv.company_notes, pv.rejection_reason,
              qr.price, qr.transit_time,
              u.name as company_name
       FROM user_quote_status uqs
       LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
       LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
       JOIN quote_responses qr ON uqs.quote_response_id = qr.id
       JOIN users u ON uqs.company_id = u.id
       WHERE uqs.quote_id = ? AND uqs.user_id = ?`,
      [quoteId, userId]
    );

    res.json(paymentStatus);
  } catch (error) {
    console.error('Error fetching user payment status:', error);
    res.status(500).json({ message: 'Server error fetching payment status' });
  }
});

// @desc    Verify payment for enhanced quote system
// @route   PUT /api/payments/verify-enhanced/:verificationId
// @access  Private/Company
router.put('/verify-enhanced/:verificationId', authenticateToken, authorizeRoles('company'), async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { verification_status, company_notes } = req.body;
    const companyId = req.user.id;

    if (!['verified', 'rejected'].includes(verification_status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    // Verify the payment verification belongs to this company
    const [verificationCheck] = await db.execute(
      'SELECT * FROM payment_verifications WHERE id = ? AND company_id = ?',
      [verificationId, companyId]
    );

    if (verificationCheck.length === 0) {
      return res.status(404).json({ message: 'Payment verification not found or access denied' });
    }

    const verification = verificationCheck[0];

    // Update payment verification status
    await db.execute(
      `UPDATE payment_verifications 
       SET verification_status = ?, company_notes = ?, verification_date = NOW() 
       WHERE id = ?`,
      [verification_status, company_notes, verificationId]
    );

    // Update user quote status
    await db.execute(
      'UPDATE user_quote_status SET payment_verification_status = ? WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?',
      [verification_status, verification.quote_id, verification.user_id, verification.quote_response_id]
    );

    // If verified, update quote status to approved/running
    if (verification_status === 'verified') {
      // Update quote status to approved
      await db.execute(
        'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?',
        ['approved', verification.quote_id]
      );

      // Also update the quote_responses table to reflect the approval
      await db.execute(
        'UPDATE quote_responses SET status = ? WHERE quote_id = ? AND company_id = ?',
        ['approved', verification.quote_id, companyId]
      );

      console.log(`✅ Quote #${verification.quote_id} automatically approved due to payment verification`);

      // Create admin notification for auto-approval
      try {
        const [companyDetails] = await db.execute(
          'SELECT name FROM users WHERE id = ?',
          [companyId]
        );
        
        const companyName = companyDetails.length > 0 ? companyDetails[0].name : 'Company';
        
        const title = `Quote Auto-Approved - Payment Verified`;
        const message = `Quote #${verification.quote_id} has been automatically approved because ${companyName} verified the customer's payment.

📋 Details:
🏢 Company: ${companyName}
📄 Quote ID: #${verification.quote_id}
💳 Payment Status: Verified ✅
📊 Quote Status: Automatically Updated to "Approved"
📝 Company Notes: ${company_notes || 'Payment verified successfully'}

⏰ Auto-Approved: ${new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}

🎉 The quote is now approved and work can begin!`;
        
        await db.execute(`
          INSERT INTO admin_notifications (type, title, message, user_id, created_at, is_read)
          VALUES (?, ?, ?, ?, NOW(), 0)
        `, [
          'quote',
          title,
          message,
          verification.user_id
        ]);
        
        console.log(`✅ Admin notification created for auto-approval: Quote #${verification.quote_id}`);
      } catch (notificationError) {
        console.error('❌ Error creating admin notification for auto-approval:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    } else if (verification_status === 'rejected') {
      // If payment is rejected, update quote status to rejected
      await db.execute(
        'UPDATE quotes SET status = ? WHERE id = ?',
        ['rejected', verification.quote_id]
      );

      // Create admin notification for quote status change due to payment rejection
      try {
        const [companyDetails] = await db.execute(
          'SELECT name FROM users WHERE id = ?',
          [companyId]
        );
        
        const companyName = companyDetails.length > 0 ? companyDetails[0].name : 'Company';
        
        const title = `Quote Status Updated - Payment Rejected`;
        const message = `Quote #${verification.quote_id} status has been automatically updated to "Rejected" because ${companyName} rejected the customer's payment proof.

📋 Details:
🏢 Company: ${companyName}
📄 Quote ID: #${verification.quote_id}
💳 Payment Status: Rejected
📝 Rejection Reason: ${company_notes || 'No reason provided'}

⏰ Updated: ${new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`;
        
        await db.execute(`
          INSERT INTO admin_notifications (type, title, message, user_id, created_at, is_read)
          VALUES (?, ?, ?, ?, NOW(), 0)
        `, [
          'quote',
          title,
          message,
          verification.user_id
        ]);
        
        console.log(`✅ Admin notification created for quote status update due to payment rejection: ${verification.quote_id}`);
      } catch (notificationError) {
        console.error('❌ Error creating admin notification for payment rejection:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }

    // Get detailed information for email notifications
    const [emailData] = await db.execute(`
      SELECT 
        q.id as quote_id,
        q.product_description,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        c.name as company_name,
        c.email as company_email,
        c.phone as company_phone,
        qr.price as amount,
        pp.file_path as payment_proof_url,
        pv.verification_date,
        pv.company_notes
      FROM payment_verifications pv
      JOIN quotes q ON pv.quote_id = q.id
      JOIN users u ON pv.user_id = u.id
      JOIN users c ON pv.company_id = c.id
      JOIN quote_responses qr ON pv.quote_response_id = qr.id
      LEFT JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
      WHERE pv.id = ?
    `, [verificationId]);

    // Initialize email promises array outside the if block to avoid scope issues
    const emailPromises = [];

    // Queue email notifications asynchronously (non-blocking)
    if (emailData.length > 0) {
      const data = emailData[0];
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailPayload = {
        quoteId: data.quote_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        companyName: data.company_name,
        companyEmail: data.company_email,
        companyPhone: data.company_phone,
        amount: `$${data.amount}`,
        verificationDate: currentDate,
        status: verification_status,
        rejectionReason: company_notes,
        companyNotes: company_notes,
        paymentProofUrl: data.payment_proof_url
      };

      // Queue emails asynchronously - this is non-blocking and returns immediately

      // Queue customer notification
      if (verification_status === 'verified') {
        emailPromises.push(queueSubscriptionEmails.paymentVerifiedToUser({
          ...emailPayload,
          recipientEmail: data.customer_email
        }));
      } else {
        emailPromises.push(queueSubscriptionEmails.paymentRejectedToUser({
          ...emailPayload,
          recipientEmail: data.customer_email
        }));
      }

      // Queue company confirmation
      if (verification_status === 'verified') {
        emailPromises.push(queueSubscriptionEmails.paymentVerifiedToCompany({
          ...emailPayload,
          recipientEmail: data.company_email
        }));
      } else {
        emailPromises.push(queueSubscriptionEmails.paymentRejectedToCompany({
          ...emailPayload,
          recipientEmail: data.company_email
        }));
      }

      // Queue admin notifications - get all admin emails from database
      try {
        const adminEmails = await getAdminEmailsWithFallback();
        
        // Send to all admin users
        for (const adminEmail of adminEmails) {
          emailPromises.push(queueSubscriptionEmails.paymentVerificationToAdmin({
            ...emailPayload,
            recipientEmail: adminEmail
          }));
        }
        
        console.log(`📧 Queuing admin notifications to ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);
      } catch (adminEmailError) {
        console.error('❌ Error getting admin emails:', adminEmailError);
        // Final fallback
        const fallbackEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@gsnnetwork.com';
        emailPromises.push(queueSubscriptionEmails.paymentVerificationToAdmin({
          ...emailPayload,
          recipientEmail: fallbackEmail
        }));
        console.log(`📧 Using final fallback admin email: ${fallbackEmail}`);
      }

      // Execute all email queuing operations (still very fast, just queuing)
      try {
        await Promise.all(emailPromises);
        console.log(`✅ All payment ${verification_status} emails queued successfully for quote #${data.quote_id}`);
      } catch (queueError) {
        console.error('❌ Error queuing payment verification emails:', queueError);
        // Don't fail the API response if email queuing fails
      }
    }

    // Count total emails queued (customer + company + admin(s))
    const totalEmailsQueued = emailData.length > 0 ? emailPromises.length : 0;

    // Return immediate response - emails are being processed in background
    res.json({ 
      message: `Payment ${verification_status} successfully. Email notifications are being sent to all parties.`,
      verification_status,
      verification_date: new Date().toISOString(),
      emails_queued: totalEmailsQueued,
      email_recipients: emailData.length > 0 ? {
        customer: 1,
        company: 1,
        admins: totalEmailsQueued - 2 // Total minus customer and company
      } : {}
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
});

export default router;