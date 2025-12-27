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
    getCompanies,
    toggleCompanyStatus,
    getBusinessUsers,
    getRegularUsers,
    changePassword,
    getAllUsers,
    updateUserProfile
} from '../controllers/userController.js';

// Public Routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// Protected Routes
router.get('/me', protect, getUserProfile);
router.put('/update-profile', protect, updateUserProfile);
router.get('/admin-data', protect, authorize('admin'), getAdminData);

// --- NEW ROUTES FOR USER MANAGEMENT ---
// Only 'admin' can see list of companies and ban them
router.get('/companies', protect, authorize('admin'), getCompanies);
router.put('/company-status/:id', protect, authorize('admin'), toggleCompanyStatus);
router.get('/business-owners', protect, authorize('admin'), getBusinessUsers);
router.get('/regular-users', protect, authorize('admin'), getRegularUsers);

router.put('/business-status/:id', protect, authorize('admin'), toggleCompanyStatus);

// Password change route
router.put('/change-password', protect, changePassword);

// Get all users (admin)
router.get('/all', protect, authorize('admin'), getAllUsers);

// Admin routes for user management
router.get('/profile/:id', protect, authorize('admin'), getUserProfileById);
router.put('/update-profile/:id', protect, authorize('admin'), updateUserProfileById);

// Admin routes for company management (comprehensive)
router.get('/company-profile/:id', protect, authorize('admin'), getCompanyProfileByIdAdmin);
router.put('/company-profile/:id', protect, authorize('admin'), updateCompanyProfileByIdAdmin);

export default router;