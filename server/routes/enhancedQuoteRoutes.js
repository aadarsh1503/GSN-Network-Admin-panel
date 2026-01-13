// routes/enhancedQuoteRoutes.js
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import { protect as authenticateToken, authorize as authorizeRoles } from '../middleware/authMiddleware.js';
import db from '../config/db.js';
import { sendQuoteEmail } from '../services/quoteEmailService.js';
import {
    submitQuoteResponseWithBankDetails,
    getQuoteResponsesWithBankDetails,
    getCompanyResponsesWithPayments,
    getAllCompanyResponsesWithPayments,
    getQuoteResponsesWithBankDetailsAdmin,
    getComprehensiveAdminQuotes,
    getComprehensiveAdminQuotesByStatus,
    updateQuoteResponseBankDetails
} from '../controllers/enhancedQuoteController.js';

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

// @desc    Submit quote response with bank details
// @route   POST /api/enhanced-quotes/respond
// @access  Private/Company
router.post('/respond', authenticateToken, authorizeRoles('company'), async (req, res) => {
    const companyId = req.user.id;
    const {
        quote_id,
        amount,
        description,
        estimated_completion,
        terms_conditions,
        bank_details_id
    } = req.body;

    if (!quote_id || !amount || !description || !bank_details_id) {
        return res.status(400).json({ 
            message: 'Quote ID, amount, description, and bank details are required' 
        });
    }

    try {
        // Verify the quote exists and is still accepting responses
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND status IN ("pending", "approved")',
            [quote_id]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or no longer accepting responses' });
        }

        // Verify bank details belong to the company
        const [bankDetails] = await db.execute(
            'SELECT * FROM company_bank_details WHERE id = ? AND company_id = ? AND is_active = TRUE',
            [bank_details_id, companyId]
        );

        if (bankDetails.length === 0) {
            return res.status(404).json({ message: 'Bank details not found or inactive' });
        }

        // Check if company has already responded to this quote
        const [existingResponse] = await db.execute(
            'SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?',
            [quote_id, companyId]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this quote' });
        }

        // Insert quote response
        const [responseResult] = await db.execute(
            `INSERT INTO quote_responses 
             (quote_id, company_id, price, transit_time, inclusions, value_added_services, valid_until, terms, notes, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [quote_id, companyId, amount, estimated_completion || '', description, 
             '', estimated_completion, terms_conditions || '', 'Enhanced quote response with bank details']
        );

        const quoteResponseId = responseResult.insertId;

        // Link bank details to quote response
        await db.execute(
            'INSERT INTO quote_response_bank_details (quote_response_id, company_bank_details_id) VALUES (?, ?)',
            [quoteResponseId, bank_details_id]
        );

        // NOTE: Do NOT update quote status here - it should remain 'pending' until user accepts a response
        // The quote status should only change to 'payment_pending' when user accepts this response

        res.status(201).json({ 
            message: 'Quote response submitted successfully with bank details',
            quoteResponseId: quoteResponseId
        });

    } catch (error) {
        console.error('Error submitting quote response with bank details:', error);
        res.status(500).json({ message: 'Server error submitting quote response' });
    }
});

// @desc    Get quote responses with bank details for users
// @route   GET /api/enhanced-quotes/:quoteId/responses-with-bank-details
// @access  Private/User,Business
router.get('/:quoteId/responses-with-bank-details', authenticateToken, authorizeRoles('user', 'business'), getQuoteResponsesWithBankDetails);

// @desc    Get quote responses with bank details for admin (any quote)
// @route   GET /api/enhanced-quotes/admin/:quoteId/responses-with-bank-details
// @access  Private/Admin
router.get('/admin/:quoteId/responses-with-bank-details', authenticateToken, authorizeRoles('admin'), getQuoteResponsesWithBankDetailsAdmin);

// @desc    Get comprehensive admin quotes with company details and payment status
// @route   GET /api/enhanced-quotes/admin/comprehensive-quotes
// @access  Private/Admin
router.get('/admin/comprehensive-quotes', authenticateToken, authorizeRoles('admin'), getComprehensiveAdminQuotes);

// @desc    Get comprehensive admin quotes by status
// @route   GET /api/enhanced-quotes/admin/comprehensive-quotes/:status
// @access  Private/Admin
router.get('/admin/comprehensive-quotes/:status', authenticateToken, authorizeRoles('admin'), getComprehensiveAdminQuotesByStatus);

// @desc    Get company's quote responses with payment status
// @route   GET /api/enhanced-quotes/company-responses-with-payments
// @access  Private/Company
router.get('/company-responses-with-payments', authenticateToken, authorizeRoles('company'), getCompanyResponsesWithPayments);

// @desc    Get all companies' quote responses with payment status (Admin only)
// @route   GET /api/enhanced-quotes/all-company-responses-with-payments
// @access  Private/Admin
router.get('/all-company-responses-with-payments', authenticateToken, authorizeRoles('admin'), getAllCompanyResponsesWithPayments);

// @desc    Update quote response with new bank details
// @route   PUT /api/enhanced-quotes/update-response-bank-details
// @access  Private/Company
router.put('/update-response-bank-details', authenticateToken, authorizeRoles('company'), updateQuoteResponseBankDetails);

// @desc    Upload payment proof for accepted quote response
// @route   POST /api/enhanced-quotes/upload-payment-proof
// @access  Private/User,Business
router.post('/upload-payment-proof', authenticateToken, authorizeRoles('user', 'business'), upload.single('payment_proof'), async (req, res) => {
    try {
        const { quote_id, quote_response_id, payment_date, payment_notes } = req.body;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Payment proof file is required' });
        }

        if (!quote_id || !quote_response_id) {
            return res.status(400).json({ message: 'Quote ID and Quote Response ID are required' });
        }

        // Verify quote belongs to user and response exists
        const [quoteCheck] = await db.execute(
            'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
            [quote_id, userId]
        );

        if (quoteCheck.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Verify quote response exists and get company info
        const [responseCheck] = await db.execute(
            'SELECT company_id, price FROM quote_responses WHERE id = ? AND quote_id = ?',
            [quote_response_id, quote_id]
        );

        if (responseCheck.length === 0) {
            return res.status(404).json({ message: 'Quote response not found' });
        }

        const { company_id, price } = responseCheck[0];

        // Check if user has already uploaded payment proof to a DIFFERENT company for this quote
        const [anyExistingPayment] = await db.execute(
            'SELECT pp.id, c.name as company_name FROM payment_proofs pp JOIN users c ON pp.company_id = c.id WHERE pp.quote_id = ? AND pp.user_id = ? AND pp.company_id != ?',
            [quote_id, userId, company_id]
        );

        if (anyExistingPayment.length > 0) {
            return res.status(400).json({ 
                message: `You have already uploaded payment proof to ${anyExistingPayment[0].company_name} for this quote. You can only upload payment proof to one company per quote.` 
            });
        }

        // Check if payment proof already exists for this specific response (allow updates)
        const [existingPayment] = await db.execute(
            'SELECT id FROM payment_proofs WHERE quote_id = ? AND quote_response_id = ? AND user_id = ?',
            [quote_id, quote_response_id, userId]
        );

        const shouldUpdate = existingPayment.length > 0;

        // Upload file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'payment_proofs',
            resource_type: 'auto'
        });

        let paymentProofId;

        if (shouldUpdate) {
            // Update existing payment proof
            await db.execute(
                `UPDATE payment_proofs 
                 SET file_name = ?, file_path = ?, file_size = ?, file_type = ?, notes = ?, upload_date = ?
                 WHERE quote_id = ? AND quote_response_id = ? AND user_id = ?`,
                [req.file.originalname, uploadResult.secure_url, req.file.size, req.file.mimetype, 
                 payment_notes, payment_date, quote_id, quote_response_id, userId]
            );
            paymentProofId = existingPayment[0].id;
        } else {
            // Insert new payment proof
            const [result] = await db.execute(
                `INSERT INTO payment_proofs 
                 (quote_id, quote_response_id, user_id, company_id, file_name, file_path, file_size, file_type, notes, upload_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [quote_id, quote_response_id, userId, company_id, req.file.originalname, 
                 uploadResult.secure_url, req.file.size, req.file.mimetype, payment_notes, payment_date]
            );
            paymentProofId = result.insertId;
        }

        // Create or update payment verification record
        const [existingVerification] = await db.execute(
            'SELECT id FROM payment_verifications WHERE quote_id = ? AND quote_response_id = ? AND user_id = ?',
            [quote_id, quote_response_id, userId]
        );

        if (existingVerification.length > 0) {
            await db.execute(
                'UPDATE payment_verifications SET payment_proof_id = ? WHERE quote_id = ? AND quote_response_id = ? AND user_id = ?',
                [paymentProofId, quote_id, quote_response_id, userId]
            );
        } else {
            await db.execute(
                `INSERT INTO payment_verifications 
                 (quote_id, quote_response_id, user_id, company_id, payment_proof_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [quote_id, quote_response_id, userId, company_id, paymentProofId]
            );
        }

        // Create or update user quote status to mark payment proof uploaded
        const [existingStatus] = await db.execute(
            'SELECT id FROM user_quote_status WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?',
            [quote_id, userId, quote_response_id]
        );

        if (existingStatus.length > 0) {
            // Update existing status
            await db.execute(
                'UPDATE user_quote_status SET payment_proof_id = ?, payment_verification_status = "pending" WHERE quote_id = ? AND user_id = ? AND quote_response_id = ?',
                [paymentProofId, quote_id, userId, quote_response_id]
            );
        } else {
            // Create new status record with payment proof but not accepted yet
            await db.execute(
                `INSERT INTO user_quote_status (quote_id, user_id, company_id, quote_response_id, payment_proof_id, payment_verification_status) 
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [quote_id, userId, company_id, quote_response_id, paymentProofId]
            );
        }

        // Clean up local file
        if (req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.warn('Could not delete local file:', unlinkError);
            }
        }

        // Get user and company details for email notifications
        const [userDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [userId]
        );

        const [companyDetails] = await db.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [company_id]
        );

        const [quoteResponseDetails] = await db.execute(
            `SELECT qr.*, cbd.bank_name, cbd.account_holder_name, cbd.account_number, cbd.swift_code,
                    cbd.branch_name, cbd.iban_number, cbd.payment_instructions
             FROM quote_responses qr 
             LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
             LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id 
             WHERE qr.id = ?`,
            [quote_response_id]
        );

        if (userDetails.length > 0 && companyDetails.length > 0 && quoteResponseDetails.length > 0) {
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const paymentDate = new Date(payment_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Send email to company
            try {
                await sendQuoteEmail('paymentProofToCompany', {
                    recipientEmail: companyDetails[0].email,
                    companyName: companyDetails[0].name,
                    customerName: userDetails[0].name,
                    customerEmail: userDetails[0].email,
                    quoteId: quote_id,
                    amount: quoteResponseDetails[0].price,
                    paymentDate: paymentDate,
                    uploadDate: currentDate,
                    paymentNotes: payment_notes || '',
                    bankName: quoteResponseDetails[0].bank_name || '',
                    accountHolderName: quoteResponseDetails[0].account_holder_name || '',
                    accountNumber: quoteResponseDetails[0].account_number || '',
                    swiftCode: quoteResponseDetails[0].swift_code || '',
                    branchName: quoteResponseDetails[0].branch_name || '',
                    ibanNumber: quoteResponseDetails[0].iban_number || '',
                    paymentInstructions: quoteResponseDetails[0].payment_instructions || ''
                });
                console.log('✅ Payment proof notification sent to company:', companyDetails[0].email);
            } catch (emailError) {
                console.error('❌ Failed to send payment proof notification to company:', emailError);
            }

            // Send confirmation email to user
            try {
                await sendQuoteEmail('paymentProofToUser', {
                    recipientEmail: userDetails[0].email,
                    customerName: userDetails[0].name,
                    companyName: companyDetails[0].name,
                    quoteId: quote_id,
                    amount: quoteResponseDetails[0].price,
                    paymentDate: paymentDate,
                    uploadDate: currentDate,
                    fileName: req.file.originalname,
                    paymentNotes: payment_notes || ''
                });
                console.log('✅ Payment proof confirmation sent to user:', userDetails[0].email);
            } catch (emailError) {
                console.error('❌ Failed to send payment proof confirmation to user:', emailError);
            }
        }

        res.status(201).json({ 
            message: 'Payment proof uploaded successfully. The company will verify your payment before work begins.',
            paymentProofId: paymentProofId,
            fileUrl: uploadResult.secure_url
        });

    } catch (error) {
        console.error('Error uploading payment proof:', error);
        res.status(500).json({ message: 'Server error uploading payment proof' });
    }
});

