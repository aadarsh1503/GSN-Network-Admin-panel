// utils/couponApi.js
import { api } from './api';

export const couponApi = {
  // ── User ──
  getMy: (status) => api.get(`/api/coupons/my${status ? `?status=${status}` : ''}`),
  validate: (identifier, orderAmount) =>
    api.post('/api/coupons/validate', { identifier, orderAmount }),
  apply: (identifier, orderType, orderRefId, orderAmount) =>
    api.post('/api/coupons/apply', { identifier, orderType, orderRefId, orderAmount }),
  release: (redemptionId) => api.post('/api/coupons/release', { redemptionId }),

  // ── Admin: templates ──
  listTemplates: (search = '', status = '') =>
    api.get(`/api/coupons/admin/templates?search=${encodeURIComponent(search)}&status=${status}`),
  createTemplate: (data) => api.post('/api/coupons/admin/templates', data),
  updateTemplate: (id, data) => api.put(`/api/coupons/admin/templates/${id}`, data),
  toggleTemplate: (id, isActive) => api.put(`/api/coupons/admin/templates/${id}/status`, { isActive }),
  deleteTemplate: (id) => api.delete(`/api/coupons/admin/templates/${id}`),
  distribute: (couponId, data) => api.post(`/api/coupons/admin/templates/${couponId}/distribute`, data),

  // ── Admin: issued + history ──
  listIssued: (params = {}) => api.get(`/api/coupons/admin/issued?${new URLSearchParams(params)}`),
  listRedemptions: (params = {}) => api.get(`/api/coupons/admin/redemptions?${new URLSearchParams(params)}`),
  restoreRedemption: (id, reason) => api.put(`/api/coupons/admin/redemptions/${id}/restore`, { reason }),

  // ── Admin: referral coupon rules ──
  getReferralRules: () => api.get('/api/coupons/admin/referral-rules'),
  updateReferralRule: (entityType, data) => api.put(`/api/coupons/admin/referral-rules/${entityType}`, data),
  toggleReferralCoupons: (entityType, enabled) => api.put(`/api/coupons/admin/referral-rules/${entityType}/toggle`, { enabled }),

  // ── Admin: settings ──
  getSettings: () => api.get('/api/coupons/admin/settings'),
  updateSettings: (data) => api.put('/api/coupons/admin/settings', data),
};

export default couponApi;
