// routes/walletRoutes.js
import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getCurrencyRate,
  getWalletSummary,
  getMyTransactions,
  getMyTopups,
  createPaypalTopup,
  createBankTopup,
  previewSubscriptionPayment,
  paySubscriptionWithWallet,
  adminGetSettings,
  adminUpdateSettings,
  adminRefreshRate,
  adminListWallets,
  adminWalletDetail,
  adminAdjustWallet,
  adminBulkAdjustWallet,
  adminListTransactions,
  adminListTopups,
  adminApproveTopup,
  adminRejectTopup,
  adminOverview,
} from '../controllers/walletController.js';

const router = express.Router();

// Cloudinary storage for wallet top-up payment proofs
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wallet-topup-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ─── PUBLIC ────────────────────────────────────────────────────────────────
router.get('/currency-rate', getCurrencyRate);

// ─── COMPANY ───────────────────────────────────────────────────────────────
router.get('/', protect, authorize('company'), getWalletSummary);
router.get('/transactions', protect, authorize('company'), getMyTransactions);
router.get('/topups', protect, authorize('company'), getMyTopups);
router.post('/topup/paypal', protect, authorize('company'), createPaypalTopup);
router.post('/topup/bank', protect, authorize('company'), upload.single('paymentProof'), createBankTopup);
router.get('/subscription-preview/:planId', protect, authorize('company'), previewSubscriptionPayment);
router.post('/subscription/pay', protect, authorize('company'), paySubscriptionWithWallet);

// ─── ADMIN ─────────────────────────────────────────────────────────────────
router.get('/admin/overview', protect, authorize('admin'), adminOverview);
router.get('/admin/settings', protect, authorize('admin'), adminGetSettings);
router.put('/admin/settings', protect, authorize('admin'), adminUpdateSettings);
router.post('/admin/refresh-rate', protect, authorize('admin'), adminRefreshRate);
router.get('/admin/wallets', protect, authorize('admin'), adminListWallets);
router.get('/admin/wallets/:userId', protect, authorize('admin'), adminWalletDetail);
router.post('/admin/adjust', protect, authorize('admin'), adminAdjustWallet);
router.post('/admin/bulk-adjust', protect, authorize('admin'), adminBulkAdjustWallet);
router.get('/admin/transactions', protect, authorize('admin'), adminListTransactions);
router.get('/admin/topups', protect, authorize('admin'), adminListTopups);
router.post('/admin/topups/:id/approve', protect, authorize('admin'), adminApproveTopup);
router.post('/admin/topups/:id/reject', protect, authorize('admin'), adminRejectTopup);

export default router;
