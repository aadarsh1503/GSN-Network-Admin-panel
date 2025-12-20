// routes/quoteResponseRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    submitQuoteResponse,
    getQuoteResponses,
    getMyQuoteResponses,
    updateResponseStatus
} from '../controllers/quoteResponseController.js';

// Company routes
router.post('/submit', protect, authorize('company'), submitQuoteResponse);
router.get('/my-responses', protect, authorize('company'), getMyQuoteResponses);

// User routes (quote owners)
router.get('/quote/:quoteId', protect, getQuoteResponses);
router.put('/:id/status', protect, updateResponseStatus);

export default router;