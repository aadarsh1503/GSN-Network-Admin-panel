// services/walletService.js
// Company Wallet & Referral Reward System — core ledger + configuration.
//
// The wallet reuses referral_wallet (balance) + referral_transactions (immutable
// ledger). Every balance change goes through credit()/debit() so the ledger and
// the balance can never drift apart, and every row carries a transaction ref.

import db from '../config/db.js';

// ─── Configuration ──────────────────────────────────────────────────────────

const SETTING_KEYS = {
  referralEnabled:            'referral_enabled',
  registrationRewardEnabled:  'registration_reward_enabled',
  registrationRewardType:     'registration_reward_type',
  registrationRewardValue:    'registration_reward_value',
  registrationReferredRewardValue: 'registration_referred_reward_value',
  welcomeBonusEnabled:        'welcome_bonus_enabled',
  welcomeBonusValue:          'welcome_bonus_value',
  subscriptionRewardEnabled:  'subscription_reward_enabled',
  subscriptionRewardType:     'subscription_reward_type',
  subscriptionRewardValue:    'subscription_reward_value',
  maxReferralsPerYear:        'max_referrals_per_year',
  walletSubscriptionEnabled:  'wallet_subscription_enabled',
  walletMinUsageBhd:          'wallet_min_usage_bhd',
  walletMaxUsagePercent:      'wallet_max_usage_percent',
  minTopupBhd:                'min_topup_bhd',
  minTopupUsd:                'min_topup_usd',
  maxTopupBhd:                'max_topup_bhd',
};

const DEFAULTS = {
  referralEnabled: true,
  registrationRewardEnabled: false,
  registrationRewardType: 'fixed',
  registrationRewardValue: 0,
  registrationReferredRewardValue: 0,
  welcomeBonusEnabled: false,
  welcomeBonusValue: 0,
  subscriptionRewardEnabled: true,
  subscriptionRewardType: 'fixed',
  subscriptionRewardValue: 8,
  maxReferralsPerYear: 50,
  walletSubscriptionEnabled: true,
  walletMinUsageBhd: 0,
  walletMaxUsagePercent: 100,
  minTopupBhd: 1,
  // Hard floor in USD: a top-up is never allowed below this, whatever the BHD
  // minimum says. Keeps small, fee-eating top-ups out of the system.
  minTopupUsd: 100,
  maxTopupBhd: 5000,
};

const NUMERIC_KEYS = new Set([
  'registrationRewardValue', 'registrationReferredRewardValue', 'subscriptionRewardValue', 'maxReferralsPerYear',
  'walletMinUsageBhd', 'walletMaxUsagePercent', 'minTopupBhd', 'minTopupUsd', 'maxTopupBhd', 'welcomeBonusValue',
]);
const BOOLEAN_KEYS = new Set([
  'referralEnabled', 'registrationRewardEnabled', 'subscriptionRewardEnabled',
  'walletSubscriptionEnabled', 'welcomeBonusEnabled',
]);

/** Read all wallet/referral configuration as a typed object. */
export const getSettings = async () => {
  const byKey = Object.fromEntries(Object.entries(SETTING_KEYS).map(([k, v]) => [v, k]));
  const out = { ...DEFAULTS };
  try {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM wallet_settings');
    rows.forEach(({ setting_key, setting_value }) => {
      const key = byKey[setting_key];
      if (!key) return;
      if (BOOLEAN_KEYS.has(key)) out[key] = setting_value === '1' || setting_value === 'true';
      else if (NUMERIC_KEYS.has(key)) out[key] = Number(setting_value);
      else out[key] = setting_value;
    });
  } catch { /* table missing → defaults */ }
  return out;
};

/** Persist a partial config update. Unknown keys are ignored. */
export const updateSettings = async (patch = {}, adminId = null) => {
  const entries = Object.entries(patch).filter(([k]) => SETTING_KEYS[k] !== undefined);
  if (!entries.length) return getSettings();

  for (const [key, raw] of entries) {
    let value;
    if (BOOLEAN_KEYS.has(key)) value = raw ? '1' : '0';
    else if (NUMERIC_KEYS.has(key)) value = String(Number(raw) || 0);
    else value = String(raw);

    await db.execute(
      `INSERT INTO wallet_settings (setting_key, setting_value, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      [SETTING_KEYS[key], value, adminId]
    );
  }
  return getSettings();
};

// ─── Ledger primitives ──────────────────────────────────────────────────────

export const genRef = (prefix = 'WTX') =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const withTx = async (conn, fn) => {
  if (conn) return fn(conn);
  const c = await db.getConnection();
  await c.beginTransaction();
  try {
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
};

export class WalletError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const ensureRow = async (conn, userId) => {
  await conn.execute(
    `INSERT INTO referral_wallet (user_id, balance_bhd, lifetime_earned, lifetime_used)
     VALUES (?, 0, 0, 0)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId]
  );
};

