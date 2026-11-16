// tests/testReferralSystem.js
// Run: node tests/testReferralSystem.js   (from the server/ directory)
//
// Tests the COMPANY-ONLY referral system end-to-end:
// 1. Referral code generation (format + uniqueness)
// 2. Company → Company referral recording
// 3. Non-company referrals BLOCKED (user, business)
// 4. Cross-type referral BLOCKING (company code → non-company registrant)
// 5. Self-referral blocking
// 6. Admin universal code works for ALL types
// 7. Company registration + subscription rewards (wallet credit, idempotent)
// 8. Duplicate referral prevention
// 9. Non-existent code handling

import db from '../config/db.js';
import { generateReferralCode, getRoleFromCode, isValidCodeFormat } from '../utils/referralCodeUtils.js';
import { recordReferral, processReferralReward, getAdminUniversalCode } from '../services/referralService.js';
import { getSettings, updateSettings, getWallet } from '../services/walletService.js';

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';
let passed = 0;
let failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    console.log(`${PASS} — ${name}`);
    passed++;
  } else {
    console.log(`${FAIL} — ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

const testEmail = (tag) => `test_referral_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@gsntest.com`;

// Insert a company (referrals are company-only) and return its id.
async function insertCompany(label, referralCode = null, status = 0) {
  const [res] = await db.execute(
    `INSERT INTO users (name, email, phone, password, role, category, country, status, referral_code)
     VALUES (?, ?, ?, ?, 'company', 'Test', 'Test', ?, ?)`,
    [`Test ${label}`, testEmail(label), '1234567890', 'dummyhash', status, referralCode]
  );
  return res.insertId;
}

// Insert a non-company user (user/business) and return its id.
async function insertNonCompany(label, role, referralCode = null, status = 1) {
  const [res] = await db.execute(
    `INSERT INTO users (name, email, phone, password, role, category, country, status, referral_code)
     VALUES (?, ?, ?, ?, ?, 'Test', 'Test', ?, ?)`,
    [`Test ${label}`, testEmail(label), '1234567890', 'dummyhash', role, status, referralCode]
  );
  return res.insertId;
}

async function cleanupUsers(userIds) {
  for (const id of userIds) {
    await db.execute('DELETE FROM referral_transactions WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM referral_wallet WHERE user_id = ?', [id]);
    await db.execute('DELETE FROM referrals WHERE referred_id = ? OR referrer_id = ?', [id, id]);
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 GSN Referral System Test Suite (Company-Only)');
  console.log('='.repeat(70) + '\n');

  const created = []; // user ids to clean up

  // ─── 1. Referral Code Generation ──────────────────────────────────────────
  console.log('━━━ 1. Referral Code Generation ━━━\n');

  const userCode = generateReferralCode('user');
  const bizCode = generateReferralCode('business');
  const compCode = generateReferralCode('company');

  test('User code starts with USR-', userCode.startsWith('USR-'), `got: ${userCode}`);
  test('Business code starts with BIZ-', bizCode.startsWith('BIZ-'), `got: ${bizCode}`);
  test('Company code starts with CMP-', compCode.startsWith('CMP-'), `got: ${compCode}`);

  test('User code matches format USR-XXXXXX-XX', isValidCodeFormat(userCode), `got: ${userCode}`);
  test('Business code matches format BIZ-XXXXXX-XX', isValidCodeFormat(bizCode), `got: ${bizCode}`);
  test('Company code matches format CMP-XXXXXX-XX', isValidCodeFormat(compCode), `got: ${compCode}`);

  const codes = new Set();
  for (let i = 0; i < 100; i++) codes.add(generateReferralCode('company'));
  test('100 generated codes are all unique', codes.size === 100, `only ${codes.size} unique`);

  test('getRoleFromCode returns "user" for USR- code', getRoleFromCode(userCode) === 'user');
  test('getRoleFromCode returns "business" for BIZ- code', getRoleFromCode(bizCode) === 'business');
  test('getRoleFromCode returns "company" for CMP- code', getRoleFromCode(compCode) === 'company');
  test('getRoleFromCode returns null for legacy GSN123 code', getRoleFromCode('GSN123') === null);

  test('Legacy code GSN12345 is valid format', isValidCodeFormat('GSN12345'));

  // ─── 2. Company → Company Referral Recording ──────────────────────────────
  console.log('\n━━━ 2. Company → Company Referral Recording ━━━\n');

  const referrerCode = generateReferralCode('company');
  const referrerId = await insertCompany('Referrer', referrerCode);
  created.push(referrerId);

  const referredCompanyId = await insertCompany('ReferredCompany');
  created.push(referredCompanyId);

  const companyRefId = await recordReferral(referrerCode, referredCompanyId, 'company');
  test('Company → Company referral recorded successfully', companyRefId !== null, `got: ${companyRefId}`);

  const [refRows] = await db.execute('SELECT * FROM referrals WHERE referred_id = ?', [referredCompanyId]);
  test('Referral record exists in DB', refRows.length > 0);
  test('Referral referrer_role is "company"', refRows[0]?.referrer_role === 'company');
  test('Referral referred_role is "company"', refRows[0]?.referred_role === 'company');
  test('Referral status is "pending"', refRows[0]?.status === 'pending');

  // ─── 3. Non-Company Referrals BLOCKED ─────────────────────────────────────
  console.log('\n━━━ 3. Non-Company Referrals BLOCKED ━━━\n');

  // A user referral code used by a user registrant → blocked
  const userReferrerCode = generateReferralCode('user');
  const userReferrerId = await insertNonCompany('UserReferrer', 'user', userReferrerCode);
  created.push(userReferrerId);
  const plainUserId = await insertNonCompany('PlainUser', 'user');
  created.push(plainUserId);

  const userToUser = await recordReferral(userReferrerCode, plainUserId, 'user');
  test('User → User referral BLOCKED (company-only)', userToUser === null, `got: ${userToUser}`);

  // A business referral code used by a business registrant → blocked
  const bizReferrerCode = generateReferralCode('business');
  const bizReferrerId = await insertNonCompany('BizReferrer', 'business', bizReferrerCode, 0);
  created.push(bizReferrerId);
  const plainBizId = await insertNonCompany('PlainBiz', 'business', null, 0);
  created.push(plainBizId);

  const bizToBiz = await recordReferral(bizReferrerCode, plainBizId, 'business');
  test('Business → Business referral BLOCKED (company-only)', bizToBiz === null, `got: ${bizToBiz}`);

  // ─── 4. Cross-Type Referral BLOCKING ──────────────────────────────────────
  console.log('\n━━━ 4. Cross-Type Referral BLOCKING ━━━\n');

  // Company code used by a user registrant → blocked
  const crossUserId = await insertNonCompany('CrossUser', 'user');
  created.push(crossUserId);
  const compToUser = await recordReferral(referrerCode, crossUserId, 'user');
  test('Company code → User registration BLOCKED', compToUser === null, `got: ${compToUser}`);

  const [crossRefRows] = await db.execute('SELECT * FROM referrals WHERE referred_id = ?', [crossUserId]);
  test('No referral record created for cross-type', crossRefRows.length === 0);

  // Company code used by a business registrant → blocked
  const crossBizId = await insertNonCompany('CrossBiz', 'business', null, 0);
  created.push(crossBizId);
  const compToBiz = await recordReferral(referrerCode, crossBizId, 'business');
  test('Company code → Business registration BLOCKED', compToBiz === null, `got: ${compToBiz}`);

  // ─── 5. Self-Referral Blocking ────────────────────────────────────────────
  console.log('\n━━━ 5. Self-Referral Blocking ━━━\n');

  const selfRefId = await recordReferral(referrerCode, referrerId, 'company');
  test('Self-referral BLOCKED', selfRefId === null, 'should return null');

  // ─── 6. Admin Universal Code ──────────────────────────────────────────────
  console.log('\n━━━ 6. Admin Universal Code ━━━\n');

  const adminCode = await getAdminUniversalCode();
  test('Admin universal code exists in DB', adminCode !== null, `code: ${adminCode}`);

  if (adminCode) {
    // Works for a USER registrant
    const adminUserId = await insertNonCompany('AdminTestUser', 'user');
    created.push(adminUserId);
    const adminUserRef = await recordReferral(adminCode, adminUserId, 'user');
    test('Admin code works for USER registration', adminUserRef !== null);
    const [adminUserRefRow] = await db.execute('SELECT * FROM referrals WHERE referred_id = ?', [adminUserId]);
    test('Admin referral referrer_role is "admin"', adminUserRefRow[0]?.referrer_role === 'admin');

    // Works for a COMPANY registrant
    const adminCompId = await insertCompany('AdminTestComp');
    created.push(adminCompId);
    const adminCompRef = await recordReferral(adminCode, adminCompId, 'company');
    test('Admin code works for COMPANY registration', adminCompRef !== null);

    // Works for a BUSINESS registrant
    const adminBizId = await insertNonCompany('AdminTestBiz', 'business', null, 0);
    created.push(adminBizId);
    const adminBizRef = await recordReferral(adminCode, adminBizId, 'business');
    test('Admin code works for BUSINESS registration', adminBizRef !== null);
  }

  // ─── 7. Company Rewards (wallet credit + idempotency) ─────────────────────
  console.log('\n━━━ 7. Company Rewards ━━━\n');

  const original = await getSettings();

  // 7a. Registration reward (temporarily enabled with a known fixed value)
  try {
    await updateSettings({ referralEnabled: true, registrationRewardEnabled: true, registrationRewardType: 'fixed', registrationRewardValue: 5 });

    const rCode = generateReferralCode('company');
    const rReferrerId = await insertCompany('RewardReferrer', rCode);
    created.push(rReferrerId);
    const rReferredId = await insertCompany('RewardReferred');
    created.push(rReferredId);

    await recordReferral(rCode, rReferredId, 'company');
    const firstReward = await processReferralReward(rReferredId, 'registration');
    test('Registration reward credited', firstReward !== null && Number(firstReward.reward) === 5, `got: ${JSON.stringify(firstReward)}`);

    const wallet = await getWallet(rReferrerId);
    test('Referrer wallet balance is 5 BHD', wallet.balance === 5, `balance: ${wallet.balance}`);

    const [rewardedRef] = await db.execute('SELECT * FROM referrals WHERE referred_id = ?', [rReferredId]);
    test('Referral status changed to "rewarded"', rewardedRef[0]?.status === 'rewarded', `got: ${rewardedRef[0]?.status}`);
    test('registration_rewarded_at is set', !!rewardedRef[0]?.registration_rewarded_at);

    const [txns] = await db.execute('SELECT * FROM referral_transactions WHERE user_id = ? AND type = "referral_reward"', [rReferrerId]);
    test('Referral reward transaction logged', txns.length === 1, `count: ${txns.length}`);

    // Idempotency — a second call must not double-credit
    const secondReward = await processReferralReward(rReferredId, 'registration');
    const walletAfter = await getWallet(rReferrerId);
    test('Second registration reward is a no-op', secondReward === null, `got: ${JSON.stringify(secondReward)}`);
    test('Wallet balance unchanged after second call', walletAfter.balance === 5, `balance: ${walletAfter.balance}`);
  } catch (err) {
    test('Registration reward block ran without error', false, err.message);
  }

  // 7b. Subscription reward (default-enabled path)
  try {
    await updateSettings({ referralEnabled: true, subscriptionRewardEnabled: true, subscriptionRewardType: 'fixed', subscriptionRewardValue: 8 });

    const sCode = generateReferralCode('company');
    const sReferrerId = await insertCompany('SubReferrer', sCode);
    created.push(sReferrerId);
    const sReferredId = await insertCompany('SubReferred');
    created.push(sReferredId);

    await recordReferral(sCode, sReferredId, 'company');
    const subReward = await processReferralReward(sReferredId, 'subscription_approved', { baseAmount: 100 });
    test('Subscription reward credited', subReward !== null && Number(subReward.reward) === 8, `got: ${JSON.stringify(subReward)}`);

    const subWallet = await getWallet(sReferrerId);
    test('Referrer wallet balance is 8 BHD after subscription', subWallet.balance === 8, `balance: ${subWallet.balance}`);
  } catch (err) {
    test('Subscription reward block ran without error', false, err.message);
  }

  // Restore original settings
  await updateSettings({
    referralEnabled: original.referralEnabled,
    registrationRewardEnabled: original.registrationRewardEnabled,
    registrationRewardType: original.registrationRewardType,
    registrationRewardValue: original.registrationRewardValue,
    subscriptionRewardEnabled: original.subscriptionRewardEnabled,
    subscriptionRewardType: original.subscriptionRewardType,
    subscriptionRewardValue: original.subscriptionRewardValue,
  });

  // ─── 8. Duplicate Referral Prevention ─────────────────────────────────────
  console.log('\n━━━ 8. Duplicate Referral Prevention ━━━\n');

  const dupCode = generateReferralCode('company');
  const dupReferrerId = await insertCompany('DupReferrer', dupCode);
  created.push(dupReferrerId);
  const dupReferredId = await insertCompany('DupReferred');
  created.push(dupReferredId);

  const firstRef = await recordReferral(dupCode, dupReferredId, 'company');
  test('First referral recorded', firstRef !== null);

  const secondRef = await recordReferral(dupCode, dupReferredId, 'company');
  test('Duplicate referral BLOCKED', secondRef === null);

  const [dupRefs] = await db.execute('SELECT * FROM referrals WHERE referred_id = ?', [dupReferredId]);
  test('Only one referral record exists', dupRefs.length === 1, `count: ${dupRefs.length}`);

  // ─── 9. Non-Existent Code ─────────────────────────────────────────────────
  console.log('\n━━━ 9. Non-Existent Code ━━━\n');

  const fakeId = await insertCompany('FakeCodeCompany');
  created.push(fakeId);
  const fakeRefId = await recordReferral('CMP-FAKE00-XX', fakeId, 'company');
  test('Non-existent referral code ignored', fakeRefId === null);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  await cleanupUsers(created);
  await db.execute('DELETE FROM users WHERE email LIKE "%gsntest.com%"');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(70) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
