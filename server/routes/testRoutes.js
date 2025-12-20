// routes/testRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createTestMessages } from '../controllers/testController.js';

// Test routes - only for development
router.post('/create-messages', protect, authorize('admin'), createTestMessages);

export default router;