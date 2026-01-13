import express from 'express';
import {
    getAllDisputeReasons,
    getAdminDisputeReasons,
    createDisputeReason,
    updateDisputeReason,
    deleteDisputeReason,
    getAllDisputes,
    getDisputeById,
    updateDisputeStatus,
    deleteDispute,
    createDispute,
    getUserDisputes,
    getCompanyDisputes,
    companyRespondToDispute,
    companyStatusChangeRequest,
    userCloseDispute,
    getUserCompanies,
    getDisputeMessages,
    sendDisputeMessage,
    addDisputeAttachment
} from '../controllers/disputeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Get dispute reasons for forms (public access)
router.get('/reasons', getAllDisputeReasons);

// ==================== USER/COMPANY ROUTES ====================
// Create new dispute (authenticated users)
router.post('/create', protect, createDispute);

// Get user's own disputes
router.get('/my-disputes', protect, getUserDisputes);

// Get disputes against a company (for company users)
router.get('/company-disputes', protect, getCompanyDisputes);

// Company response to dispute
router.post('/company-response/:id', protect, companyRespondToDispute);

// Company status change request
router.put('/company-status/:id', protect, companyStatusChangeRequest);

// User close resolved dispute
router.put('/user-close/:id', protect, userCloseDispute);

// Get companies that user has interacted with (for dispute filing)
router.get('/user-companies', protect, getUserCompanies);

// Add attachment to dispute
router.post('/attachments', protect, addDisputeAttachment);

// ==================== DISPUTE MESSAGING ROUTES ====================
// Get messages for a specific dispute
router.get('/:id/messages', protect, getDisputeMessages);

// Send message in dispute context
router.post('/:id/messages', protect, sendDisputeMessage);

// ==================== ADMIN ROUTES ====================
// All admin routes require authentication and admin role
router.use('/admin', protect, authorize('admin'));

// Dispute Reasons Management
router.get('/admin/reasons', getAdminDisputeReasons);
router.post('/admin/reasons', createDisputeReason);
router.put('/admin/reasons/:id', updateDisputeReason);
router.delete('/admin/reasons/:id', deleteDisputeReason);

// Disputes Management
router.get('/admin/all', getAllDisputes);
router.get('/admin/:id', getDisputeById);
router.put('/admin/:id/status', updateDisputeStatus);
router.delete('/admin/:id', deleteDispute);

export default router;