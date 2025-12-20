import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getCurrentVersion,
    getAllVersions,
    createVersion,
    setCurrentVersion
} from '../controllers/versionController.js';

// Public route - get current version
router.get('/current', getCurrentVersion);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllVersions);
router.post('/create', protect, authorize('admin'), createVersion);
router.put('/set-current/:id', protect, authorize('admin'), setCurrentVersion);

export default router;