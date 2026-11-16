// services/referralService.js
import db from '../config/db.js';
import { getRoleFromCode } from '../utils/referralCodeUtils.js';
import { awardReferralReward } from './walletService.js';

/**
 * Fetches the admin universal referral code from referral_settings.
 * Returns null if not set.
 */
export async function getAdminUniversalCode() {
  try {
    const [rows] = await db.execute(
      "SELECT setting_value FROM referral_settings WHERE setting_key = 'admin_universal_code'"
    );
    return rows.length > 0 ? rows[0].setting_value : null;
  } catch {
    return null;
  }
}

/**
 * Called at registration time.
 * Looks up referral code, validates same-role, creates pending referral record.
 * If the code is the admin universal code, it works for ALL entity types.
 * Does NOT issue rewards yet — rewards come after the qualifying event.
 */
export async function recordReferral(referralCode, newUserId, newUserRole) {
  if (!referralCode) return null;

  try {
    // 0. Check if this is the admin universal code — works for all types
    const adminCode = await getAdminUniversalCode();
    if (adminCode && referralCode === adminCode) {
      // Find an admin user to be the referrer
      const [adminRows] = await db.execute(
        "SELECT id, role FROM users WHERE role = 'admin' LIMIT 1"
      );
      if (adminRows.length === 0) {
        console.log('⚠️  Admin universal code used but no admin user found');
        return null;
      }
      const admin = adminRows[0];

      // Self-referral guard
      if (admin.id === newUserId) return null;

      // Check if this new user already has a referral record
      const [existing] = await db.execute(
        'SELECT id FROM referrals WHERE referred_id = ?',
        [newUserId]
      );
      if (existing.length > 0) return null;

      // Insert pending referral with admin as referrer
      const [result] = await db.execute(
        `INSERT INTO referrals
           (referral_code, referrer_id, referred_id, referrer_role, referred_role, status)
         VALUES (?, ?, ?, 'admin', ?, 'pending')`,
        [referralCode, admin.id, newUserId, newUserRole]
      );

      console.log(`✅ Admin universal referral recorded: admin=${admin.id} → referred=${newUserId} (${newUserRole})`);
      return result.insertId;
    }

    // Referrals are company-only: regular referral codes only apply to company
    // registrations. (The admin universal code above remains valid for all types.)
    if (newUserRole !== 'company') {
      console.log(`⚠️  Referral skipped: only company registrations can be referred (got ${newUserRole})`);
      return null;
    }

    // 1. Infer expected role from new-format code prefix (fast check)
    const codeRole = getRoleFromCode(referralCode);
    if (codeRole && codeRole !== newUserRole) {
      console.log(`⚠️  Referral code role mismatch: code is ${codeRole}, registrant is ${newUserRole} — BLOCKED`);
      return null; // Silently ignore cross-entity codes
    }

    // 2. Look up referrer in users table
    const [rows] = await db.execute(
      'SELECT id, role, status FROM users WHERE referral_code = ?',
      [referralCode]
    );
    if (rows.length === 0) {
      console.log(`⚠️  Referral code not found: ${referralCode}`);
      return null;
    }

    const referrer = rows[0];

    // 3. Backend role compatibility check (authoritative guard — cross-type blocked)
    if (referrer.role !== newUserRole) {
      console.log(`⚠️  Cross-entity referral BLOCKED: referrer=${referrer.role}, referred=${newUserRole}`);
      return null;
    }

    // 4. Self-referral guard
    if (referrer.id === newUserId) {
      console.log(`⚠️  Self-referral blocked for user ${newUserId}`);
      return null;
    }

    // 5. Check if this new user already has a referral record (UNIQUE KEY guard)
    const [existing] = await db.execute(
      'SELECT id FROM referrals WHERE referred_id = ?',
      [newUserId]
    );
    if (existing.length > 0) return null;

    // 6. Insert pending referral
    const [result] = await db.execute(
      `INSERT INTO referrals
         (referral_code, referrer_id, referred_id, referrer_role, referred_role, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [referralCode, referrer.id, newUserId, referrer.role, newUserRole]
    );

    console.log(`✅ Referral recorded: referrer=${referrer.id} → referred=${newUserId} (${newUserRole})`);
    return result.insertId;
  } catch (err) {
    // Duplicate key on referred_id = already has a referral, safe to ignore
    if (err.code === 'ER_DUP_ENTRY') return null;
    console.error('❌ recordReferral error:', err);
    return null;
  }
}

/**
 * Called when a qualifying event fires for a referred company:
 *   - 'registration'           → credited on company registration (if enabled)
 *   - 'account_activation'     → legacy hook (no-op for companies)
 *   - 'subscription_approved'  → credited when the referred company buys a plan
 *
 * Credits a wallet reward to the referring company per the admin's
 * Wallet & Referral settings. Fully idempotent — each event rewards once.
 *
 * @param {number} referredId
 * @param {'registration'|'account_activation'|'subscription_approved'} triggerEvent
 * @param {{ baseAmount?: number }} [opts] base for percentage-based rewards
 */
export async function processReferralReward(referredId, triggerEvent, opts = {}) {
  try {
    // Only registration + subscription events are rewarded.
    if (triggerEvent !== 'registration' && triggerEvent !== 'subscription_approved') {
      return null;
    }
    return await awardReferralReward(referredId, triggerEvent, opts);
  } catch (err) {
    console.error('❌ processReferralReward error:', err);
    return null;
  }
}
