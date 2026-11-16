// services/couponService.js
// Core coupon engine: templates, issuing, validation, locking/redemption, restoration.
import db from '../config/db.js';

// ---------- helpers ----------
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars

export function generateCouponCode(prefix = 'GSN') {
  let code = '';
  for (let i = 0; i < 8; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${prefix}-${code}`;
}

const round3 = (n) => Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;

// Convert any incoming datetime value (ISO string, datetime-local string, or Date)
// to MySQL 'YYYY-MM-DD HH:MM:SS', or null when empty/invalid. Avoids the
// ER_TRUNCATED_WRONG_VALUE error on TIMESTAMP/DATETIME columns.
function toMySQLDateTime(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())} ${p(v.getUTCHours())}:${p(v.getUTCMinutes())}:${p(v.getUTCSeconds())}`;
  }
  let s = String(v).trim();
  if (!s) return null;
  s = s.replace('T', ' ');
  // drop fractional seconds and any trailing timezone marker (.000Z / +00:00 / Z)
  s = s.replace(/\.\d+.*$/, '').replace(/[Zz]\s*$/, '').replace(/[+-]\d{2}:?\d{2}$/, '').trim();
  const parts = s.split(' ');
  if (parts[1] && parts[1].split(':').length === 2) s = `${parts[0]} ${parts[1]}:00`;
  return s || null;
}

// Generate a unique user-coupon instance code
async function uniqueInstanceCode(conn, prefix) {
  const exec = conn ? conn.execute.bind(conn) : db.execute.bind(db);
  for (let i = 0; i < 12; i++) {
    const code = generateCouponCode(prefix);
    const [rows] = await exec('SELECT 1 FROM user_coupons WHERE code = ? LIMIT 1', [code]);
    if (!rows.length) return code;
  }
  throw new Error('Could not generate a unique coupon code');
}

// Generate a unique template code (checks coupons + user_coupons)
async function uniqueTemplateCode() {
  for (let i = 0; i < 12; i++) {
    const code = generateCouponCode('CPN');
    const [rows] = await db.execute(
      'SELECT 1 FROM coupons WHERE code = ? UNION SELECT 1 FROM user_coupons WHERE code = ? LIMIT 1',
      [code, code]
    );
    if (!rows.length) return code;
  }
  throw new Error('Could not generate a unique coupon code');
}

// ---------- discount calculation ----------
export function computeDiscount(discountType, discountValue, orderAmount, maxDiscount = 0, minOrder = 0) {
  const amt = Number(orderAmount) || 0;
  if (amt < 0) return { valid: false, reason: 'Invalid order amount' };
  if (Number(minOrder) > 0 && amt < Number(minOrder)) {
    return { valid: false, reason: `Minimum order amount is ${Number(minOrder).toFixed(3)} BHD` };
  }
  let discount = 0;
  if (discountType === 'fixed') {
    discount = Number(discountValue) || 0;
  } else if (discountType === 'percentage') {
    const pct = Number(discountValue) || 0;
    discount = (amt * pct) / 100;
    if (Number(maxDiscount) > 0 && discount > Number(maxDiscount)) discount = Number(maxDiscount);
  }
  // final payable must never be negative
  if (discount > amt) discount = amt;
  if (discount < 0) discount = 0;
  return { valid: true, orderAmount: round3(amt), discountAmount: round3(discount), finalAmount: round3(amt - discount) };
}

// ---------- resolve + validate (preview, no consume) ----------
export async function resolveUserCoupon(userId, identifier) {
  const byId = !isNaN(Number(identifier)) && String(identifier).length < 12;
  const sql = byId
    ? `SELECT uc.*, c.discount_type AS c_discount_type, c.discount_value AS c_discount_value,
              c.min_order_amount, c.max_discount_amount, c.valid_from, c.valid_to, c.is_active, c.name AS coupon_name
         FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? AND uc.id = ? LIMIT 1`
    : `SELECT uc.*, c.discount_type AS c_discount_type, c.discount_value AS c_discount_value,
              c.min_order_amount, c.max_discount_amount, c.valid_from, c.valid_to, c.is_active, c.name AS coupon_name
         FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? AND uc.code = ? LIMIT 1`;
  const [rows] = await db.execute(sql, [userId, identifier]);
  if (!rows.length) return null;
  const r = rows[0];
  // normalise for downstream use
  return {
    ...r,
    discount_type: r.c_discount_type,
    discount_value: r.c_discount_value,
  };
}

