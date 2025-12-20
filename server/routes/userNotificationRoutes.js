// routes/userNotificationRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead
} from '../controllers/userNotificationController.js';

// All routes require authentication
router.get('/', protect, getUserNotifications);
router.get('/unread-count', protect, getUnreadNotificationCount);
router.put('/:id/read', protect, markNotificationAsRead);

export default router;