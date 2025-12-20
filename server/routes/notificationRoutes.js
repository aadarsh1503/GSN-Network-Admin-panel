import express from 'express';
const router = express.Router();
import { sendNotification, getMyNotifications, getUnreadCount, markNotificationsAsRead } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js'; // Importing your specific config

// POST: Send Notification (Admin Only)
// Note: 'imageUpload' is the name of the input field in the React Frontend
router.post('/send', protect, authorize('admin'), upload.single('imageUpload'), sendNotification);

// GET: My Notifications (Any logged in user)
router.get('/my-notifications', protect, getMyNotifications);

// GET: Unread notification count
router.get('/unread-count', protect, getUnreadCount);

// POST: Mark notifications as read
router.post('/mark-read', protect, markNotificationsAsRead);

export default router;