import express from 'express';
import { queueSubscriptionEmails } from '../services/emailQueue.js';
import { protect as authenticateToken, authorize as authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get email queue status
// @route   GET /api/email-queue/status
// @access  Private/Admin
router.get('/status', authenticateToken, authorizeRoles('admin'), (req, res) => {
    try {
        const status = queueSubscriptionEmails.getQueueStatus();
        res.status(200).json({
            success: true,
            data: status,
            message: status.processing ? 'Email queue is processing' : 'Email queue is idle'
        });
    } catch (error) {
        console.error('Error getting email queue status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get email queue status'
        });
    }
});

export default router;