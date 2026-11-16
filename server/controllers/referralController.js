// controllers/referralController.js
import db from '../config/db.js';

// ─── USER-FACING ────────────────────────────────────────────────────────────

/**
 * GET /api/referrals/my-code
 * Returns own referral code, share link, stats, and wallet balance.
 */
export const getMyReferralInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    // Referral code + name
    const [userRows] = await db.execute(
      'SELECT referral_code, name, role FROM users WHERE id = ?',
      [userId]
    );
    if (!userRows.length) return res.status(404).json({ message: 'User not found' });
    const { referral_code, name, role } = userRows[0];

    // Stats
    const [stats] = await db.execute(
      `SELECT
         COUNT(*)                                         AS total_referrals,
         SUM(status = 'rewarded')                        AS total_rewarded,
         SUM(status = 'pending')                         AS pending_referrals,
         SUM(status = 'rejected')                        AS rejected_referrals
       FROM referrals WHERE referrer_id = ?`,
      [userId]
    );

    // Wallet
    const [wallet] = await db.execute(
      'SELECT balance_bhd, lifetime_earned FROM referral_wallet WHERE user_id = ?',
      [userId]
    );
    const walletData = wallet[0] || { balance_bhd: 0, lifetime_earned: 0 };

    const baseUrl = process.env.FRONTEND_URL || 'https://khaleeji.app';
    const registerPath = role === 'user' ? '/user-register' : '/register';

    res.json({
      referralCode: referral_code,
      shareLink: `${baseUrl}${registerPath}?ref=${referral_code}`,
      name,
      role,
      stats: {
        totalReferrals:  Number(stats[0].total_referrals  || 0),
        totalRewarded:   Number(stats[0].total_rewarded   || 0),
        pendingReferrals:Number(stats[0].pending_referrals|| 0),
        rejectedReferrals:Number(stats[0].rejected_referrals|| 0),
      },
      wallet: {
        balanceBhd:     Number(walletData.balance_bhd),
        lifetimeEarned: Number(walletData.lifetime_earned),
      },
    });
  } catch (err) {
    console.error('getMyReferralInfo error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/referrals/history?page=1&limit=20&status=rewarded
 */
export const getReferralHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    let where = 'WHERE r.referrer_id = ?';
    const params = [userId];
    if (status) { where += ' AND r.status = ?'; params.push(status); }

    const [rows] = await db.query(
      `SELECT r.id, r.status, r.referred_role, r.created_at AS registered_at,
              r.rewarded_at, rt.amount_bhd AS reward_amount,
              u.name AS referred_name
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       LEFT JOIN referral_transactions rt
              ON rt.referral_id = r.id AND rt.user_id = r.referrer_id AND rt.type = 'credit'
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM referrals r ${where}`,
      params
    );

    res.json({
      referrals: rows,
      pagination: {
        total:      Number(countRows[0].cnt),
        page,
        limit,
        totalPages: Math.ceil(countRows[0].cnt / limit),
      },
    });
  } catch (err) {
    console.error('getReferralHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/referrals/wallet
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const [wallet] = await db.execute(
      'SELECT * FROM referral_wallet WHERE user_id = ?',
      [userId]
    );
    const walletData = wallet[0] || { balance_bhd: 0, lifetime_earned: 0, lifetime_used: 0 };

    const [txns] = await db.execute(
      `SELECT id, type, amount_bhd, balance_after, description, trigger_event, created_at
       FROM referral_transactions WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    res.json({
      balance: Number(walletData.balance_bhd),
      lifetimeEarned: Number(walletData.lifetime_earned),
      lifetimeUsed: Number(walletData.lifetime_used || 0),
      transactions: txns,
    });
  } catch (err) {
    console.error('getWallet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/referrals/validate-code
 * Public endpoint — used on registration form for inline feedback.
 */
export const validateCode = async (req, res) => {
  try {
    const { referralCode, registrantRole } = req.body;
    if (!referralCode) return res.json({ valid: false, reason: 'No code provided' });

    // 0. Check if it's the admin universal code — works for all types
    const [adminCodeRows] = await db.execute(
      "SELECT setting_value FROM referral_settings WHERE setting_key = 'admin_universal_code'"
    );
    if (adminCodeRows.length > 0 && adminCodeRows[0].setting_value === referralCode) {
      return res.json({ valid: true, referrerName: 'GSN Admin', referrerRole: 'admin', isAdminCode: true });
    }

    const [rows] = await db.execute(
      'SELECT id, name, role FROM users WHERE referral_code = ?',
      [referralCode]
    );
    if (!rows.length) {
      return res.json({ valid: false, reason: 'Referral code not found' });
    }

    const referrer = rows[0];
    // Referral codes are company-only (admin universal code handled above)
    if (referrer.role !== 'company') {
      return res.json({ valid: false, reason: 'Referral codes are only valid for company accounts' });
    }
    if (registrantRole && referrer.role !== registrantRole) {
      return res.json({
        valid: false,
        reason: `This code is for ${referrer.role} registrations only`,
        code: 'CROSS_ENTITY',
      });
    }

    res.json({ valid: true, referrerName: referrer.name, referrerRole: referrer.role });
  } catch (err) {
    console.error('validateCode error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADMIN ──────────────────────────────────────────────────────────────────

/**
 * GET /api/referrals/admin/universal-code
 * Returns the admin universal referral code.
 */
export const adminGetUniversalCode = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT setting_value FROM referral_settings WHERE setting_key = 'admin_universal_code'"
    );
    res.json({ code: rows.length > 0 ? rows[0].setting_value : null });
  } catch (err) {
    console.error('adminGetUniversalCode error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/referrals/admin/universal-code
 * Body: { code: "GSNADMINXXXX" }
 * Updates the admin universal referral code.
 */
export const adminUpdateUniversalCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim().length < 5) {
      return res.status(400).json({ message: 'Code must be at least 5 characters' });
    }
    const cleanCode = code.trim().toUpperCase();

    // Make sure it doesn't collide with an existing user's referral code
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE referral_code = ?',
      [cleanCode]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This code is already in use by a user. Choose a different one.' });
    }

    await db.execute(
      `INSERT INTO referral_settings (setting_key, setting_value)
       VALUES ('admin_universal_code', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [cleanCode]
    );

    console.log(`✅ Admin universal code updated to: ${cleanCode}`);
    res.json({ message: 'Universal code updated successfully', code: cleanCode });
  } catch (err) {
    console.error('adminUpdateUniversalCode error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/referrals/admin/all?page=1&limit=50&status=pending&role=company
 */
export const adminGetAllReferrals = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit)|| 50);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const role   = req.query.role   || null;

    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND r.status = ?'; params.push(status); }
    if (role)   { where += ' AND r.referrer_role = ?'; params.push(role); }

    const [rows] = await db.execute(
      `SELECT r.id, r.referral_code, r.status, r.referrer_role, r.referred_role,
              r.created_at, r.rewarded_at, r.rejection_reason,
              er.name AS referrer_name, er.email AS referrer_email,
              ed.name AS referred_name, ed.email AS referred_email,
              rt.amount_bhd AS reward_amount
       FROM referrals r
       JOIN users er ON r.referrer_id = er.id
       JOIN users ed ON r.referred_id = ed.id
       LEFT JOIN referral_transactions rt
              ON rt.referral_id = r.id AND rt.user_id = r.referrer_id AND rt.type='credit'
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM referrals r ${where}`,
      params
    );

    res.json({
      referrals: rows,
      pagination: {
        total:      Number(countRows[0].cnt),
        page,
        limit,
        totalPages: Math.ceil(countRows[0].cnt / limit),
      },
    });
  } catch (err) {
    console.error('adminGetAllReferrals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/referrals/admin/rules
 */
export const adminGetRules = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM referral_reward_rules ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error('adminGetRules error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/referrals/admin/rules/:entityType
 * Body: { referrerCreditBhd, referredCreditBhd, maxReferralsPerYear, isActive }
 */
export const adminUpdateRule = async (req, res) => {
  try {
    const { entityType } = req.params;
    const { referrerCreditBhd, referredCreditBhd, maxReferralsPerYear, isActive } = req.body;

    if (!['user', 'business', 'company'].includes(entityType)) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    await db.execute(
      `UPDATE referral_reward_rules
       SET referrer_credit_bhd = ?,
           referred_credit_bhd = ?,
           max_referrals_per_year = ?,
           is_active = ?,
           updated_at = NOW()
       WHERE entity_type = ?`,
      [referrerCreditBhd, referredCreditBhd, maxReferralsPerYear, isActive ? 1 : 0, entityType]
    );

    res.json({ message: `Rule for ${entityType} updated successfully` });
  } catch (err) {
    console.error('adminUpdateRule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/referrals/admin/adjust-wallet
 * Body: { userId, type: 'credit'|'debit', amountBhd, description }
 */
export const adminAdjustWallet = async (req, res) => {
  let connection;
  try {
    const { userId, type, amountBhd, description } = req.body;
    if (!userId || !type || !amountBhd) {
      return res.status(400).json({ message: 'userId, type, and amountBhd are required' });
    }
    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ message: 'type must be credit or debit' });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const delta = type === 'credit' ? Math.abs(amountBhd) : -Math.abs(amountBhd);

    // Upsert wallet
    await connection.execute(
      `INSERT INTO referral_wallet (user_id, balance_bhd, lifetime_earned, lifetime_used)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         balance_bhd     = balance_bhd + ?,
         lifetime_earned = lifetime_earned + IF(? > 0, ?, 0),
         lifetime_used   = lifetime_used   + IF(? < 0, ABS(?), 0),
         updated_at = NOW()`,
      [userId, delta, delta > 0 ? delta : 0, delta < 0 ? Math.abs(delta) : 0,
       delta, delta, delta, delta, delta]
    );

    // Snapshot balance
    const [walletRow] = await connection.execute(
      'SELECT balance_bhd FROM referral_wallet WHERE user_id = ?',
      [userId]
    );

    await connection.execute(
      `INSERT INTO referral_transactions
         (user_id, type, amount_bhd, balance_after, description, trigger_event)
       VALUES (?, ?, ?, ?, ?, 'admin_adjustment')`,
      [userId, type, Math.abs(amountBhd), walletRow[0].balance_bhd, description || 'Admin adjustment']
    );

    await connection.commit();
    res.json({ message: 'Wallet adjusted successfully', newBalance: Number(walletRow[0].balance_bhd) });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('adminAdjustWallet error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * GET /api/referrals/admin/wallets?page=1&limit=50
 */
export const adminGetWallets = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit)|| 50);
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT rw.*, u.name, u.email, u.role
       FROM referral_wallet rw
       JOIN users u ON rw.user_id = u.id
       ORDER BY rw.balance_bhd DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM referral_wallet');

    res.json({
      wallets: rows,
      pagination: {
        total:      Number(countRows[0].cnt),
        page,
        limit,
        totalPages: Math.ceil(countRows[0].cnt / limit),
      },
    });
  } catch (err) {
    console.error('adminGetWallets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
