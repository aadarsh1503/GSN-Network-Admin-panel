import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getNewRegistrations,
  getPendingNotifications,
  markNotificationAsRead,
  getAdminStats,
  markToastAsSeen,
  getUnreadNotificationsCount
} from '../controllers/adminController.js';
import { getAllUsersForMessaging } from '../controllers/userController.js';

const router = express.Router();

// All routes are admin only
router.use(protect, authorize('admin'));

// Get new registrations since timestamp
router.get('/new-registrations', getNewRegistrations);

// Get pending notifications
router.get('/pending-notifications', getPendingNotifications);

// Get unread notifications count
router.get('/unread-notifications-count', getUnreadNotificationsCount);

// Mark notification as read
router.put('/notifications/:id/read', markNotificationAsRead);

// Mark toast notifications as seen by admin
router.post('/mark-toast-seen', markToastAsSeen);

// Get admin dashboard stats
router.get('/stats', getAdminStats);

// Get all users for messaging
router.get('/all-users-for-messaging', getAllUsersForMessaging);

export default router;