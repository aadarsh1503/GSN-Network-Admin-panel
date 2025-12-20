// routes/reviewRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    submitReview,
    getCompanyReviews,
    getAllReviews,
    updateReviewStatus,
    getMyReviews
} from '../controllers/reviewController.js';

// Public routes
router.get('/company/:companyId', getCompanyReviews);

// Protected routes
router.post('/submit', protect, submitReview);
router.get('/my-reviews', protect, getMyReviews);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllReviews);
router.put('/:id/status', protect, authorize('admin'), updateReviewStatus);

export default router;