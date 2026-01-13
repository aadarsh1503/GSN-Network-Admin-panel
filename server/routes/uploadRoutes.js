// routes/uploadRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadImage, upload } from '../controllers/uploadController.js';

const router = express.Router();

// Upload image
router.post('/image', protect, upload.single('image'), uploadImage);

export default router;