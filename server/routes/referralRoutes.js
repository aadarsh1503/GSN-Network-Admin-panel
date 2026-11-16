// routes/referralRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getMyReferralInfo,
  getReferralHistory,
  getWallet,
  validateCode,
  adminGetAllReferrals,
  adminGetRules,
  adminUpdateRule,
  adminAdjustWallet,
  adminGetWallets,
  adminGetUniversalCode,
  adminUpdateUniversalCode,
} from '../controllers/referralController.js';

const router = express.Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
// Validate a referral code (called from registration form, no auth needed)
router.post('/validate-code', validateCode);

// ─── AUTHENTICATED (company only) ─────────────────────────────────────────
// Referral program is available only in the company panel.
router.get('/my-code',   protect, authorize('company'), getMyReferralInfo);
router.get('/history',   protect, authorize('company'), getReferralHistory);
router.get('/wallet',    protect, authorize('company'), getWallet);

// ─── ADMIN ONLY ───────────────────────────────────────────────────────────
router.get('/admin/all',                   protect, authorize('admin'), adminGetAllReferrals);
router.get('/admin/rules',                 protect, authorize('admin'), adminGetRules);
router.put('/admin/rules/:entityType',     protect, authorize('admin'), adminUpdateRule);
router.post('/admin/adjust-wallet',        protect, authorize('admin'), adminAdjustWallet);
router.get('/admin/wallets',               protect, authorize('admin'), adminGetWallets);
router.get('/admin/universal-code',        protect, authorize('admin'), adminGetUniversalCode);
router.put('/admin/universal-code',        protect, authorize('admin'), adminUpdateUniversalCode);

export default router;
