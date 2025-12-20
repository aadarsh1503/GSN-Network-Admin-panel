// routes/userQuoteRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getUserQuotes,
    getQuoteResponses,
    acceptQuoteResponse,
    rejectQuoteResponse,
    getUserNotifications,
    markNotificationAsRead,
    updateQuoteStatus,
    getQuoteStatus,
    getUserDashboardStats
} from '../controllers/userQuoteController.js';

const router = express.Router();

// All routes require authentication and 'user' role
router.use(protect);
router.use(authorize('user'));

// User quote management routes
router.get('/my-quotes', getUserQuotes);
router.get('/:quoteId/responses', getQuoteResponses);
router.post('/accept-response', acceptQuoteResponse);
router.post('/reject-response', rejectQuoteResponse);
router.put('/:quoteId/status', updateQuoteStatus);
router.get('/:quoteId/status', getQuoteStatus);

// User notifications
router.get('/notifications', getUserNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

// Dashboard stats
router.get('/dashboard-stats', getUserDashboardStats);

export default router;