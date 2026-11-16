// utils/referralCodeUtils.js
import crypto from 'crypto';

const ROLE_PREFIX = {
  user:     'USR',
  business: 'BIZ',
  company:  'CMP',
};

/**
 * Generates a unique referral code in format: USR-XXXXXX-XX
 * Prefix encodes entity type so cross-type referrals can be fast-rejected.
 */
export function generateReferralCode(role) {
  const prefix = ROLE_PREFIX[role] || 'USR';

  // 6-char cryptographically random uppercase alphanumeric
  const random = crypto.randomBytes(4)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(6, '0');

  // 2-char checksum (sum of char codes mod 1296, base36)
  const checksum = Array.from(random)
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1296;
  const checksumStr = checksum.toString(36).toUpperCase().padStart(2, '0');

  return `${prefix}-${random}-${checksumStr}`;
}

/**
 * Infer role from a new-format referral code prefix.
 * Returns null for legacy GSN... codes — caller must do a DB lookup.
 */
export function getRoleFromCode(code) {
  if (!code) return null;
  const prefix = code.split('-')[0];
  const map = { USR: 'user', BIZ: 'business', CMP: 'company' };
  return map[prefix] || null;
}

/**
 * Regex to accept both new format (USR-XXXXXX-XX) and legacy (GSN123...)
 */
export function isValidCodeFormat(code) {
  if (!code) return false;
  const newFormat = /^(USR|BIZ|CMP)-[A-Z0-9]{6}-[A-Z0-9]{2}$/;
  const legacyFormat = /^GSN\d+$/;
  return newFormat.test(code) || legacyFormat.test(code);
}
