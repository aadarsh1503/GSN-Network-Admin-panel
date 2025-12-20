// routes/dashboardRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getDashboardStats,
    getCompanyDashboardStats
} from '../controllers/dashboardController.js';

// Admin dashboard stats
router.get('/stats', protect, authorize('admin'), getDashboardStats);

// Company dashboard stats
router.get('/company-stats', protect, authorize('company'), getCompanyDashboardStats);

export default router;