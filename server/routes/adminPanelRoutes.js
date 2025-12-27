// routes/adminPanelRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getAllSubscriptionsAdmin,
    getSubscriptionById,
    getAllTransactions,
    getSubscriptionTransactions,
    getAllQuotesAdmin,
    getQuoteByIdAdmin,
    deleteQuote,
    updateQuoteStatusAdmin,
    getUserSubscriptions,
    getUserQuotes,
    getCompanyResponses,
    getAdminDashboardStats,
    blockUser,
    deleteUser,
    deleteTransaction
} from '../controllers/adminPanelController.js';

// All routes require admin authentication
router.use(protect, authorize('admin'));

// ==================== SUBSCRIPTION & TRANSACTION ROUTES ====================
router.get('/subscriptions', getAllSubscriptionsAdmin);
router.get('/subscriptions/:id', getSubscriptionById);
router.get('/transactions', getAllTransactions); // Quote-related transactions
router.delete('/transactions/:id', deleteTransaction); // Delete transaction
router.get('/subscription-transactions', getSubscriptionTransactions); // Subscription plan transactions

// ==================== QUOTE MANAGEMENT ROUTES ====================
router.get('/quotes', getAllQuotesAdmin);
router.get('/quotes/:id', getQuoteByIdAdmin);
router.delete('/quotes/:id', deleteQuote);
router.put('/quotes/:id/status', updateQuoteStatusAdmin);

// ==================== USER MANAGEMENT ROUTES ====================
router.get('/users/:id/subscriptions', getUserSubscriptions);
router.get('/users/:id/quotes', getUserQuotes);
router.get('/companies/:id/responses', getCompanyResponses);
router.put('/users/:id/block', blockUser);
router.delete('/users/:id', deleteUser);

// ==================== DASHBOARD STATS ====================
router.get('/dashboard-stats', getAdminDashboardStats);

export default router;