const recordTx = async (conn, tx) => {
  const [r] = await conn.execute(
    `INSERT INTO referral_transactions
       (referral_id, user_id, type, amount_bhd, balance_after, description,
        trigger_event, trigger_ref_id, transaction_ref, status, method, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.referralId || null, tx.userId, tx.type, tx.amount, tx.balanceAfter,
      tx.description || null, tx.triggerEvent || null, tx.triggerRefId || null,
      tx.ref, tx.status || 'completed', tx.method || null, tx.createdBy || null,
    ]
  );
  return r.insertId;
};

/** Add funds to a wallet and record the ledger entry. */
export const credit = async ({
  userId, amount, type = 'credit', description = null, triggerEvent = null,
  triggerRefId = null, referralId = null, method = null,
  status = 'completed', createdBy = null, conn = null,
}) => {
  const amt = Number(amount);
  if (!userId) throw new WalletError('userId is required', 'BAD_REQUEST');
  if (!(amt > 0)) throw new WalletError('Credit amount must be greater than zero', 'BAD_REQUEST');
  const ref = genRef('WCR');

  return withTx(conn, async (c) => {
    await ensureRow(c, userId);
    await c.execute(
      `UPDATE referral_wallet
       SET balance_bhd = balance_bhd + ?, lifetime_earned = lifetime_earned + ?, updated_at = NOW()
       WHERE user_id = ?`,
      [amt, amt, userId]
    );
    const [w] = await c.execute('SELECT balance_bhd FROM referral_wallet WHERE user_id = ?', [userId]);
    const balanceAfter = Number(w[0].balance_bhd);
    const transactionId = await recordTx(c, {
      userId, type, amount: amt, balanceAfter, description, triggerEvent,
      triggerRefId, referralId, ref, method, status, createdBy,
    });
    return { balanceAfter, transactionId, ref };
  });
};

/** Deduct funds from a wallet. Never allows the balance to go negative. */
export const debit = async ({
  userId, amount, type = 'debit', description = null, triggerEvent = null,
  triggerRefId = null, referralId = null, method = null,
  status = 'completed', createdBy = null, conn = null,
}) => {
  const amt = Number(amount);
  if (!userId) throw new WalletError('userId is required', 'BAD_REQUEST');
  if (!(amt > 0)) throw new WalletError('Debit amount must be greater than zero', 'BAD_REQUEST');
  const ref = genRef('WDB');

  return withTx(conn, async (c) => {
    await ensureRow(c, userId);
    const [res] = await c.execute(
      `UPDATE referral_wallet
       SET balance_bhd = balance_bhd - ?, lifetime_used = lifetime_used + ?, updated_at = NOW()
       WHERE user_id = ? AND balance_bhd >= ?`,
      [amt, amt, userId, amt]
    );
    if (res.affectedRows === 0) {
      throw new WalletError('Insufficient wallet balance', 'INSUFFICIENT_FUNDS');
    }
    const [w] = await c.execute('SELECT balance_bhd FROM referral_wallet WHERE user_id = ?', [userId]);
    const balanceAfter = Number(w[0].balance_bhd);
    const transactionId = await recordTx(c, {
      userId, type, amount: amt, balanceAfter, description, triggerEvent,
      triggerRefId, referralId, ref, method, status, createdBy,
    });
    return { balanceAfter, transactionId, ref };
  });
};

/** Current wallet snapshot for a user. */
export const getWallet = async (userId) => {
  const [rows] = await db.execute('SELECT * FROM referral_wallet WHERE user_id = ?', [userId]);
  const w = rows[0] || {};
  return {
    userId: Number(userId),
    balance: Number(w.balance_bhd || 0),
    lifetimeEarned: Number(w.lifetime_earned || 0),
    lifetimeUsed: Number(w.lifetime_used || 0),
  };
};

/**
 * Credit a referral reward to the referring company's wallet.
 * Company-only, event-config driven, and fully idempotent:
 * each referral can be rewarded at most once per event.
 *
 * @param {number} referredId  the referred company's user id
 * @param {'registration'|'subscription_approved'} event
 * @param {{ baseAmount?: number }} [opts] base for percentage rewards
 */
export const awardReferralReward = async (referredId, event, opts = {}) => {
  try {
    const settings = await getSettings();
    if (!settings.referralEnabled) return null;

    const isRegistration = event === 'registration';
    if (isRegistration && !settings.registrationRewardEnabled) return null;
    if (!isRegistration && !settings.subscriptionRewardEnabled) return null;

    const [referrals] = await db.execute(
      `SELECT r.*, er.name AS referrer_name, er.email AS referrer_email,
              ed.name AS referred_name
       FROM referrals r
       JOIN users er ON r.referrer_id = er.id
       JOIN users ed ON r.referred_id = ed.id
       WHERE r.referred_id = ? AND r.referrer_role = 'company'
       LIMIT 1`,
      [referredId]
    );
    if (!referrals.length) return null;

    const referral = referrals[0];
    const alreadyColumn = isRegistration ? 'registration_rewarded_at' : 'subscription_rewarded_at';
    if (referral[alreadyColumn]) return null; // already rewarded for this event

    // No annual cap — the company is rewarded on every referral.

    // Referrer's reward (percentage rewards are based on opts.baseAmount)
    const type = isRegistration ? settings.registrationRewardType : settings.subscriptionRewardType;
    const value = isRegistration ? settings.registrationRewardValue : settings.subscriptionRewardValue;
    const baseAmount = Number(opts.baseAmount || 0);
    const referrerReward = type === 'percentage'
      ? Number(((baseAmount * Number(value)) / 100).toFixed(3))
      : Number(value);

    // The referred side (whoever used the code) is rewarded on registration only.
    const referredReward = isRegistration ? Number(settings.registrationReferredRewardValue || 0) : 0;

    if (!(referrerReward > 0) && !(referredReward > 0)) {
      // Nothing to credit, but still mark the event as processed so we don't retry forever
      await db.execute(`UPDATE referrals SET ${alreadyColumn} = NOW() WHERE id = ?`, [referral.id]);
      return null;
    }

    let out = null;
    if (referrerReward > 0) {
      out = await credit({
        userId: referral.referrer_id,
        amount: referrerReward,
        type: 'referral_reward',
        description: `${isRegistration ? 'Referral signup reward' : 'Referral subscription reward'}: ${referral.referred_name || 'referred company'}`,
        triggerEvent: `referral_${isRegistration ? 'registration' : 'subscription'}`,
        triggerRefId: referral.id,
        referralId: referral.id,
      });
    }

    if (referredReward > 0) {
      await credit({
        userId: referral.referred_id,
        amount: referredReward,
        type: 'referral_reward',
        description: `Referral signup bonus — referred by ${referral.referrer_name || 'a company'}`,
        triggerEvent: 'referral_registration_referred',
        triggerRefId: referral.id,
        referralId: referral.id,
      });
    }

    await db.execute(
      `UPDATE referrals
       SET status = 'rewarded',
           rewarded_at = COALESCE(rewarded_at, NOW()),
           qualified_at = COALESCE(qualified_at, NOW()),
           ${alreadyColumn} = NOW()
       WHERE id = ?`,
      [referral.id]
    );

    console.log(`✅ Referral reward credited: referrer ${referral.referrer_id} +${referrerReward}, referred ${referral.referred_id} +${referredReward} BHD (${event})`);
    return { ...out, referralId: referral.id, reward: referrerReward, referredReward };
  } catch (err) {
    console.error('❌ awardReferralReward error:', err);
    return null;
  }
};

/**
 * Credit the one-time welcome bonus to a newly registered company's wallet.
 * Gated only by the welcome-bonus settings (independent of the referral
 * program), so every new company receives it — referred or not.
 * Idempotent: a company receives the welcome bonus at most once.
 *
 * @param {number} userId the new company's user id
 */
export const creditWelcomeBonus = async (userId) => {
  try {
    if (!userId) return null;
    const settings = await getSettings();
    if (!settings.welcomeBonusEnabled) return null;
    const bonus = Number(settings.welcomeBonusValue || 0);
    if (!(bonus > 0)) return null;

    // Idempotency guard — never credit the same company twice.
    const [existing] = await db.execute(
      `SELECT id FROM referral_transactions
       WHERE user_id = ? AND trigger_event = 'welcome_bonus' LIMIT 1`,
      [userId]
    );
    if (existing.length) return null;

    const out = await credit({
      userId,
      amount: bonus,
      type: 'credit',
      description: 'Welcome bonus for new company',
      triggerEvent: 'welcome_bonus',
    });
    console.log(`✅ Welcome bonus credited: company ${userId} +${bonus} BHD`);
    return out;
  } catch (err) {
    console.error('❌ creditWelcomeBonus error:', err);
    return null;
  }
};

export default {
  getSettings,
  updateSettings,
  credit,
  debit,
  getWallet,
  awardReferralReward,
  creditWelcomeBonus,
  genRef,
  WalletError,
};
