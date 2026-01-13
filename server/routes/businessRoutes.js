// routes/businessRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getBusinessProfile,
    updateBusinessProfile,
    changeBusinessPassword,
    getBusinessDashboardStats,
    getBusinessQuotes,
    getBusinessQuoteResponses,
    submitQuoteResponse,
    updateQuoteResponse,
    deleteQuoteResponse,
    getBusinessNotifications,
    markBusinessNotificationAsRead,
    getBusinessMessages,
    sendBusinessMessage,
    getBusinessConversations,
    getBusinessConversation,
    markBusinessConversationAsRead,
    getBusinessUnreadCount,
    getBusinessDisputes,
    respondToDispute,
    getBusinessHelp,
    submitBusinessTicket,
    getBusinessTickets,
    getBusinessCompanies,
    getBusinessTransactionInvoices,
    getBusinessTransactionInvoiceById
} from '../controllers/businessController.js';

// All routes require authentication and 'business' role
router.use(protect);
router.use(authorize('business'));

// Profile Management
router.get('/profile', getBusinessProfile);
router.put('/profile', updateBusinessProfile);
router.put('/change-password', changeBusinessPassword);

// Dashboard
router.get('/dashboard-stats', getBusinessDashboardStats);

// Quotes Management
router.get('/quotes', getBusinessQuotes);
router.get('/quotes/:quoteId/responses', getBusinessQuoteResponses);
router.post('/quotes/:quoteId/respond', submitQuoteResponse);
router.put('/quote-responses/:responseId', updateQuoteResponse);
router.delete('/quote-responses/:responseId', deleteQuoteResponse);

// Notifications
router.get('/notifications', getBusinessNotifications);
router.put('/notifications/:id/read', markBusinessNotificationAsRead);

// Messages
router.get('/messages', getBusinessMessages);
router.get('/messages/conversations', getBusinessConversations);
router.get('/messages/conversation/:userId', getBusinessConversation);
router.put('/messages/conversation/:userId/read', markBusinessConversationAsRead);
router.get('/messages/unread-count', getBusinessUnreadCount);
router.post('/messages/send', sendBusinessMessage);

// Disputes
router.get('/disputes', getBusinessDisputes);
router.post('/disputes/:id/respond', respondToDispute);

// Help & Support
router.get('/help', getBusinessHelp);
router.post('/help/ticket', submitBusinessTicket);
router.get('/help/tickets', getBusinessTickets);

// Companies
router.get('/companies', getBusinessCompanies);

// Transaction Invoices
router.get('/transaction-invoices', getBusinessTransactionInvoices);
router.get('/transaction-invoices/:id', getBusinessTransactionInvoiceById);

export default router;