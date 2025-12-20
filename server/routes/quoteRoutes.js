// routes/quoteRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import {
    submitQuote,
    getAllQuotes,
    getMyQuotes,
    getAvailableQuotes,
    getQuotesByStatus,
    updateQuoteStatus
} from '../controllers/quoteController.js';

// Public route with optional authentication - anyone can submit a quote
router.post('/submit', optionalAuth, submitQuote);

// Protected routes - require authentication
router.get('/my-quotes', protect, getMyQuotes);
router.get('/available', protect, authorize('company'), getAvailableQuotes);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllQuotes);
router.get('/status/:status', protect, authorize('admin'), getQuotesByStatus);
router.put('/:id/status', protect, authorize('admin'), updateQuoteStatus);

export default router;