function checkUsability(uc) {
  if (uc.status === 'used') return 'This coupon has already been used';
  if (uc.status === 'disabled') return 'This coupon is disabled';
  if (uc.status === 'expired') return 'This coupon has expired';
  if (uc.expires_at && new Date(uc.expires_at) < new Date()) return 'This coupon has expired';
  if (!uc.is_active) return 'This coupon is no longer active';
  const now = new Date();
  // Only block if valid_from is more than 5 minutes in the future (handles clock drift /
  // accidental same-day timestamps stored when admin left the field at current time)
  if (uc.valid_from) {
    const vf = new Date(uc.valid_from);
    if (vf - now > 5 * 60 * 1000) return 'This coupon is not yet valid';
  }
  if (uc.valid_to && new Date(uc.valid_to) < now) return 'This coupon has expired';
  return null;
}

export async function validateForOrder({ userId, identifier, orderAmount }) {
  const uc = await resolveUserCoupon(userId, identifier);
  if (!uc) return { valid: false, reason: 'Coupon not found or not assigned to you' };
  const blocked = checkUsability(uc);
  if (blocked) return { valid: false, reason: blocked, userCouponId: uc.id };
  const calc = computeDiscount(uc.discount_type, uc.discount_value, orderAmount, uc.max_discount_amount, uc.min_order_amount);
  if (!calc.valid) return { valid: false, reason: calc.reason, userCouponId: uc.id };
  return {
    valid: true,
    userCouponId: uc.id,
    couponId: uc.coupon_id,
    code: uc.code,
    name: uc.coupon_name,
    discountType: uc.discount_type,
    discountValue: Number(uc.discount_value),
    orderAmount: calc.orderAmount,
    discountAmount: calc.discountAmount,
    finalAmount: calc.finalAmount,
  };
}

// ---------- lock (apply) at payment initiation ----------
// Marks the user_coupon as used (locked) and creates a pending redemption.
// Idempotent for the same (user_coupon, orderType, orderRefId).
export async function lockForOrder({ userId, identifier, orderType, orderRefId, orderAmount }) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const byId = !isNaN(Number(identifier)) && String(identifier).length < 12;
    const sql = byId
      ? `SELECT uc.*, c.discount_type AS c_discount_type, c.discount_value AS c_discount_value,
                c.min_order_amount, c.max_discount_amount, c.valid_from, c.valid_to, c.is_active
           FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
          WHERE uc.user_id = ? AND uc.id = ? FOR UPDATE`
      : `SELECT uc.*, c.discount_type AS c_discount_type, c.discount_value AS c_discount_value,
                c.min_order_amount, c.max_discount_amount, c.valid_from, c.valid_to, c.is_active
           FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
          WHERE uc.user_id = ? AND uc.code = ? FOR UPDATE`;
    const [rows] = await connection.execute(sql, [userId, identifier]);
    if (!rows.length) throw new Error('Coupon not found or not assigned to you');
    const uc = { ...rows[0], discount_type: rows[0].c_discount_type, discount_value: rows[0].c_discount_value };

    // idempotent: same order already has a pending redemption
    const [existing] = await connection.execute(
      `SELECT * FROM coupon_redemptions WHERE user_coupon_id = ? AND order_type = ? AND order_id = ? AND payment_status = 'pending' ORDER BY id DESC LIMIT 1`,
      [uc.id, orderType || '', orderRefId ? String(orderRefId) : '']
    );
    const calc = computeDiscount(uc.discount_type, uc.discount_value, orderAmount, uc.max_discount_amount, uc.min_order_amount);
    if (!calc.valid) throw new Error(calc.reason);
    if (existing.length) {
      await connection.commit();
      return { redemptionId: existing[0].id, userCouponId: uc.id, code: uc.code, idempotent: true, ...calc };
    }

    const blocked = checkUsability(uc);
    if (blocked) throw new Error(blocked);

    // lock the coupon
    await connection.execute(`UPDATE user_coupons SET status = 'used', updated_at = NOW() WHERE id = ?`, [uc.id]);
    const [res] = await connection.execute(
      `INSERT INTO coupon_redemptions (user_coupon_id, coupon_id, user_id, order_id, order_type, order_amount, discount_amount, final_amount, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'completed')`,
      [uc.id, uc.coupon_id, userId, orderRefId ? String(orderRefId) : null, orderType || null, calc.orderAmount, calc.discountAmount, calc.finalAmount]
    );
    await connection.execute(`UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?`, [uc.coupon_id]);

    await connection.commit();
    return { redemptionId: res.insertId, userCouponId: uc.id, code: uc.code, ...calc };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// ---------- confirm on payment success ----------
