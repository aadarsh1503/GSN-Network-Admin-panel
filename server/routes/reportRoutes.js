// routes/reportRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getMembershipReport,
    getTransactionsReport,
    getQuotesReport,
    getLoginsReport
} from '../controllers/reportController.js';

// All routes are admin only
router.get('/membership', protect, authorize('admin'), getMembershipReport);
router.get('/transactions', protect, authorize('admin'), getTransactionsReport);
router.get('/quotes', protect, authorize('admin'), getQuotesReport);
router.get('/logins', protect, authorize('admin'), getLoginsReport);

export default router;
