import express from 'express';
const router = express.Router();
import { 
    getBusinessCategories, 
    addBusinessCategory, 
    updateBusinessCategory,
    deleteBusinessCategory 
} from '../controllers/businessCategoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getBusinessCategories)
    .post(protect, authorize('admin'), addBusinessCategory);

router.route('/:id')
    .put(protect, authorize('admin'), updateBusinessCategory)
    .delete(protect, authorize('admin'), deleteBusinessCategory);

export default router;