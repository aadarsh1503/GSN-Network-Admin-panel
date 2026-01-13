// routes/subscriptionRoutes.js
import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getPlans,
    getMySubscription,
    activateSubscription,
    createPlan,
    updatePlan,
    getAllPlans,
    getAllSubscriptions,
    deletePlan,
    submitBankTransferRequest,
    getCompanySubscriptionTransactions
} from '../controllers/subscriptionController.js';

// Configure Cloudinary storage for payment proofs
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'subscription-payment-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/plans', getPlans);

// User routes
router.get('/my-subscription', protect, getMySubscription);
router.post('/activate', protect, activateSubscription);
router.post('/bank-transfer-request', protect, upload.single('paymentProof'), submitBankTransferRequest);

// Company routes
router.get('/company/subscription-transactions', protect, getCompanySubscriptionTransactions);

// Admin routes
router.get('/admin/plans', protect, authorize('admin'), getAllPlans);
router.post('/admin/plans', protect, authorize('admin'), createPlan);
router.put('/admin/plans/:id', protect, authorize('admin'), updatePlan);
router.delete('/admin/plans/:id', protect, authorize('admin'), deletePlan);
router.get('/admin/all', protect, authorize('admin'), getAllSubscriptions);

export default router;
