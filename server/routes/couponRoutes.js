// routes/couponRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getMyCoupons, validateCoupon, applyCoupon, releaseCoupon,
  listTemplates, createTemplate, updateTemplate, toggleTemplate, deleteTemplate,
  distributeCoupon, listIssued, listRedemptions, restoreRedemption,
  getReferralRules, updateReferralRule, toggleReferralCoupons,
  getSettings, updateSettings,
  getWelcomeSettings, updateWelcomeSettings,
  getOrderRewardSettings, updateOrderRewardSettings,
} from '../controllers/couponController.js';

const router = express.Router();

// ─── USER (any authenticated role) ────────────────────────────────────────────
router.get('/my', protect, getMyCoupons);
router.post('/validate', protect, validateCoupon);
router.post('/apply', protect, applyCoupon);
router.post('/release', protect, releaseCoupon);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
router.get('/admin/templates', protect, authorize('admin'), listTemplates);
router.post('/admin/templates', protect, authorize('admin'), createTemplate);
router.put('/admin/templates/:id', protect, authorize('admin'), updateTemplate);
router.put('/admin/templates/:id/status', protect, authorize('admin'), toggleTemplate);
router.delete('/admin/templates/:id', protect, authorize('admin'), deleteTemplate);
router.post('/admin/templates/:id/distribute', protect, authorize('admin'), distributeCoupon);
router.post('/admin/distribute', protect, authorize('admin'), distributeCoupon);

router.get('/admin/issued', protect, authorize('admin'), listIssued);
router.get('/admin/redemptions', protect, authorize('admin'), listRedemptions);
router.put('/admin/redemptions/:id/restore', protect, authorize('admin'), restoreRedemption);

router.get('/admin/referral-rules', protect, authorize('admin'), getReferralRules);
router.put('/admin/referral-rules/:entityType', protect, authorize('admin'), updateReferralRule);
router.put('/admin/referral-rules/:entityType/toggle', protect, authorize('admin'), toggleReferralCoupons);

router.get('/admin/settings', protect, authorize('admin'), getSettings);
router.put('/admin/settings', protect, authorize('admin'), updateSettings);

router.get('/admin/welcome-settings', protect, authorize('admin'), getWelcomeSettings);
router.put('/admin/welcome-settings', protect, authorize('admin'), updateWelcomeSettings);

router.get('/admin/order-reward-settings', protect, authorize('admin'), getOrderRewardSettings);
router.put('/admin/order-reward-settings', protect, authorize('admin'), updateOrderRewardSettings);

export default router;
