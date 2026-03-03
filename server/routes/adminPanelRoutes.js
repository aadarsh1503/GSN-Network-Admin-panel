// routes/adminPanelRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getAllSubscriptionsAdmin,
    getSubscriptionById,
    deleteSubscription,
    getAllTransactions,
    getAcceptedQuoteTransactions,
    getSubscriptionTransactions,
    getAllQuotesAdmin,
    getQuoteByIdAdmin,
    deleteQuote,
    updateQuoteStatusAdmin,
    getAllInvoicesAdmin,
    getInvoiceByIdAdmin,
    getAllTransactionInvoicesAdmin,
    getTransactionInvoiceByIdAdmin,
    getUserSubscriptions,
    getUserQuotes,
    getCompanyResponses,
    getAdminDashboardStats,
    blockUser,
    deleteUser,
    activateUser,
    deleteTransaction
} from '../controllers/adminPanelController.js';

import {
    getSubscriptionRequests,
    getSubscriptionRequestDetails,
    approveSubscriptionRequest,
    rejectSubscriptionRequest
} from '../controllers/subscriptionController.js';

import {
    getAWSSettings,
    updateAWSSettings,
    testAWSConnection
} from '../controllers/awsSettingsController.js';

// All routes require admin authentication
router.use(protect, authorize('admin'));

// ==================== SUBSCRIPTION & TRANSACTION ROUTES ====================
router.get('/subscriptions', getAllSubscriptionsAdmin);
router.get('/subscriptions/:id', getSubscriptionById);
router.delete('/subscriptions/:id', deleteSubscription);
router.get('/transactions', getAllTransactions); // Quote-related transactions
router.get('/accepted-quote-transactions', getAcceptedQuoteTransactions); // Accepted quotes as transactions
router.delete('/transactions/:id', deleteTransaction); // Delete transaction
router.get('/subscription-transactions', getSubscriptionTransactions); // Subscription plan transactions

// ==================== SUBSCRIPTION REQUEST ROUTES ====================
router.get('/subscription-requests', getSubscriptionRequests);
router.get('/subscription-requests/:id', getSubscriptionRequestDetails);
router.post('/subscription-requests/:id/approve', approveSubscriptionRequest);
router.post('/subscription-requests/:id/reject', rejectSubscriptionRequest);

// ==================== QUOTE MANAGEMENT ROUTES ====================
router.get('/quotes', (req, res, next) => {
    console.log('🚨 [ROUTE DEBUG] /quotes route hit!');
    next();
}, getAllQuotesAdmin);
router.get('/quotes/:id', getQuoteByIdAdmin);
router.delete('/quotes/:id', deleteQuote);
router.put('/quotes/:id/status', updateQuoteStatusAdmin);

// ==================== INVOICE MANAGEMENT ROUTES ====================
router.get('/invoices', getAllInvoicesAdmin);
router.get('/invoices/:id', getInvoiceByIdAdmin);
router.get('/transaction-invoices', getAllTransactionInvoicesAdmin);
router.get('/transaction-invoices/:id', getTransactionInvoiceByIdAdmin);

// ==================== USER MANAGEMENT ROUTES ====================
router.get('/users/:id/subscriptions', getUserSubscriptions);
router.get('/users/:id/quotes', getUserQuotes);
router.get('/companies/:id/responses', getCompanyResponses);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);

// ==================== DASHBOARD STATS ====================
router.get('/dashboard-stats', getAdminDashboardStats);

// ==================== AWS SETTINGS ROUTES ====================
router.get('/aws-settings', getAWSSettings);
router.put('/aws-settings', updateAWSSettings);
router.post('/aws-settings/test', testAWSConnection);

export default router;