// @desc    Debug payment proof data for a quote
// @route   GET /api/enhanced-quotes/:quoteId/debug-payment-proofs
// @access  Private/Admin (for debugging)
router.get('/:quoteId/debug-payment-proofs', authenticateToken, authorizeRoles('admin', 'user', 'business'), async (req, res) => {
    try {
        const { quoteId } = req.params;
        const userId = req.user.id;

        // Get payment proofs for this quote
        const [paymentProofs] = await db.execute(
            'SELECT * FROM payment_proofs WHERE quote_id = ?',
            [quoteId]
        );

        // Get payment verifications
        const [verifications] = await db.execute(
            'SELECT * FROM payment_verifications WHERE quote_id = ?',
            [quoteId]
        );

        // Get user quote status
        const [userStatus] = await db.execute(
            'SELECT * FROM user_quote_status WHERE quote_id = ?',
            [quoteId]
        );

        // Get quote responses
        const [responses] = await db.execute(
            'SELECT * FROM quote_responses WHERE quote_id = ?',
            [quoteId]
        );

        res.json({
            quoteId,
            currentUserId: userId,
            paymentProofs,
            verifications,
            userStatus,
            responses,
            summary: {
                totalPaymentProofs: paymentProofs.length,
                totalVerifications: verifications.length,
                totalUserStatus: userStatus.length,
                totalResponses: responses.length,
                userHasPaymentProofs: paymentProofs.filter(p => p.user_id === userId).length
            }
        });

    } catch (error) {
        console.error('Error debugging payment proofs:', error);
        res.status(500).json({ message: 'Server error debugging payment proofs' });
    }
});

