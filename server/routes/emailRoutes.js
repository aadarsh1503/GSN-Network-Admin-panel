import express from 'express';
import {
    sendBulkEmails,
    getEmailStats,
    getEmailLogs,
    getEmailCampaigns
} from '../controllers/emailController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All email routes require admin authentication
router.use(protect, authorize('admin'));

// @route   POST /api/admin/send-emails
// @desc    Send bulk emails to users
// @access  Private/Admin
router.post('/send-emails', sendBulkEmails);

// @route   GET /api/admin/email-stats
// @desc    Get email statistics
// @access  Private/Admin
router.get('/email-stats', getEmailStats);

// @route   GET /api/admin/email-logs
// @desc    Get email logs with pagination
// @access  Private/Admin
router.get('/email-logs', getEmailLogs);

// @route   GET /api/admin/email-campaigns
// @desc    Get email campaign history with filters
// @access  Private/Admin
router.get('/email-campaigns', getEmailCampaigns);

export default router;