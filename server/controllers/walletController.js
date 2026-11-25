// controllers/walletController.js
// Company Wallet & Referral Reward System — company + admin endpoints.

import db from '../config/db.js';
import walletService, { credit, debit, getSettings, updateSettings, genRef, WalletError } from '../services/walletService.js';
import currencyService from '../services/currencyService.js';
import paypalFeeService from '../services/paypalFeeService.js';
import paypalService from '../services/paypalService.js';
import { processReferralReward } from '../services/referralService.js';
import { sendWalletTopupNotificationToAdmin } from '../services/adminNotificationService.js';
import { createInvoice } from './invoiceController.js';

const ok = (res, data) => res.json(data);
const fail = (res, code, message) => res.status(code).json({ message });
const num = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));

// ─── CURRENCY (public) ──────────────────────────────────────────────────────

// @desc    Current BHD -> USD market rate
// @route   GET /api/wallet/currency-rate
// @access  Public
export const getCurrencyRate = async (req, res) => {
  try {
    if (req.query.refresh === '1') await currencyService.refreshBhdToUsdRate();
    ok(res, await currencyService.getRates());
  } catch (err) {
    console.error('getCurrencyRate error:', err);
    fail(res, 500, 'Server error');
  }
};

// ─── COMPANY WALLET ─────────────────────────────────────────────────────────

