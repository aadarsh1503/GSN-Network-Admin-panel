// routes/messageRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import {
    sendMessage,
    getInboxMessages,
    getSentMessages,
    getConversation,
    markMessageAsRead,
    getUnreadCount,
    getConversations,
    markConversationAsRead
} from '../controllers/messageController.js';

// All message routes require authentication
router.post('/send', protect, sendMessage);
router.get('/inbox', protect, getInboxMessages);
router.get('/sent', protect, getSentMessages);
router.get('/conversations', protect, getConversations);
router.get('/conversation/:userId', protect, getConversation);
router.put('/:id/read', protect, markMessageAsRead);
router.put('/conversation/:userId/read', protect, markConversationAsRead);
router.get('/unread-count', protect, getUnreadCount);

export default router;