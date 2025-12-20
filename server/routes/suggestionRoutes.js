// routes/suggestionRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    submitSuggestion,
    getMySuggestions,
    getAllSuggestions,
    updateSuggestionStatus
} from '../controllers/suggestionController.js';

// User routes
router.post('/submit', protect, submitSuggestion);
router.get('/my-suggestions', protect, getMySuggestions);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllSuggestions);
router.put('/:id/status', protect, authorize('admin'), updateSuggestionStatus);

export default router;