// @desc    Cleanup payment proof data for a quote (Admin only)
// @route   DELETE /api/enhanced-quotes/:quoteId/cleanup-payment-proofs
// @access  Private/Admin
router.delete('/:quoteId/cleanup-payment-proofs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { quoteId } = req.params;

        // Delete payment verifications first (foreign key constraint)
        const [verificationResult] = await db.execute(
            'DELETE FROM payment_verifications WHERE quote_id = ?',
            [quoteId]
        );

        // Delete payment proofs
        const [proofResult] = await db.execute(
            'DELETE FROM payment_proofs WHERE quote_id = ?',
            [quoteId]
        );

        // Reset user quote status payment-related fields
        const [statusResult] = await db.execute(
            'UPDATE user_quote_status SET payment_proof_id = NULL, payment_verification_status = NULL WHERE quote_id = ?',
            [quoteId]
        );

        res.json({
            message: 'Payment proof data cleaned up successfully',
            deletedVerifications: verificationResult.affectedRows,
            deletedProofs: proofResult.affectedRows,
            updatedStatusRecords: statusResult.affectedRows
        });

    } catch (error) {
        console.error('Error cleaning up payment proofs:', error);
        res.status(500).json({ message: 'Server error cleaning up payment proofs' });
    }
});

export default router;