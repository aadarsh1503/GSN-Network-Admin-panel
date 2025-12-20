// routes/wishlistRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import {
    addToWishlist,
    removeFromWishlist,
    getWishlist
} from '../controllers/wishlistController.js';

router.post('/add', protect, addToWishlist);
router.delete('/:companyId', protect, removeFromWishlist);
router.get('/', protect, getWishlist);

export default router;
