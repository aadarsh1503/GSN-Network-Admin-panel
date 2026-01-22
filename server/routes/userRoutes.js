// routes/userRoutes.js

import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    loginUser,
    registerUser,
    getAdminData,
    getUserProfile,
    getUserProfileById,
    updateUserProfileById,
    getCompanyProfileByIdAdmin,
    updateCompanyProfileByIdAdmin,
    getCompanyProfile,
    getCompanies,
    toggleCompanyStatus,
    getBlacklistedCompanies,
    getBusinessUsers,
    getRegularUsers,
    changePassword,
    getAllUsers,
    updateUserProfile,
    getAllUsersForMessaging,
    submitUserTicket,
    getUserTickets,
    getUserCompanies,
    getUserTransactionInvoices,
    getUserTransactionInvoiceById,
    forgotPassword,
    resetPassword,
    verifyResetTokenEndpoint,
    refreshToken
} from '../controllers/userController.js';

// Public Routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// Password Reset Routes (Public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetTokenEndpoint);

// Protected Routes
router.get('/me', protect, getUserProfile);
router.put('/update-profile', protect, updateUserProfile);
router.post('/refresh-token', protect, refreshToken); // New refresh token endpoint
router.get('/admin-data', protect, authorize('admin'), getAdminData);

// Company profile route (for companies to get their own profile)
router.get('/company-profile', protect, authorize('company'), getCompanyProfile);

// --- NEW ROUTES FOR USER MANAGEMENT ---
// Only 'admin' can see list of companies and ban them
router.get('/companies', protect, authorize('admin'), getCompanies);
router.put('/company-status/:id', protect, authorize('admin'), toggleCompanyStatus);
router.get('/blacklisted-companies', protect, authorize('company'), getBlacklistedCompanies);
router.get('/business-owners', protect, authorize('admin'), getBusinessUsers);
router.get('/regular-users', protect, authorize('admin'), getRegularUsers);

router.put('/business-status/:id', protect, authorize('admin'), toggleCompanyStatus);

// Password change route
router.put('/change-password', protect, changePassword);

// Get all users (admin)
router.get('/all', protect, authorize('admin'), getAllUsers);

// Get all users for messaging (admin)
router.get('/all-users-for-messaging', protect, authorize('admin'), getAllUsersForMessaging);

// Admin routes for user management
router.get('/profile/:id', protect, authorize('admin'), getUserProfileById);
router.put('/update-profile/:id', protect, authorize('admin'), updateUserProfileById);

// Admin routes for company management (comprehensive)
router.get('/company-profile/:id', protect, authorize('admin'), getCompanyProfileByIdAdmin);
router.put('/company-profile/:id', protect, authorize('admin'), updateCompanyProfileByIdAdmin);

// Help & Support routes for users
router.post('/help/ticket', protect, submitUserTicket);
router.get('/help/tickets', protect, getUserTickets);
router.get('/my-companies', protect, getUserCompanies);

// Transaction Invoices routes for users
router.get('/transaction-invoices', protect, authorize('user'), getUserTransactionInvoices);
router.get('/transaction-invoices/:id', protect, authorize('user'), getUserTransactionInvoiceById);

export default router;