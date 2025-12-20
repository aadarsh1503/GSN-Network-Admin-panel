// routes/subscriptionRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getPlans,
    getMySubscription,
    activateSubscription,
    createPlan,
    updatePlan,
    getAllPlans,
    getAllSubscriptions
} from '../controllers/subscriptionController.js';

// Public routes
router.get('/plans', getPlans);

// User routes
router.get('/my-subscription', protect, getMySubscription);
router.post('/activate', protect, activateSubscription);

// Admin routes
router.get('/admin/plans', protect, authorize('admin'), getAllPlans);
router.post('/admin/plans', protect, authorize('admin'), createPlan);
router.put('/admin/plans/:id', protect, authorize('admin'), updatePlan);
router.get('/admin/all', protect, authorize('admin'), getAllSubscriptions);

export default router;