export async function confirmRedemption(redemptionId) {
  if (!redemptionId) return;
  await db.execute(
    `UPDATE coupon_redemptions SET payment_status = 'completed' WHERE id = ? AND payment_status = 'pending'`,
    [redemptionId]
  );
}

// ---------- consume at order completion (idempotent) ----------
// Ensures a coupon is marked as used and linked to the settled order.
// Used at approval time so a coupon is never left "available" when the
// discount has actually been given (e.g. PayPal capture where the
// client-side lock did not run).
export async function consumeForOrder({ userId, identifier, orderType, orderRefId, orderAmount, discountAmount, finalAmount }) {
  if (!identifier) return { consumed: false };
  const uc = await resolveUserCoupon(userId, identifier);
  if (!uc) return { consumed: false, reason: 'Coupon not found' };

  const ref = orderRefId != null ? String(orderRefId) : null;

  // A non-restored redemption already exists (locked at payment time) -> confirm it.
  const [existing] = await db.execute(
    `SELECT * FROM coupon_redemptions WHERE user_coupon_id = ? AND status <> 'restored' ORDER BY id DESC LIMIT 1`,
    [uc.id]
  );
  if (existing.length) {
    await db.execute(
      `UPDATE coupon_redemptions
          SET order_id = COALESCE(?, order_id),
              order_type = COALESCE(?, order_type),
              payment_status = 'completed', status = 'completed'
        WHERE id = ?`,
      [ref, orderType || null, existing[0].id]
    );
    await db.execute(
      `UPDATE user_coupons SET status = 'used', redeemed_at = COALESCE(redeemed_at, NOW()), updated_at = NOW() WHERE id = ?`,
      [uc.id]
    );
    return { consumed: true, redemptionId: existing[0].id, idempotent: true };
  }

  // No lock exists (coupon still available) -> consume it now.
  const calc = computeDiscount(uc.discount_type, uc.discount_value, orderAmount, uc.max_discount_amount, uc.min_order_amount);
  const disc = discountAmount != null ? Number(discountAmount) : calc.discountAmount;
  const amt = Number(orderAmount) || 0;
  const final = finalAmount != null ? Number(finalAmount) : (amt - disc);

  await db.execute(
    `UPDATE user_coupons
        SET status = 'used', redeemed_at = NOW(), order_type = ?, order_amount = ?, discount_applied = ?, updated_at = NOW()
      WHERE id = ?`,
    [orderType || null, amt, disc, uc.id]
  );
  const [res] = await db.execute(
    `INSERT INTO coupon_redemptions (user_coupon_id, coupon_id, user_id, order_id, order_type, order_amount, discount_amount, final_amount, payment_status, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'completed')`,
    [uc.id, uc.coupon_id, userId, ref, orderType || null, amt, disc, final]
  );
  await db.execute(`UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?`, [uc.coupon_id]);
  return { consumed: true, redemptionId: res.insertId };
}

// ---------- internal restore ----------
async function doRestore(connection, redemptionId, reason, paymentStatus) {
  const [rows] = await connection.execute('SELECT * FROM coupon_redemptions WHERE id = ? FOR UPDATE', [redemptionId]);
  if (!rows.length) { await connection.commit(); return false; }
  const r = rows[0];
  await connection.execute(`UPDATE user_coupons SET status = 'available', redeemed_at = NULL, updated_at = NOW() WHERE id = ?`, [r.user_coupon_id]);
  await connection.execute(
    `UPDATE coupon_redemptions SET payment_status = ?, status = 'restored', restored_at = NOW(), restore_reason = ? WHERE id = ?`,
    [paymentStatus, reason || null, r.id]
  );
  await connection.execute(`UPDATE coupons SET uses_count = GREATEST(uses_count - 1, 0) WHERE id = ?`, [r.coupon_id]);
  return true;
}

