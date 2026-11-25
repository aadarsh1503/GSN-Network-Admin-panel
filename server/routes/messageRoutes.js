// routes/messageRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    sendMessage,
    getInboxMessages,
    getSentMessages,
    getConversation,
    markMessageAsRead,
    getUnreadCount,
    getConversations,
    markConversationAsRead,
    markAllMessagesRead,
    getAllUserConversations,
    getAdminConversationBetween
} from '../controllers/messageController.js';

// All message routes require authentication
router.post('/send', protect, sendMessage);
router.get('/inbox', protect, getInboxMessages);
router.get('/sent', protect, getSentMessages);
router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllMessagesRead);

// Admin monitoring: any member-to-member thread
router.get('/admin/conversations', protect, authorize('admin'), getAllUserConversations);
router.get('/admin/conversation/:userA/:userB', protect, authorize('admin'), getAdminConversationBetween);

router.get('/conversation/:userId', protect, getConversation);
router.put('/:id/read', protect, markMessageAsRead);
router.put('/conversation/:userId/read', protect, markConversationAsRead);

export default router;