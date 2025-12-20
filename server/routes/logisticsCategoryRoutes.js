import express from 'express';
const router = express.Router();
import { 
    getLogisticsCategories, 
    addLogisticsCategory, 
    updateLogisticsCategory, // Import the new function
    deleteLogisticsCategory 
} from '../controllers/logisticsCategoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getLogisticsCategories)
    .post(protect, authorize('admin'), addLogisticsCategory);

router.route('/:id')
    .put(protect, authorize('admin'), updateLogisticsCategory) // Add PUT here
    .delete(protect, authorize('admin'), deleteLogisticsCategory);

export default router;