// ---------- release on failure / cancel (before success) ----------
export async function releaseRedemption({ redemptionId, reason }) {
  if (!redemptionId) return false;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const ok = await doRestore(connection, redemptionId, reason, 'cancelled');
    await connection.commit();
    return ok;
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// release by order — used by subscription reject
export async function releaseByOrder({ orderType, orderRefId, reason }) {
  const [rows] = await db.execute(
    `SELECT id FROM coupon_redemptions WHERE order_type = ? AND order_id = ? AND payment_status = 'pending' ORDER BY id DESC LIMIT 1`,
    [orderType, String(orderRefId)]
  );
  if (!rows.length) return false;
  return releaseRedemption({ redemptionId: rows[0].id, reason });
}

// ---------- restore on refund/cancel after success (policy-gated) ----------
export async function restoreOnRefund({ redemptionId, reason }) {
  const enabled = await getSetting('restore_on_refund');
  if (enabled !== '1') return { restored: false, reason: 'Coupon restoration on refund is disabled by policy' };
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const ok = await doRestore(connection, redemptionId, reason, 'refunded');
    await connection.commit();
    return ok ? { restored: true } : { restored: false, reason: 'Redemption not found' };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// ---------- admin forced restore (always allowed, explicit action) ----------
export async function adminRestoreRedemption(redemptionId, reason) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT * FROM coupon_redemptions WHERE id = ? FOR UPDATE', [redemptionId]);
    if (!rows.length) { await connection.commit(); return { restored: false, reason: 'Redemption not found' }; }
    const r = rows[0];
    // bring the coupon back to available (even if it was completed)
    await connection.execute(`UPDATE user_coupons SET status = 'available', redeemed_at = NULL, updated_at = NOW() WHERE id = ?`, [r.user_coupon_id]);
    await connection.execute(
      `UPDATE coupon_redemptions SET status = 'restored', restored_at = NOW(), restore_reason = ? WHERE id = ?`,
      [reason || 'Admin manual restore', r.id]
    );
    await connection.execute(`UPDATE coupons SET uses_count = GREATEST(uses_count - 1, 0) WHERE id = ?`, [r.coupon_id]);
    await connection.commit();
    return { restored: true };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// ---------- settings ----------
export async function getSetting(key) {
  const [rows] = await db.execute('SELECT setting_value FROM coupon_settings WHERE setting_key = ? LIMIT 1', [key]);
  return rows.length ? rows[0].setting_value : null;
}
export async function getAllSettings() {
  const [rows] = await db.execute('SELECT setting_key, setting_value, updated_at FROM coupon_settings ORDER BY setting_key');
  const out = {};
  rows.forEach(r => (out[r.setting_key] = r.setting_value));
  return out;
}
export async function setSetting(key, value, adminId) {
  await db.execute(
    `INSERT INTO coupon_settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by), updated_at = NOW()`,
    [key, String(value), adminId || null]
  );
}

// ---------- coupon templates (admin) ----------
export async function createCouponTemplate(data, adminId) {
  const { name, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_to, max_uses_total } = data;
  if (!name || !discount_type || discount_value == null) throw new Error('name, discount_type and discount_value are required');
  const code = await uniqueTemplateCode();
  const [res] = await db.execute(
    `INSERT INTO coupons (code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_to, max_uses_total, is_active, source, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'admin', ?)`,
    [code, name, description || null, discount_type, Number(discount_value), Number(min_order_amount) || 0, Number(max_discount_amount) || 0, toMySQLDateTime(valid_from), toMySQLDateTime(valid_to), Number(max_uses_total) || 0, adminId]
  );
  return res.insertId;
}

export async function updateCouponTemplate(id, data) {
  const fields = ['name', 'description', 'discount_type', 'discount_value', 'min_order_amount', 'max_discount_amount', 'valid_from', 'valid_to', 'max_uses_total'];
  const sets = [];
  const vals = [];
  fields.forEach(f => {
    if (data[f] !== undefined) {
      let v = data[f];
      if (['valid_from', 'valid_to'].includes(f)) v = toMySQLDateTime(v);
      if (['discount_value', 'min_order_amount', 'max_discount_amount'].includes(f)) v = Number(v) || 0;
      if (v === '') v = null;
      sets.push(`${f} = ?`);
      vals.push(v);
    }
  });
  if (!sets.length) return false;
  sets.push('updated_at = NOW()');
  vals.push(id);
  await db.execute(`UPDATE coupons SET ${sets.join(', ')} WHERE id = ?`, vals);
  return true;
}

export async function setTemplateActive(id, isActive) {
  await db.execute('UPDATE coupons SET is_active = ?, updated_at = NOW() WHERE id = ?', [isActive ? 1 : 0, id]);
}

export async function deleteCouponTemplate(id) {
  // only allow deleting admin templates with no issued instances, to keep history intact
  const [issued] = await db.execute('SELECT 1 FROM user_coupons WHERE coupon_id = ? LIMIT 1', [id]);
  if (issued.length) {
    // soft-disable instead of hard delete
    await setTemplateActive(id, false);
    return { soft: true };
  }
  await db.execute('DELETE FROM coupons WHERE id = ? AND source = "admin"', [id]);
  return { soft: false };
}

export async function listTemplates({ search = '', status = '' } = {}) {
  let sql = `SELECT * FROM coupons WHERE source = 'admin'`;
  const params = [];
  if (search) {
    sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status === 'active') sql += ' AND is_active = 1';
  if (status === 'inactive') sql += ' AND is_active = 0';
  sql += ' ORDER BY created_at DESC';
  const [rows] = await db.execute(sql, params);
  return rows;
}

// ---------- issue a coupon instance to a user ----------
export async function issueCouponInstance(conn, opts) {
  const exec = conn ? conn.execute.bind(conn) : db.execute.bind(db);
  const { couponId, userId, source, issuedBy, reason, sourceRefId, expiresAt } = opts;
  if (!couponId || !userId) throw new Error('couponId and userId are required');
  const code = await uniqueInstanceCode(conn, source === 'referral' ? 'REF' : 'GSN');
  const [res] = await exec(
    `INSERT INTO user_coupons (coupon_id, user_id, code, status, source, source_ref_id, issued_by, issued_reason, expires_at)
     VALUES (?, ?, ?, 'available', ?, ?, ?, ?, ?)`,
    [couponId, userId, code, source || 'manual', sourceRefId || null, issuedBy || null, reason || null, toMySQLDateTime(expiresAt)]
  );
  return res.insertId;
}

// ---------- referral coupon templates ----------
export async function getOrCreateReferralTemplate(conn, { rule, side }) {
  const exec = conn ? conn.execute.bind(conn) : db.execute.bind(conn || db);
  const dType = side === 'referrer' ? rule.referrer_discount_type : rule.referred_discount_type;
  const dVal = side === 'referrer' ? rule.referrer_discount_value : rule.referred_discount_value;
  const minOrd = side === 'referrer' ? rule.referrer_min_order_amount : rule.referred_min_order_amount;
  const maxD = side === 'referrer' ? rule.referrer_max_discount : rule.referred_max_discount;
  const name = `Referral Reward (${side === 'referrer' ? 'Referrer' : 'New User'})`;

  const [rows] = await exec(
    `SELECT id FROM coupons WHERE source = 'referral' AND source_ref_id = ? AND source_side = ? LIMIT 1`,
    [rule.id, side]
  );
  if (rows.length) {
    await exec(
      `UPDATE coupons SET discount_type = ?, discount_value = ?, min_order_amount = ?, max_discount_amount = ?, name = ?, is_active = 1, updated_at = NOW() WHERE id = ?`,
      [dType, dVal, minOrd, maxD, name, rows[0].id]
    );
    return rows[0].id;
  }
  const code = await uniqueTemplateCode();
  const [res] = await exec(
    `INSERT INTO coupons (code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, source, source_ref_id, source_side)
     VALUES (?, ?, 'Auto-issued referral reward coupon', ?, ?, ?, ?, 1, 'referral', ?, ?)`,
    [code, name, dType, dVal, minOrd, maxD, rule.id, side]
  );
  return res.insertId;
}

// ---------- stale expiry pass ----------
export async function expireStaleCoupons(userId) {
  const where = userId
    ? `WHERE uc.status = 'available' AND uc.user_id = ? AND ((uc.expires_at IS NOT NULL AND uc.expires_at < NOW()) OR (c.valid_to IS NOT NULL AND c.valid_to < NOW()))`
    : `WHERE uc.status = 'available' AND ((uc.expires_at IS NOT NULL AND uc.expires_at < NOW()) OR (c.valid_to IS NOT NULL AND c.valid_to < NOW()))`;
  const sql = `UPDATE user_coupons uc JOIN coupons c ON uc.coupon_id = c.id SET uc.status = 'expired', uc.updated_at = NOW() ${where}`;
  await db.execute(sql, userId ? [userId] : []);
}

// ---------- welcome coupon (auto-issue on new registration) ----------
export async function issueWelcomeCoupon(userId, userRole) {
  try {
    const [enabled, couponId, rolesRaw, expiresDays] = await Promise.all([
      getSetting('welcome_coupon_enabled'),
      getSetting('welcome_coupon_id'),
      getSetting('welcome_coupon_roles'),
      getSetting('welcome_coupon_expires_days'),
    ]);
    if (enabled !== '1') return;
    if (!couponId) return;

    const allowedRoles = (rolesRaw || 'user,business,company').split(',').map(s => s.trim());
    if (!allowedRoles.includes(userRole)) return;

    // verify the coupon template exists and is active
    const [rows] = await db.execute('SELECT id, is_active FROM coupons WHERE id = ?', [couponId]);
    if (!rows.length || !rows[0].is_active) return;

    // don't double-issue to the same user
    const [existing] = await db.execute(
      'SELECT 1 FROM user_coupons WHERE coupon_id = ? AND user_id = ? LIMIT 1',
      [couponId, userId]
    );
    if (existing.length) return;

    const expiresAt = expiresDays && Number(expiresDays) > 0
      ? new Date(Date.now() + Number(expiresDays) * 86400 * 1000)
      : null;

    await issueCouponInstance(null, {
      couponId,
      userId,
      source: 'admin_bonus',
      reason: 'Welcome coupon for new member',
      expiresAt: expiresAt ? toMySQLDateTime(expiresAt) : null,
    });
    console.log(`🎟️  Welcome coupon issued to user ${userId} (${userRole})`);
  } catch (err) {
    console.error('❌ issueWelcomeCoupon error:', err);
  }
}

// Get the full welcome-coupon config block in one call
export async function getWelcomeCouponSettings() {
  const [rows] = await db.execute(
    `SELECT setting_key, setting_value FROM coupon_settings
     WHERE setting_key IN ('welcome_coupon_enabled','welcome_coupon_id','welcome_coupon_roles','welcome_coupon_expires_days')`
  );
  const s = {};
  rows.forEach(r => (s[r.setting_key] = r.setting_value));
  return {
    enabled:     s.welcome_coupon_enabled === '1',
    couponId:    s.welcome_coupon_id ? Number(s.welcome_coupon_id) : null,
    roles:       (s.welcome_coupon_roles || 'user,business,company').split(',').map(x => x.trim()),
    expiresDays: Number(s.welcome_coupon_expires_days || 30),
  };
}

export async function setWelcomeCouponSettings({ enabled, couponId, roles, expiresDays }, adminId) {
  const pairs = [
    ['welcome_coupon_enabled',      enabled ? '1' : '0'],
    ['welcome_coupon_id',           couponId != null ? String(couponId) : ''],
    ['welcome_coupon_roles',        Array.isArray(roles) ? roles.join(',') : (roles || 'user,business,company')],
    ['welcome_coupon_expires_days', String(Number(expiresDays) || 30)],
  ];
  for (const [k, v] of pairs) await setSetting(k, v, adminId);
}

// ---------- order completion reward coupons ----------
export async function issueOrderCompletionCoupons(quoteId, userId, companyId) {
  try {
    const [enabled, userCouponId, companyCouponId, expiresDays, maxPerUser] = await Promise.all([
      getSetting('order_reward_enabled'),
      getSetting('order_reward_user_coupon_id'),
      getSetting('order_reward_company_coupon_id'),
      getSetting('order_reward_expires_days'),
      getSetting('order_reward_max_per_user'),
    ]);

    if (enabled !== '1') return;

    const expDays = Number(expiresDays) || 30;
    const expiresAt = expDays > 0
      ? toMySQLDateTime(new Date(Date.now() + expDays * 86400 * 1000))
      : null;

    // helper: check max per user cap before issuing
    const canIssue = async (couponId, uid) => {
      if (!couponId) return false;
      const [tpl] = await db.execute('SELECT id, is_active FROM coupons WHERE id = ?', [couponId]);
      if (!tpl.length || !tpl[0].is_active) return false;
      const max = Number(maxPerUser) || 0;
      if (max > 0) {
        const [cnt] = await db.execute(
          'SELECT COUNT(*) AS c FROM user_coupons WHERE coupon_id = ? AND user_id = ?',
          [couponId, uid]
        );
        if (cnt[0].c >= max) return false;
      }
      return true;
    };

    // Issue to the user/business who placed the order
    if (userId && userCouponId && await canIssue(userCouponId, userId)) {
      await issueCouponInstance(null, {
        couponId: userCouponId,
        userId,
        source: 'admin_bonus',
        reason: `Order completion reward — Quote #${quoteId}`,
        expiresAt,
      });
      console.log(`🎟️  Order reward coupon issued to user ${userId} for quote #${quoteId}`);
    }

    // Issue to the company that fulfilled the order
    if (companyId && companyCouponId && await canIssue(companyCouponId, companyId)) {
      await issueCouponInstance(null, {
        couponId: companyCouponId,
        userId: companyId,
        source: 'admin_bonus',
        reason: `Order completion reward — Quote #${quoteId}`,
        expiresAt,
      });
      console.log(`🎟️  Order reward coupon issued to company ${companyId} for quote #${quoteId}`);
    }
  } catch (err) {
    console.error('❌ issueOrderCompletionCoupons error:', err);
  }
}

// Get order reward coupon settings in one call
export async function getOrderRewardSettings() {
  const [rows] = await db.execute(
    `SELECT setting_key, setting_value FROM coupon_settings
     WHERE setting_key IN ('order_reward_enabled','order_reward_user_coupon_id',
       'order_reward_company_coupon_id','order_reward_expires_days','order_reward_max_per_user')`
  );
  const s = {};
  rows.forEach(r => (s[r.setting_key] = r.setting_value));
  return {
    enabled:          s.order_reward_enabled === '1',
    userCouponId:     s.order_reward_user_coupon_id ? Number(s.order_reward_user_coupon_id) : null,
    companyCouponId:  s.order_reward_company_coupon_id ? Number(s.order_reward_company_coupon_id) : null,
    expiresDays:      Number(s.order_reward_expires_days || 30),
    maxPerUser:       Number(s.order_reward_max_per_user || 0),
  };
}

export async function setOrderRewardSettings({ enabled, userCouponId, companyCouponId, expiresDays, maxPerUser }, adminId) {
  const pairs = [
    ['order_reward_enabled',          enabled ? '1' : '0'],
    ['order_reward_user_coupon_id',   userCouponId != null ? String(userCouponId) : ''],
    ['order_reward_company_coupon_id',companyCouponId != null ? String(companyCouponId) : ''],
    ['order_reward_expires_days',     String(Number(expiresDays) || 30)],
    ['order_reward_max_per_user',     String(Number(maxPerUser) || 0)],
  ];
  for (const [k, v] of pairs) await setSetting(k, v, adminId);
}

export default {
  computeDiscount, validateForOrder, lockForOrder, confirmRedemption, consumeForOrder,
  releaseRedemption, releaseByOrder, restoreOnRefund, adminRestoreRedemption,
  getSetting, getAllSettings, setSetting,
  createCouponTemplate, updateCouponTemplate, setTemplateActive, deleteCouponTemplate, listTemplates,
  issueCouponInstance, getOrCreateReferralTemplate, expireStaleCoupons, resolveUserCoupon,
  issueWelcomeCoupon, getWelcomeCouponSettings, setWelcomeCouponSettings,
  issueOrderCompletionCoupons, getOrderRewardSettings, setOrderRewardSettings,
};
