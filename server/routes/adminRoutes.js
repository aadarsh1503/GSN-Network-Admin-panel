import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getNewRegistrations,
  getPendingNotifications,
  markNotificationAsRead,
  getAdminStats
} from '../controllers/adminController.js';

const router = express.Router();

// All routes are admin only
router.use(protect, authorize('admin'));

// Get new registrations since timestamp
router.get('/new-registrations', getNewRegistrations);

// Get pending notifications
router.get('/pending-notifications', getPendingNotifications);

// Mark notification as read
router.put('/notifications/:id/read', markNotificationAsRead);

// Get admin dashboard stats
router.get('/stats', getAdminStats);

export default router;