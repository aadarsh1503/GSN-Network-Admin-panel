// controllers/couponController.js
import db from '../config/db.js';
import couponService from '../services/couponService.js';

// ===================== USER ENDPOINTS =====================

// GET /api/coupons/my?status=available|used|expired
export const getMyCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    await couponService.expireStaleCoupons(userId);
    const status = req.query.status || '';
    let sql = `SELECT uc.id, uc.code, uc.status, uc.source, uc.issued_reason, uc.expires_at,
                      uc.redeemed_at, uc.order_type, uc.order_amount, uc.discount_applied,
                      uc.created_at, c.name AS coupon_name, c.description, c.discount_type,
                      c.discount_value, c.min_order_amount, c.max_discount_amount
                 FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
                WHERE uc.user_id = ?`;
    const params = [userId];
    if (status) { sql += ' AND uc.status = ?'; params.push(status); }
    sql += ' ORDER BY FIELD(uc.status,"available","used","expired","disabled"), uc.created_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getMyCoupons error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/coupons/validate  { identifier, orderAmount }
export const validateCoupon = async (req, res) => {
  try {
    const { identifier, orderAmount } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Coupon code/id is required' });
    const result = await couponService.validateForOrder({
      userId: req.user.id, identifier, orderAmount: Number(orderAmount),
    });
    res.json(result);
  } catch (err) {
    console.error('validateCoupon error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/coupons/apply  { identifier, orderType, orderRefId, orderAmount }
// Locks the coupon (single-use enforcement) at payment initiation.
export const applyCoupon = async (req, res) => {
  try {
    const { identifier, orderType, orderRefId, orderAmount } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Coupon code/id is required' });
    const result = await couponService.lockForOrder({
      userId: req.user.id, identifier, orderType: orderType || 'subscription',
      orderRefId: orderRefId || null, orderAmount: Number(orderAmount),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('applyCoupon error:', err);
    res.status(400).json({ message: err.message || 'Could not apply coupon' });
  }
};

// POST /api/coupons/release  { redemptionId }  — release on payment fail/cancel
export const releaseCoupon = async (req, res) => {
  try {
    const { redemptionId } = req.body;
    if (!redemptionId) return res.status(400).json({ message: 'redemptionId is required' });
    // ensure the redemption belongs to the user
    const [rows] = await db.execute('SELECT 1 FROM coupon_redemptions WHERE id = ? AND user_id = ?', [redemptionId, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Redemption not found' });
    await couponService.releaseRedemption({ redemptionId, reason: 'User cancelled payment' });
    res.json({ success: true, message: 'Coupon released' });
  } catch (err) {
    console.error('releaseCoupon error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===================== ADMIN ENDPOINTS =====================

// GET /api/coupons/admin/templates?search=&status=
export const listTemplates = async (req, res) => {
  try {
    const rows = await couponService.listTemplates({ search: req.query.search || '', status: req.query.status || '' });
    // attach issued counts
    const ids = rows.map(r => r.id);
    let counts = {};
    if (ids.length) {
      const [c] = await db.query(`SELECT coupon_id, COUNT(*) AS cnt FROM user_coupons WHERE coupon_id IN (?) GROUP BY coupon_id`, [ids]);
      c.forEach(x => (counts[x.coupon_id] = x.cnt));
    }
    const out = rows.map(r => ({ ...r, issued_count: counts[r.id] || 0 }));
    res.json(out);
  } catch (err) {
    console.error('listTemplates error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/coupons/admin/templates
export const createTemplate = async (req, res) => {
  try {
    const id = await couponService.createCouponTemplate(req.body, req.user.id);
    res.status(201).json({ message: 'Coupon created', id });
  } catch (err) {
    console.error('createTemplate error:', err);
    res.status(400).json({ message: err.message || 'Server error' });
  }
};

// PUT /api/coupons/admin/templates/:id
export const updateTemplate = async (req, res) => {
  try {
    const ok = await couponService.updateCouponTemplate(req.params.id, req.body);
    res.json({ message: ok ? 'Coupon updated' : 'Nothing to update' });
  } catch (err) {
    console.error('updateTemplate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/coupons/admin/templates/:id/status  { isActive }
export const toggleTemplate = async (req, res) => {
  try {
    await couponService.setTemplateActive(req.params.id, !!req.body.isActive);
    res.json({ message: 'Coupon status updated' });
  } catch (err) {
    console.error('toggleTemplate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/coupons/admin/templates/:id
export const deleteTemplate = async (req, res) => {
  try {
    const r = await couponService.deleteCouponTemplate(req.params.id);
    res.json({ message: r.soft ? 'Coupon has issued instances; deactivated instead of deleted' : 'Coupon deleted' });
  } catch (err) {
    console.error('deleteTemplate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/coupons/admin/templates/:id/distribute  { recipientType: single|selected|all, userIds, role, expiresAt, reason }
export const distributeCoupon = async (req, res) => {
  try {
    const { couponId, recipientType, userIds, role, expiresAt, reason } = req.body;
    const id = req.params.id || couponId;
    if (!id) return res.status(400).json({ message: 'couponId is required' });
    const [tpl] = await db.execute('SELECT * FROM coupons WHERE id = ? AND source = "admin"', [id]);
    if (!tpl.length) return res.status(404).json({ message: 'Coupon template not found' });
    if (!tpl[0].is_active) return res.status(400).json({ message: 'Coupon is inactive' });

    let targets = [];
    if (recipientType === 'single' || recipientType === 'selected') {
      if (!Array.isArray(userIds) || !userIds.length) return res.status(400).json({ message: 'userIds required for single/selected distribution' });
      targets = userIds;
    } else if (recipientType === 'all') {
      let sql = `SELECT id FROM users WHERE status = 1 AND (is_blacklisted = 0 OR is_blacklisted IS NULL)`;
      const params = [];
      if (role) { sql += ' AND role = ?'; params.push(role); }
      const [rows] = await db.execute(sql, params);
      targets = rows.map(r => r.id);
    } else {
      return res.status(400).json({ message: 'Invalid recipientType (single|selected|all)' });
    }

    let issued = 0;
    const failed = [];
    for (const uid of targets) {
      try {
        await couponService.issueCouponInstance(null, {
          couponId: id, userId: uid, source: recipientType === 'all' ? 'campaign' : 'admin_bonus',
          issuedBy: req.user.id, reason: reason || 'Admin distribution', expiresAt: expiresAt || null,
        });
        issued++;
      } catch (e) { failed.push({ userId: uid, error: e.message }); }
    }
    res.json({ message: `Coupon distributed to ${issued} user(s)`, issued, total: targets.length, failed });
  } catch (err) {
    console.error('distributeCoupon error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/coupons/admin/issued?status=&search=&couponId=&page=&limit=
export const listIssued = async (req, res) => {
  try {
    const { status, search, couponId } = req.query;
    const source = req.query.source || '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND uc.status = ?'; params.push(status); }
    if (couponId) { where += ' AND uc.coupon_id = ?'; params.push(couponId); }
    if (source) { where += ' AND uc.source = ?'; params.push(source); }
    if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ? OR uc.code LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const sql = `SELECT uc.id, uc.code, uc.status, uc.source, uc.issued_reason, uc.expires_at,
                        uc.redeemed_at, uc.order_type, uc.order_amount, uc.discount_applied, uc.created_at,
                        c.name AS coupon_name, c.discount_type, c.discount_value,
                        u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role
                   FROM user_coupons uc
                   JOIN coupons c ON uc.coupon_id = c.id
                   JOIN users u ON uc.user_id = u.id
                   ${where}
                   ORDER BY uc.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await db.execute(sql, params);
    const [cnt] = await db.execute(`SELECT COUNT(*) AS c FROM user_coupons uc JOIN users u ON uc.user_id = u.id JOIN coupons c ON uc.coupon_id=c.id ${where}`, params);
    res.json({ coupons: rows, pagination: { total: cnt[0].c, page, limit, totalPages: Math.ceil(cnt[0].c / limit) } });
  } catch (err) {
    console.error('listIssued error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/coupons/admin/redemptions?search=&page=&limit=
export const listRedemptions = async (req, res) => {
  try {
    const { search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ? OR cr.order_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const sql = `SELECT cr.id, cr.order_type, cr.order_id, cr.order_amount, cr.discount_amount, cr.final_amount,
                        cr.payment_status, cr.status AS redemption_status, cr.redeemed_at, cr.restored_at, cr.restore_reason,
                        c.name AS coupon_name, c.discount_type, c.discount_value,
                        u.id AS user_id, u.name AS user_name, u.email AS user_email
                   FROM coupon_redemptions cr
                   JOIN coupons c ON cr.coupon_id = c.id
                   JOIN users u ON cr.user_id = u.id
                   ${where}
                   ORDER BY cr.redeemed_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await db.execute(sql, params);
    const [cnt] = await db.execute(`SELECT COUNT(*) AS c FROM coupon_redemptions cr JOIN users u ON cr.user_id=u.id JOIN coupons c ON cr.coupon_id=c.id ${where}`, params);
    res.json({ redemptions: rows, pagination: { total: cnt[0].c, page, limit, totalPages: Math.ceil(cnt[0].c / limit) } });
  } catch (err) {
    console.error('listRedemptions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/coupons/admin/redemptions/:id/restore  { reason }
export const restoreRedemption = async (req, res) => {
  try {
    const r = await couponService.adminRestoreRedemption(req.params.id, req.body.reason);
    res.json({ message: r.restored ? 'Coupon restored successfully' : (r.reason || 'Could not restore'), ...r });
  } catch (err) {
    console.error('restoreRedemption error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- referral coupon rules ----------
// GET /api/coupons/admin/referral-rules
export const getReferralRules = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM referral_coupon_rules ORDER BY FIELD(entity_type,"user","business","company")');
    res.json(rows);
  } catch (err) {
    console.error('getReferralRules error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/coupons/admin/referral-rules/:entityType
export const updateReferralRule = async (req, res) => {
  try {
    const { entityType } = req.params;
    const b = req.body;
    const fields = [
      'referrer_discount_type', 'referrer_discount_value', 'referrer_min_order_amount', 'referrer_max_discount',
      'referred_discount_type', 'referred_discount_value', 'referred_min_order_amount', 'referred_max_discount',
      'max_referrals_per_year', 'is_active',
    ];
    const sets = [];
    const vals = [];
    fields.forEach(f => {
      if (b[f] !== undefined) {
        let v = b[f];
        if (['referrer_discount_value', 'referrer_min_order_amount', 'referrer_max_discount', 'referred_discount_value', 'referred_min_order_amount', 'referred_max_discount'].includes(f)) v = Number(v) || 0;
        if (['max_referrals_per_year', 'is_active'].includes(f)) v = Number(v);
        sets.push(`${f} = ?`); vals.push(v);
      }
    });
    if (!sets.length) return res.status(400).json({ message: 'Nothing to update' });
    sets.push('updated_at = NOW()');
    vals.push(entityType);
    await db.execute(`UPDATE referral_coupon_rules SET ${sets.join(', ')} WHERE entity_type = ?`, vals);
    // keep the linked referral templates in sync
    const [ruleRows] = await db.execute('SELECT * FROM referral_coupon_rules WHERE entity_type = ?', [entityType]);
    if (ruleRows.length) {
      for (const side of ['referrer', 'referred']) {
        await couponService.getOrCreateReferralTemplate(null, { rule: ruleRows[0], side });
      }
    }
    res.json({ message: 'Referral coupon rule updated' });
  } catch (err) {
    console.error('updateReferralRule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/coupons/admin/referral-rules/:entityType/toggle  { enabled }
export const toggleReferralCoupons = async (req, res) => {
  try {
    const { entityType } = req.params;
    const enabled = req.body.enabled ? 1 : 0;
    await db.execute('UPDATE referral_coupon_rules SET referral_coupons_enabled = ?, updated_at = NOW() WHERE entity_type = ?', [enabled, entityType]);
    res.json({ message: `Referral coupons ${enabled ? 'enabled' : 'disabled'} for ${entityType}` });
  } catch (err) {
    console.error('toggleReferralCoupons error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------- global coupon settings ----------
export const getSettings = async (req, res) => {
  try { res.json(await couponService.getAllSettings()); } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
export const updateSettings = async (req, res) => {
  try {
    const allowed = ['restore_on_cancel', 'restore_on_refund'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) await couponService.setSetting(k, req.body[k] ? '1' : '0', req.user.id);
    }
    res.json({ message: 'Settings updated', settings: await couponService.getAllSettings() });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// ── Welcome Coupon Settings ──────────────────────────────────────────────────
// GET  /api/coupons/admin/welcome-settings
export const getWelcomeSettings = async (req, res) => {
  try { res.json(await couponService.getWelcomeCouponSettings()); }
  catch (err) { console.error('getWelcomeSettings error:', err); res.status(500).json({ message: 'Server error' }); }
};

// PUT  /api/coupons/admin/welcome-settings  { enabled, couponId, roles, expiresDays }
export const updateWelcomeSettings = async (req, res) => {
  try {
    const { enabled, couponId, roles, expiresDays } = req.body;
    await couponService.setWelcomeCouponSettings({ enabled, couponId, roles, expiresDays }, req.user.id);
    res.json({ message: 'Welcome coupon settings updated', settings: await couponService.getWelcomeCouponSettings() });
  } catch (err) {
    console.error('updateWelcomeSettings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Order Completion Reward Settings ─────────────────────────────────────────
// GET  /api/coupons/admin/order-reward-settings
export const getOrderRewardSettings = async (req, res) => {
  try { res.json(await couponService.getOrderRewardSettings()); }
  catch (err) { console.error('getOrderRewardSettings error:', err); res.status(500).json({ message: 'Server error' }); }
};

// PUT  /api/coupons/admin/order-reward-settings
export const updateOrderRewardSettings = async (req, res) => {
  try {
    await couponService.setOrderRewardSettings(req.body, req.user.id);
    res.json({ message: 'Order reward settings updated', settings: await couponService.getOrderRewardSettings() });
  } catch (err) {
    console.error('updateOrderRewardSettings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
