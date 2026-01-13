// routes/businessQuoteRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getBusinessUserQuotes,
    getBusinessQuoteResponses,
    acceptBusinessQuoteResponse,
    rejectBusinessQuoteResponse,
    getBusinessUserNotifications,
    markBusinessNotificationAsRead,
    updateBusinessQuoteStatus,
    getBusinessQuoteStatus,
    getBusinessUserDashboardStats
} from '../controllers/businessQuoteController.js';

const router = express.Router();

// All routes require authentication and 'business' role
router.use(protect);
router.use(authorize('business'));

// Business user quote management routes
router.get('/my-quotes', getBusinessUserQuotes);
router.get('/:quoteId/responses', getBusinessQuoteResponses);
router.post('/accept-response', acceptBusinessQuoteResponse);
router.post('/reject-response', rejectBusinessQuoteResponse);
router.put('/:quoteId/status', updateBusinessQuoteStatus);
router.get('/:quoteId/status', getBusinessQuoteStatus);

// Business user notifications
router.get('/notifications', getBusinessUserNotifications);
router.put('/notifications/:id/read', markBusinessNotificationAsRead);

// Dashboard stats
router.get('/dashboard-stats', getBusinessUserDashboardStats);

export default router;
