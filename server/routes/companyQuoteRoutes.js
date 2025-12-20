// routes/companyQuoteRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getMyQuoteResponses,
    updateResponseStatus,
    updateQuoteStatus,
    getAcceptedQuotes
} from '../controllers/companyQuoteController.js';

const router = express.Router();

// All routes require authentication and 'company' role
router.use(protect);
router.use(authorize('company'));

// Company quote management routes
router.get('/my-responses', getMyQuoteResponses);
router.get('/accepted-quotes', getAcceptedQuotes);
router.put('/response/:responseId/status', updateResponseStatus);
router.put('/quote/:quoteId/status', updateQuoteStatus);

export default router;