// @desc    Wallet summary for the logged-in company (balance, limits, rate)
// @route   GET /api/wallet
// @access  Private/Company
export const getWalletSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const [wallet, settings, rates, txns] = await Promise.all([
      walletService.getWallet(userId),
      getSettings(),
      currencyService.getRates(),
      db.execute(
        `SELECT id, type, amount_bhd, balance_after, description, transaction_ref, method, created_at
         FROM referral_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 10`,
        [userId]
      ).then(([rows]) => rows),
    ]);

    ok(res, {
      ...wallet,
      currency: 'BHD',
      rates,
      settings: {
        walletSubscriptionEnabled: settings.walletSubscriptionEnabled,
        walletMinUsageBhd: settings.walletMinUsageBhd,
        walletMaxUsagePercent: settings.walletMaxUsagePercent,
        minTopupBhd: settings.minTopupBhd,
        minTopupUsd: settings.minTopupUsd,
        maxTopupBhd: settings.maxTopupBhd,
        referralEnabled: settings.referralEnabled,
      },
      recentTransactions: txns,
    });
  } catch (err) {
    console.error('getWalletSummary error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Paginated wallet ledger for the logged-in company
// @route   GET /api/wallet/transactions
// @access  Private/Company
export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const type = req.query.type || null;

    let where = 'WHERE user_id = ?';
    const params = [userId];
    if (type) { where += ' AND type = ?'; params.push(type); }

    const [rows] = await db.execute(
      `SELECT id, referral_id, type, amount_bhd, balance_after, description,
              transaction_ref, method, trigger_event, status, created_at
       FROM referral_transactions ${where}
       ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const [countRows] = await db.execute(`SELECT COUNT(*) AS cnt FROM referral_transactions ${where}`, params);

    ok(res, {
      transactions: rows,
      pagination: {
        total: Number(countRows[0].cnt), page, limit,
        totalPages: Math.ceil(Number(countRows[0].cnt) / limit),
      },
    });
  } catch (err) {
    console.error('getMyTransactions error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    My wallet top-up requests
// @route   GET /api/wallet/topups
// @access  Private/Company
export const getMyTopups = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, amount_bhd, method, status, transaction_ref, payment_proof_url,
              admin_note, created_at, processed_at
       FROM wallet_topup_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    ok(res, rows);
  } catch (err) {
    console.error('getMyTopups error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    PayPal wallet top-up — verified server-side, then credited instantly
// @route   POST /api/wallet/topup/paypal
// @access  Private/Company
export const createPaypalTopup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountBhd, orderId, payerId } = req.body;
    const amount = num(amountBhd);
    const settings = await getSettings();

    if (!(amount > 0)) return fail(res, 400, 'A positive amount is required');
    if (!orderId) return fail(res, 400, 'PayPal order id is required');
    if (amount < num(settings.minTopupBhd)) return fail(res, 400, `Minimum top-up is ${settings.minTopupBhd} BHD`);
    // Hard USD floor — a top-up may never be worth less than this, whatever the
    // BHD minimum is set to.
    const baseUsd = currencyService.bhdToUsd(amount);
    if (num(settings.minTopupUsd) > 0 && baseUsd + 0.005 < num(settings.minTopupUsd)) {
      return fail(res, 400, `Minimum top-up is $${num(settings.minTopupUsd)}`);
    }
    if (num(settings.maxTopupBhd) > 0 && amount > num(settings.maxTopupBhd)) {
      return fail(res, 400, `Maximum top-up is ${settings.maxTopupBhd} BHD`);
    }

    // Duplicate protection — one credit per PayPal order
    const [dup] = await db.execute('SELECT id FROM wallet_topup_requests WHERE paypal_order_id = ?', [orderId]);
    if (dup.length) return fail(res, 409, 'This PayPal payment has already been credited');

    // 🔐 Confirm the payment with PayPal before crediting anything. The amount
    // is cross-checked against what the order actually captured, so a client
    // can neither underpay nor inflate the credited balance.
    await paypalService.ensureConfig();
    if (!paypalService.isConfigured()) {
      return fail(res, 503, 'PayPal verification is unavailable right now. Please use bank transfer.');
    }

    let order;
    try {
      order = await paypalService.verifyOrder(orderId);
    } catch (e) {
      console.error('createPaypalTopup verify error:', e.message);
      return fail(res, 502, 'Could not verify this PayPal payment. Please try again.');
    }

    if (!order.paid) {
      return fail(res, 402, 'PayPal did not confirm this payment.');
    }

    // The buyer was charged the grossed-up amount (base + PayPal's fee), so that
    // is what the captured order must match.
    const [buyerRows] = await db.execute('SELECT name, country FROM users WHERE id = ?', [userId]);
    const buyer = buyerRows[0] || {};
    const breakdown = paypalFeeService.breakdownSync(baseUsd, buyer.country);

    const amountError = paypalService.assertAmount(order, breakdown.total, 0.05);
    if (amountError) {
      console.error(`⚠️ PayPal top-up amount mismatch for order ${orderId}: ${amountError}`);
      return fail(res, 400, `PayPal payment could not be verified (${amountError}).`);
    }

    const ref = genRef('TOP');
    const [reqRes] = await db.execute(
      `INSERT INTO wallet_topup_requests
         (user_id, amount_bhd, method, status, transaction_ref, paypal_order_id, paypal_payer_id, processed_at)
       VALUES (?, ?, 'paypal', 'completed', ?, ?, ?, NOW())`,
      [userId, amount, ref, orderId, payerId || order.payerId || null]
    );

    const out = await credit({
      userId,
      amount,
      type: 'deposit',
      description: `Wallet top-up via PayPal (${ref})`,
      triggerEvent: 'wallet_topup_paypal',
      triggerRefId: reqRes.insertId,
      method: 'paypal',
    });

    // Notify the admin so the top-up shows up in their notifications + sidebar badge.
    try {
      await sendWalletTopupNotificationToAdmin(userId, buyer.name || 'A company', amount, 'paypal', ref);
    } catch (e) {
      console.error('wallet topup notify error:', e.message);
    }

    ok(res, { message: 'Wallet topped up successfully', ...out });
  } catch (err) {
    console.error('createPaypalTopup error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Bank-transfer wallet top-up (admin approval required)
// @route   POST /api/wallet/topup/bank
// @access  Private/Company
export const createBankTopup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountBhd, transactionRef } = req.body;
    const amount = num(amountBhd);
    const settings = await getSettings();

    if (!(amount > 0)) return fail(res, 400, 'A positive amount is required');
    if (!req.file) return fail(res, 400, 'Payment proof image is required');
    if (amount < num(settings.minTopupBhd)) return fail(res, 400, `Minimum top-up is ${settings.minTopupBhd} BHD`);
    // Same hard USD floor as the PayPal path.
    if (num(settings.minTopupUsd) > 0 && currencyService.bhdToUsd(amount) + 0.005 < num(settings.minTopupUsd)) {
      return fail(res, 400, `Minimum top-up is $${num(settings.minTopupUsd)}`);
    }
    if (num(settings.maxTopupBhd) > 0 && amount > num(settings.maxTopupBhd)) {
      return fail(res, 400, `Maximum top-up is ${settings.maxTopupBhd} BHD`);
    }

    const ref = genRef('TOP');
    const [result] = await db.execute(
      `INSERT INTO wallet_topup_requests
         (user_id, amount_bhd, method, status, transaction_ref, payment_proof_url)
       VALUES (?, ?, 'bank_transfer', 'pending', ?, ?)`,
      [userId, amount, transactionRef || ref, req.file.path]
    );

    // Notify the admin so the pending bank request shows up in their
    // notifications + sidebar badge right away.
    try {
      const [u] = await db.execute('SELECT name FROM users WHERE id = ?', [userId]);
      await sendWalletTopupNotificationToAdmin(userId, u[0]?.name || 'A company', amount, 'bank_transfer', transactionRef || ref);
    } catch (e) {
      console.error('wallet topup notify error:', e.message);
    }

    ok(res, {
      message: 'Top-up request submitted. Admin will review and credit your wallet.',
      requestId: result.insertId,
      status: 'pending',
    });
  } catch (err) {
    console.error('createBankTopup error:', err);
    fail(res, 500, 'Server error');
  }
};

// ─── SUBSCRIPTION PAYMENT WITH WALLET ───────────────────────────────────────

const loadActivePlan = async (planId) => {
  const [rows] = await db.execute('SELECT * FROM membership_plans WHERE id = ? AND is_active = 1', [planId]);
  return rows[0] || null;
};

const getActiveSubscription = async (userId) => {
  const [rows] = await db.execute(
    `SELECT us.*, mp.price AS plan_price, mp.name AS plan_name
     FROM user_subscriptions us
     JOIN membership_plans mp ON us.plan_id = mp.id
     WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
     ORDER BY us.end_date DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * Resolves the price and duration a plan is actually billed for, honouring the
 * yearly cycle (12 months at the annual price, falling back to 10× monthly).
 */
const resolveBillingTerms = (plan, billingCycle) => {
  const isYearly = String(billingCycle).toLowerCase() === 'yearly';
  const monthlyPrice = num(plan.price);
  const yearlyPrice = plan.yearly_price === null || plan.yearly_price === undefined || plan.yearly_price === ''
    ? null
    : num(plan.yearly_price);
  return {
    isYearly,
    priceBhd: isYearly ? (yearlyPrice ?? Number((monthlyPrice * 10).toFixed(2))) : monthlyPrice,
    durationMonths: isYearly ? 12 : (parseInt(plan.duration_months, 10) || 1),
  };
};

/**
 * Force-activate a subscription immediately (used when the wallet covers the
 * full amount). Expires any old subscription, creates the new one + invoice,
 * and fires the referral reward.
 */
const activateInstant = async (userId, plan, amountPaid, meta) => {
  const { walletAmountApplied = 0, paymentMethod = 'wallet', transactionId = null, durationMonths } = meta || {};

  await db.execute(
    `UPDATE user_subscriptions SET status = 'expired', end_date = CURDATE()
     WHERE user_id = ? AND status = 'active'`,
    [userId]
  );

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + Number(durationMonths || plan.duration_months || 1));

  const [subResult] = await db.execute(
    `INSERT INTO user_subscriptions
       (user_id, plan_id, start_date, end_date, status, payment_status, payment_method,
        amount_paid, transaction_id, wallet_amount_applied)
     VALUES (?, ?, ?, ?, 'active', 'paid', ?, ?, ?, ?)`,
    [
      userId, plan.id,
      startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0],
      paymentMethod, amountPaid, transactionId, walletAmountApplied,
    ]
  );

  try { await createInvoice(subResult.insertId, amountPaid, 0); }
  catch (e) { console.error('Invoice creation failed (wallet payment):', e); }

  // Fire referral reward for the referred company's first subscription
  processReferralReward(userId, 'subscription_approved', { baseAmount: Number(amountPaid) })
    .catch((e) => console.error('referral reward error:', e));

  return { subscriptionId: subResult.insertId, startDate, endDate };
};

// @desc    Preview how much of a plan the wallet can cover
// @route   GET /api/wallet/subscription-preview/:planId
// @access  Private/Company
export const previewSubscriptionPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await loadActivePlan(req.params.planId);
    if (!plan) return fail(res, 404, 'Plan not found or inactive');

    const [wallet, settings, rates] = await Promise.all([
      walletService.getWallet(userId), getSettings(), currencyService.getRates(),
    ]);

    const priceBhd = resolveBillingTerms(plan, req.query.billingCycle).priceBhd;
    const maxPct = Math.min(100, Math.max(0, num(settings.walletMaxUsagePercent) || 100));
    const maxUsableByPct = Number(((priceBhd * maxPct) / 100).toFixed(3));
    const maxWalletUsable = Math.max(0, Math.min(wallet.balance, maxUsableByPct));

    ok(res, {
      planId: plan.id,
      planName: plan.name,
      priceBhd,
      priceUsd: currencyService.bhdToUsd(priceBhd),
      currency: 'BHD',
      rates,
      walletBalance: wallet.balance,
      walletEnabled: settings.walletSubscriptionEnabled,
      walletMinUsageBhd: num(settings.walletMinUsageBhd),
      walletMaxUsagePercent: maxPct,
      maxWalletUsable,
      externalDueBhd: Number((priceBhd - maxWalletUsable).toFixed(3)),
      paypalChargeUsd: currencyService.bhdToUsd(Number((priceBhd - maxWalletUsable).toFixed(3))),
    });
  } catch (err) {
    console.error('previewSubscriptionPayment error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Pay for a subscription fully from the wallet (instant activation)
// @route   POST /api/wallet/subscription/pay
// @access  Private/Company
export const paySubscriptionWithWallet = async (req, res) => {
  const userId = req.user.id;
  const { planId, walletAmount, billingCycle = 'monthly' } = req.body;

  try {
    if (!planId) return fail(res, 400, 'Plan ID is required');
    const settings = await getSettings();
    if (!settings.walletSubscriptionEnabled) {
      return fail(res, 400, 'Wallet payments are currently disabled');
    }

    const plan = await loadActivePlan(planId);
    if (!plan) return fail(res, 404, 'Plan not found or inactive');

    const { priceBhd, durationMonths } = resolveBillingTerms(plan, billingCycle);
    const walletBalance = (await walletService.getWallet(userId)).balance;
    const requested = walletAmount === undefined || walletAmount === null || walletAmount === ''
      ? Math.min(walletBalance, priceBhd)
      : num(walletAmount);

    if (!(requested > 0)) return fail(res, 400, 'Wallet amount must be greater than zero');
    if (requested > walletBalance) return fail(res, 400, 'Wallet amount exceeds your available balance');

    const maxPct = Math.min(100, Math.max(0, num(settings.walletMaxUsagePercent) || 100));
    const maxUsable = Math.min(walletBalance, Number(((priceBhd * maxPct) / 100).toFixed(3)));
    if (requested > maxUsable) {
      return fail(res, 400, `You can use at most ${maxUsable} BHD from your wallet for this plan`);
    }

    const minUsage = num(settings.walletMinUsageBhd);
    if (minUsage > 0 && requested < minUsage) {
      return fail(res, 400, `Minimum wallet usage is ${minUsage} BHD`);
    }

    // Wallet-only checkout requires the balance to cover the full plan price.
    // Partial payments are completed on the payment page with PayPal/bank.
    if (requested < priceBhd) {
      const dueBhd = Number((priceBhd - requested).toFixed(3));
      return fail(res, 400,
        `Your wallet covers only part of this plan. Please pay the remaining ${dueBhd} BHD via PayPal or bank transfer.`);
    }

    const [pending] = await db.execute(
      `SELECT id FROM subscription_requests WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );
    if (pending.length) return fail(res, 400, 'You already have a pending subscription request');

    const existing = await getActiveSubscription(userId);
    if (existing) {
      const currentPrice = num(existing.plan_price);
      if (Number(existing.plan_id) === Number(planId)) {
        return fail(res, 400, 'You already have this plan active');
      }
      if (currentPrice >= priceBhd) {
        return fail(res, 400, 'Downgrading is not available. Please contact support for assistance.');
      }
    }

    // Deduct the wallet first (atomic), then activate the subscription.
    const ref = genRef('WSUB');
    let debitOut;
    try {
      debitOut = await debit({
        userId,
        amount: priceBhd,
        type: 'subscription_payment',
        description: `Subscription purchase — ${plan.name} (paid from wallet)`,
        triggerEvent: 'subscription_wallet',
        method: 'wallet',
      });
    } catch (e) {
      if (e instanceof WalletError) return fail(res, 400, e.message);
      throw e;
    }

    const result = await activateInstant(userId, plan, priceBhd, {
      walletAmountApplied: priceBhd, paymentMethod: 'wallet', transactionId: ref, durationMonths,
    });

    return ok(res, {
      message: 'Subscription activated using your wallet balance.',
      mode: 'wallet_full',
      amountPaid: priceBhd,
      walletAmountApplied: priceBhd,
      walletBalance: debitOut.balanceAfter,
      subscriptionId: result.subscriptionId,
      instant: true,
    });
  } catch (err) {
    console.error('paySubscriptionWithWallet error:', err);
    fail(res, 500, 'Server error');
  }
};

// ─── ADMIN — WALLET & REFERRAL SETTINGS ─────────────────────────────────────

// @desc    Get wallet & referral configuration
// @route   GET /api/wallet/admin/settings
// @access  Private/Admin
export const adminGetSettings = async (req, res) => {
  try {
    const [settings, rates] = await Promise.all([getSettings(), currencyService.getRates()]);
    ok(res, { settings, rates });
  } catch (err) {
    console.error('adminGetSettings error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Update wallet & referral configuration
// @route   PUT /api/wallet/admin/settings
// @access  Private/Admin
export const adminUpdateSettings = async (req, res) => {
  try {
    const settings = await updateSettings(req.body || {}, req.user.id);
    ok(res, { message: 'Settings updated successfully', settings });
  } catch (err) {
    console.error('adminUpdateSettings error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Force refresh the BHD -> USD market rate
// @route   POST /api/wallet/admin/refresh-rate
// @access  Private/Admin
export const adminRefreshRate = async (req, res) => {
  try {
    ok(res, await currencyService.refreshBhdToUsdRate());
  } catch (err) {
    console.error('adminRefreshRate error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    List company users (with or without a wallet) + filters
// @route   GET /api/wallet/admin/wallets
// @access  Private/Admin
export const adminListWallets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const { search, status, minBalance, maxBalance } = req.query;

    // Only company accounts have wallets — never list business/regular users.
    let where = 'WHERE u.role = "company"';
    const params = [];

    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status !== undefined && status !== '') {
      where += ' AND u.status = ?';
      params.push(Number(status));
    }
    if (minBalance !== undefined && minBalance !== '') {
      where += ' AND COALESCE(rw.balance_bhd, 0) >= ?';
      params.push(num(minBalance));
    }
    if (maxBalance !== undefined && maxBalance !== '') {
      where += ' AND COALESCE(rw.balance_bhd, 0) <= ?';
      params.push(num(maxBalance));
    }

    const from = `FROM users u LEFT JOIN referral_wallet rw ON rw.user_id = u.id ${where}`;

    const [rows] = await db.execute(
      `SELECT u.id AS user_id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
              rw.id AS wallet_id, COALESCE(rw.balance_bhd, 0) AS balance_bhd,
              COALESCE(rw.lifetime_earned, 0) AS lifetime_earned,
              COALESCE(rw.lifetime_used, 0) AS lifetime_used, rw.updated_at
       ${from}
       ORDER BY rw.balance_bhd DESC, u.name ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const [countRows] = await db.execute(`SELECT COUNT(*) AS cnt ${from}`, params);

    ok(res, {
      wallets: rows,
      pagination: {
        total: Number(countRows[0].cnt), page, limit,
        totalPages: Math.ceil(Number(countRows[0].cnt) / limit),
      },
    });
  } catch (err) {
    console.error('adminListWallets error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Wallet detail + ledger for one company
// @route   GET /api/wallet/admin/wallets/:userId
// @access  Private/Admin
export const adminWalletDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const [userRows] = await db.execute(
      'SELECT id, name, email, role, paypal_email, status FROM users WHERE id = ?',
      [userId]
    );
    if (!userRows.length) return fail(res, 404, 'User not found');

    const [wallet, txns] = await Promise.all([
      walletService.getWallet(userId),
      db.execute(
        `SELECT id, referral_id, type, amount_bhd, balance_after, description,
                transaction_ref, method, trigger_event, status, created_at
         FROM referral_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`,
        [userId]
      ).then(([r]) => r),
    ]);

    ok(res, { user: userRows[0], wallet, transactions: txns });
  } catch (err) {
    console.error('adminWalletDetail error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Manually credit or debit any company's wallet
// @route   POST /api/wallet/admin/adjust
// @access  Private/Admin
export const adminAdjustWallet = async (req, res) => {
  try {
    const { userId, type, amountBhd, description } = req.body;
    if (!userId || !type || !amountBhd) return fail(res, 400, 'userId, type and amountBhd are required');
    if (!['credit', 'debit'].includes(type)) return fail(res, 400, 'type must be credit or debit');

    const amount = Math.abs(num(amountBhd));
    if (!(amount > 0)) return fail(res, 400, 'amountBhd must be greater than zero');

    const [userRows] = await db.execute('SELECT id, name FROM users WHERE id = ?', [userId]);
    if (!userRows.length) return fail(res, 404, 'User not found');

    const payload = {
      userId,
      amount,
      type: 'admin_adjustment',
      description: description || `Admin ${type} adjustment`,
      triggerEvent: 'admin_adjustment',
      method: 'admin',
      createdBy: req.user.id,
    };
    const out = type === 'credit' ? await credit(payload) : await debit(payload);

    ok(res, { message: 'Wallet adjusted successfully', newBalance: out.balanceAfter, ref: out.ref });
  } catch (err) {
    if (err instanceof WalletError) return fail(res, 400, err.message);
    console.error('adminAdjustWallet error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Give money to one, many, or all company wallets at once
// @route   POST /api/wallet/admin/bulk-adjust
// @access  Private/Admin
export const adminBulkAdjustWallet = async (req, res) => {
  try {
    const { userIds, all, type = 'credit', amountBhd, description } = req.body;
    if (!['credit', 'debit'].includes(type)) return fail(res, 400, 'type must be credit or debit');

    const amount = Math.abs(num(amountBhd));
    if (!(amount > 0)) return fail(res, 400, 'amountBhd must be greater than zero');

    let ids = Array.isArray(userIds) ? userIds.map(Number).filter(Boolean) : [];
    if (all) {
      const [rows] = await db.execute('SELECT id FROM users WHERE role = "company"');
      ids = rows.map(r => r.id);
    }
    ids = [...new Set(ids)];
    if (!ids.length) return fail(res, 400, 'No companies selected');

    const base = {
      amount,
      type: 'admin_adjustment',
      description: description || `Admin ${type} adjustment`,
      triggerEvent: 'admin_adjustment',
      method: 'admin',
      createdBy: req.user.id,
    };

    let succeeded = 0;
    const failed = [];
    for (const userId of ids) {
      try {
        const payload = { ...base, userId };
        if (type === 'credit') await credit(payload); else await debit(payload);
        succeeded += 1;
      } catch (e) {
        failed.push({ userId, message: e.message || 'Failed' });
      }
    }

    ok(res, { message: `Wallet updated for ${succeeded} of ${ids.length} companies`, succeeded, failed });
  } catch (err) {
    console.error('adminBulkAdjustWallet error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    All wallet transactions (ledger) across companies
// @route   GET /api/wallet/admin/transactions
// @access  Private/Admin
export const adminListTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const { type, userId } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    if (type) { where += ' AND rt.type = ?'; params.push(type); }
    if (userId) { where += ' AND rt.user_id = ?'; params.push(userId); }

    const [rows] = await db.execute(
      `SELECT rt.*, u.name AS user_name, u.email AS user_email, u.role
       FROM referral_transactions rt
       JOIN users u ON rt.user_id = u.id
       ${where}
       ORDER BY rt.created_at DESC, rt.id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM referral_transactions rt ${where}`, params
    );

    ok(res, {
      transactions: rows,
      pagination: {
        total: Number(countRows[0].cnt), page, limit,
        totalPages: Math.ceil(Number(countRows[0].cnt) / limit),
      },
    });
  } catch (err) {
    console.error('adminListTransactions error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    All wallet top-up requests
// @route   GET /api/wallet/admin/topups
// @access  Private/Admin
export const adminListTopups = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND wt.status = ?'; params.push(status); }

    const [rows] = await db.execute(
      `SELECT wt.*, u.name AS user_name, u.email AS user_email
       FROM wallet_topup_requests wt
       JOIN users u ON wt.user_id = u.id
       ${where}
       ORDER BY (wt.status = 'pending') DESC, wt.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const [countRows] = await db.execute(`SELECT COUNT(*) AS cnt FROM wallet_topup_requests wt ${where}`, params);

    ok(res, {
      topups: rows,
      pagination: {
        total: Number(countRows[0].cnt), page, limit,
        totalPages: Math.ceil(Number(countRows[0].cnt) / limit),
      },
    });
  } catch (err) {
    console.error('adminListTopups error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Approve a bank-transfer top-up and credit the wallet
// @route   POST /api/wallet/admin/topups/:id/approve
// @access  Private/Admin
export const adminApproveTopup = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      'SELECT * FROM wallet_topup_requests WHERE id = ? AND status = ? FOR UPDATE',
      [id, 'pending']
    );
    if (!rows.length) {
      await conn.rollback();
      return fail(res, 404, 'Top-up request not found or already processed');
    }
    const topup = rows[0];

    const out = await credit({
      userId: topup.user_id,
      amount: num(topup.amount_bhd),
      type: 'deposit',
      description: `Wallet top-up via bank transfer (${topup.transaction_ref || `#${topup.id}`})`,
      triggerEvent: 'wallet_topup_bank',
      triggerRefId: topup.id,
      method: 'bank_transfer',
      createdBy: req.user.id,
      conn,
    });

    await conn.execute(
      `UPDATE wallet_topup_requests SET status = 'approved', processed_by = ?, processed_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    await conn.commit();
    ok(res, { message: 'Top-up approved and wallet credited', newBalance: out.balanceAfter });
  } catch (err) {
    await conn.rollback();
    if (err instanceof WalletError) return fail(res, 400, err.message);
    console.error('adminApproveTopup error:', err);
    fail(res, 500, 'Server error');
  } finally {
    conn.release();
  }
};

// @desc    Reject a top-up request
// @route   POST /api/wallet/admin/topups/:id/reject
// @access  Private/Admin
export const adminRejectTopup = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const [result] = await db.execute(
      `UPDATE wallet_topup_requests
       SET status = 'rejected', admin_note = ?, processed_by = ?, processed_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [reason || 'Rejected by admin', req.user.id, id]
    );
    if (result.affectedRows === 0) return fail(res, 404, 'Top-up request not found or already processed');
    ok(res, { message: 'Top-up request rejected' });
  } catch (err) {
    console.error('adminRejectTopup error:', err);
    fail(res, 500, 'Server error');
  }
};

// @desc    Wallet/referral monitoring overview
// @route   GET /api/wallet/admin/overview
// @access  Private/Admin
export const adminOverview = async (req, res) => {
  try {
    const [[totals], [referralTotals], [pendingTopups], rates] = await Promise.all([
      db.execute(
        `SELECT
           COALESCE(SUM(balance_bhd), 0)     AS total_balance,
           COALESCE(SUM(lifetime_earned), 0) AS total_earned,
           COALESCE(SUM(lifetime_used), 0)   AS total_used,
           COUNT(*)                          AS wallet_count
         FROM referral_wallet`
      ).then(([r]) => r),
      db.execute(
        `SELECT COUNT(*) AS total, SUM(status = 'rewarded') AS rewarded,
                SUM(status = 'pending') AS pending
         FROM referrals`
      ).then(([r]) => r),
      db.execute(`SELECT COUNT(*) AS cnt FROM wallet_topup_requests WHERE status = 'pending'`)
        .then(([r]) => r),
      currencyService.getRates(),
    ]);

    ok(res, {
      totalWalletBalance: Number(totals.total_balance || 0),
      totalEarned: Number(totals.total_earned || 0),
      totalUsed: Number(totals.total_used || 0),
      walletCount: Number(totals.wallet_count || 0),
      referrals: {
        total: Number(referralTotals.total || 0),
        rewarded: Number(referralTotals.rewarded || 0),
        pending: Number(referralTotals.pending || 0),
      },
      pendingTopups: Number(pendingTopups.cnt || 0),
      rates,
    });
  } catch (err) {
    console.error('adminOverview error:', err);
    fail(res, 500, 'Server error');
  }
};
