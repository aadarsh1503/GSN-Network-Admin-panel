// controllers/subscriptionController.js
import db from '../config/db.js';
import { createInvoice } from './invoiceController.js';
import { queueSubscriptionEmails } from '../services/emailQueue.js';
import { sendSubscriptionPaymentProofNotificationToAdmin } from '../services/adminNotificationService.js';
import { processReferralReward } from '../services/referralService.js';
import { getSettings as getWalletSettings, getWallet, debit as walletDebit, credit as walletCredit, WalletError } from '../services/walletService.js';
import couponService from '../services/couponService.js';
import paypalService from '../services/paypalService.js';
import currencyService from '../services/currencyService.js';
import paypalFeeService from '../services/paypalFeeService.js';

/**
 * Normalises the optional annual price of a plan. Returns null when the admin
 * has not set one, which means the plan is not offered on a yearly cycle.
 */
const normalizeYearlyPrice = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const n = parseFloat(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * Normalises a plan limit coming from the admin UI.
 * -1 (or blank/NaN) means "unlimited"; 0 is preserved so a plan can
 * explicitly allow no quotes/responses. The old `value || -1` pattern
 * silently turned 0 into unlimited.
 */
const normalizeLimit = (value) => {
    if (value === null || value === undefined || value === '') return -1;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : -1;
};

/**
 * Adds whole months to a date (UTC) and clamps the day to the target month's
 * length, so we never overflow into the following month (31 Jan + 1 month
 * → 28/29 Feb, not 3 Mar).
 */
const addMonthsClamped = (date, months) => {
    const result = new Date(date.getTime());
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));
    return result;
};

/**
 * Validates and normalises an optional wallet contribution for a subscription
 * payment. Returns { amount, remaining, error }.
 */
const resolveWalletContribution = async (userId, totalAmount, rawWalletAmount) => {
    const total = Number(totalAmount) || 0;
    const requested = Math.max(0, parseFloat(rawWalletAmount) || 0);
    if (!(requested > 0)) return { amount: 0, remaining: total };
    try {
        const settings = await getWalletSettings();
        if (!settings.walletSubscriptionEnabled) {
            return { amount: 0, remaining: total, error: 'Wallet payments are currently disabled' };
        }
        const wallet = await getWallet(userId);
        const maxPct = Math.min(100, Math.max(0, Number(settings.walletMaxUsagePercent) || 100));
        const maxUsable = Math.min(wallet.balance, (total * maxPct) / 100);
        const minUsage = Number(settings.walletMinUsageBhd) || 0;
        if (minUsage > 0 && requested < minUsage) {
            return { amount: 0, remaining: total, error: `Minimum wallet usage is ${minUsage} BHD` };
        }
        if (requested > maxUsable + 0.001) {
            return { amount: 0, remaining: total, error: `You can use at most ${maxUsable.toFixed(3)} BHD from your wallet for this plan` };
        }
        const amount = Number(Math.min(requested, total).toFixed(3));
        return { amount, remaining: Number((total - amount).toFixed(3)) };
    } catch (e) {
        console.error('resolveWalletContribution error:', e);
        return { amount: 0, remaining: total, error: 'Could not validate wallet balance' };
    }
};

/**
 * Self-heals stale pending PayPal requests.
 *
 * If PayPal could not be verified at checkout time — credentials were missing,
 * or the browser call died after the capture — the request is left `pending`
 * and the company is then blocked with "You already have a pending subscription
 * request" even though the money left PayPal. Here we ask PayPal what really
 * happened and finish the job: a paid order is activated, an order PayPal says
 * was voided/expired is released.
 *
 * No-op when PayPal is not configured, so it is safe to call on every read.
 */
const reconcilePaypalRequests = async (userId) => {
    await paypalService.ensureConfig();
    if (!paypalService.isConfigured()) return;

    let rows = [];
    try {
        const [pending] = await db.execute(
            `SELECT id, paypal_order_id
             FROM subscription_requests
             WHERE user_id = ? AND status = 'pending'
               AND payment_method = 'paypal'
               AND paypal_order_id IS NOT NULL
               AND created_at <= (NOW() - INTERVAL 60 SECOND)`,
            [userId]
        );
        rows = pending;
    } catch (e) {
        console.error('❌ PayPal reconcile lookup failed:', e.message);
        return;
    }

    for (const row of rows) {
        try {
            const order = await paypalService.verifyOrder(row.paypal_order_id);

            if (order.paid) {
                await finalizeSubscriptionRequest(row.id, { actorId: null, actorIsAdmin: false });
                console.log(`✅ Recovered PayPal payment for request #${row.id} (order ${row.paypal_order_id})`);
                continue;
            }

            // PayPal is the source of truth: a voided/expired order will never
            // be charged, so release the request instead of leaving it stuck.
            const status = String(order.status || '').toUpperCase();
            if (status === 'VOIDED' || status === 'EXPIRED') {
                await db.execute(
                    `UPDATE subscription_requests
                     SET status = 'rejected', rejection_reason = 'PayPal payment was not completed', processed_at = NOW()
                     WHERE id = ? AND status = 'pending'`,
                    [row.id]
                );
                console.log(`↩️ Released unpaid PayPal request #${row.id} (status ${status})`);
            }
        } catch (e) {
            // Unknown order / API hiccup — leave it for the webhook or an admin
            // rather than guessing about the customer's money.
            console.error(`⚠️ PayPal reconcile failed for request #${row.id}:`, e.message);
        }
    }
};

// @desc    Whether PayPal can confirm payment directly (auto-activation ready)
// @route   GET /api/subscriptions/paypal-status
// @access  Private
const getPaypalStatus = async (req, res) => {
    try {
        await paypalService.ensureConfig();
        res.status(200).json({
            configured: paypalService.isConfigured(),
            environment: paypalService.getEnvironment(),
        });
    } catch (error) {
        console.error('Error fetching PayPal status:', error);
        res.status(200).json({ configured: false, environment: 'sandbox' });
    }
};

// @desc    Get all membership plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = async (req, res) => {
    try {
        const sql = `SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY price ASC`;
        const [rows] = await db.execute(sql);
        
        // Parse features JSON
        const plans = rows.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : []
        }));

        res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ message: 'Server error fetching plans' });
    }
};

// @desc    Get user's current subscription
// @route   GET /api/subscriptions/my-subscription
// @access  Private
const getMySubscription = async (req, res) => {
    const userId = req.user.id;

    try {
        // Finish any PayPal payment that was captured but never confirmed.
        await reconcilePaypalRequests(userId);

        // Check for pending subscription request
        const pendingSql = `
            SELECT COUNT(*) as pending_count
            FROM subscription_requests
            WHERE user_id = ? AND status = 'pending'
        `;
        const [pendingRows] = await db.execute(pendingSql, [userId]);
        const hasPendingRequest = pendingRows[0].pending_count > 0;

        const sql = `
            SELECT us.*, mp.name as plan_name, mp.price as plan_price, mp.features, mp.max_quotes, mp.max_responses
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
            ORDER BY us.end_date DESC
            LIMIT 1
        `;

        const [rows] = await db.execute(sql, [userId]);
        
        if (rows.length === 0) {
            // Return guest plan info with pending request flag
            return res.status(200).json({
                plan_name: 'Guest',
                status: 'active',
                features: ['View directory', 'Submit quotes', 'Basic support'],
                max_quotes: 5,
                max_responses: 0,
                is_guest: true,
                pending_request: hasPendingRequest
            });
        }

        const subscription = rows[0];
        subscription.features = subscription.features ? JSON.parse(subscription.features) : [];
        subscription.pending_request = hasPendingRequest;

        res.status(200).json(subscription);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Server error fetching subscription' });
    }
};

// @desc    Create a new plan (Admin)
// @route   POST /api/subscriptions/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    const { name, description, price, yearlyPrice, durationMonths, features, maxQuotes, maxResponses, directoryListing, prioritySupport } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Name and price are required' });
    }

    try {
        const sql = `
            INSERT INTO membership_plans 
            (name, description, price, yearly_price, duration_months, features, max_quotes, max_responses, directory_listing, priority_support)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const featuresJson = JSON.stringify(features || []);
        const values = [
            name, description, price, normalizeYearlyPrice(yearlyPrice), durationMonths || 1, featuresJson,
            normalizeLimit(maxQuotes), normalizeLimit(maxResponses), directoryListing ? 1 : 0, prioritySupport ? 1 : 0
        ];

        const [result] = await db.execute(sql, values);

        res.status(201).json({
            message: 'Plan created successfully',
            planId: result.insertId
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ message: 'Server error creating plan' });
    }
};

// @desc    Update a plan (Admin)
// @route   PUT /api/subscriptions/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, yearlyPrice, durationMonths, features, maxQuotes, maxResponses, directoryListing, prioritySupport, isActive } = req.body;

    try {
        const sql = `
            UPDATE membership_plans SET
            name = ?, description = ?, price = ?, yearly_price = ?, duration_months = ?, features = ?,
            max_quotes = ?, max_responses = ?, directory_listing = ?, priority_support = ?, is_active = ?
            WHERE id = ?
        `;

        const featuresJson = JSON.stringify(features || []);
        const values = [
            name, description, price, normalizeYearlyPrice(yearlyPrice), durationMonths || 1, featuresJson,
            normalizeLimit(maxQuotes), normalizeLimit(maxResponses), directoryListing ? 1 : 0, prioritySupport ? 1 : 0, isActive ? 1 : 0, id
        ];

        await db.execute(sql, values);

        res.status(200).json({ message: 'Plan updated successfully' });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ message: 'Server error updating plan' });
    }
};

// @desc    Get all plans (Admin)
// @route   GET /api/subscriptions/admin/plans
// @access  Private/Admin
const getAllPlans = async (req, res) => {
    try {
        const sql = `SELECT * FROM membership_plans ORDER BY price ASC`;
        const [rows] = await db.execute(sql);
        
        const plans = rows.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : []
        }));

        res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching all plans:', error);
        res.status(500).json({ message: 'Server error fetching plans' });
    }
};

/**
 * Finalises a *pending* subscription request — expires any old subscription,
 * charges the wallet portion, creates the new active subscription, consumes
 * the coupon, raises the invoice, sends the emails and fires the referral
 * reward.
 *
 * Shared by the admin approval endpoint and by the PayPal auto-activation
 * path (PayPal confirms the payment server-side, so no manual step is needed).
 *
 * @param {number} requestId  subscription_requests.id
 * @param {object} options
 * @param {number|null} options.actorId   user performing the action (admin id
 *                                        normally; null for system/PayPal)
 * @param {boolean} options.actorIsAdmin  controls who is named in the emails
 * @returns {Promise<{subscriptionId:number, invoiceId:any, planName:string,
 *                    startDate:Date, endDate:Date, amountPaid:number}>}
 */
const finalizeSubscriptionRequest = async (requestId, { actorId = null, actorIsAdmin = true } = {}) => {
    // The plan's own duration/price are aliased away from the request's columns:
    // the request stores the terms the buyer actually paid for (e.g. a 12-month
    // yearly cycle), which must win over the plan's default 1-month duration.
    const requestSql = `
        SELECT sr.*, mp.duration_months AS plan_default_months, mp.name as plan_name
        FROM subscription_requests sr
        JOIN membership_plans mp ON sr.plan_id = mp.id
        WHERE sr.id = ? AND sr.status = 'pending'
    `;
    const [requestRows] = await db.execute(requestSql, [requestId]);

    if (requestRows.length === 0) {
        const err = new Error('Subscription request not found or already processed');
        err.statusCode = 404;
        throw err;
    }

    const request = requestRows[0];

    // 🔄 EXPIRE OLD SUBSCRIPTION IF EXISTS
    await db.execute(`
        UPDATE user_subscriptions 
        SET status = 'expired', 
            end_date = CURDATE() 
        WHERE user_id = ? 
        AND status = 'active'
    `, [request.user_id]);

    // Duration is clamped to >= 1 month and month-end is handled safely
    // so the end date can never land on a same-day/overflow date.
    const durationMonths = Math.max(
        1,
        parseInt(request.duration_months, 10) || parseInt(request.plan_default_months, 10) || 1
    );
    const startDate = new Date();
    const endDate = addMonthsClamped(startDate, durationMonths);

    // amount_paid holds the final discounted amount; fall back to the
    // coupon final amount, else the plan price recorded on the request.
    const toNum = (v) => (v === null || v === undefined || v === '') ? null : parseFloat(v);
    const amountPaid =
        toNum(request.amount_paid) ??
        toNum(request.final_amount_bhd) ??
        toNum(request.plan_price);

    // 💳 Deduct the wallet contribution — the external payment is confirmed now,
    // so this is the point where a wallet deduction is finalised.
    const walletAppliedAmount = toNum(request.wallet_amount_applied) || 0;
    if (walletAppliedAmount > 0) {
        try {
            await walletDebit({
                userId: request.user_id,
                amount: walletAppliedAmount,
                type: 'subscription_payment',
                description: `Subscription purchase — ${request.plan_name} (wallet portion)`,
                triggerEvent: 'subscription_wallet',
                triggerRefId: request.id,
                method: 'wallet',
                createdBy: actorId || request.user_id,
            });
        } catch (e) {
            if (e instanceof WalletError) {
                const err = new Error(`Cannot activate: company wallet no longer has enough balance (${e.message})`);
                err.statusCode = 400;
                throw err;
            }
            throw e;
        }
    }

    // Create NEW subscription
    const subscriptionSql = `
        INSERT INTO user_subscriptions 
        (user_id, plan_id, start_date, end_date, status, payment_status, payment_method, amount_paid, transaction_id, proration_applied, proration_details, coupon_code, coupon_discount_bhd, final_amount_bhd, wallet_amount_applied)
        VALUES (?, ?, ?, ?, 'active', 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [subscriptionResult] = await db.execute(subscriptionSql, [
        request.user_id,
        request.plan_id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        request.payment_method || 'bank_transfer',
        amountPaid,
        request.transaction_id,
        request.proration_applied || 0,
        request.proration_details || null,
        request.coupon_code || null,
        request.coupon_discount_bhd ?? null,
        request.final_amount_bhd ?? null,
        walletAppliedAmount
    ]);

    // Update request status
    await db.execute(
        `UPDATE subscription_requests SET status = 'approved', processed_at = NOW() WHERE id = ?`,
        [requestId]
    );

    // 🎟️ Consume coupon (single-use) on successful approval.
    // Falls back to the coupon code when no redemption was locked at
    // payment time, so a used coupon is never left showing as available.
    if (request.coupon_code) {
        try {
            await couponService.consumeForOrder({
                userId: request.user_id,
                identifier: request.coupon_code,
                orderType: 'subscription',
                orderRefId: request.transaction_id,
                orderAmount: toNum(request.plan_price) ?? amountPaid,
                discountAmount: toNum(request.coupon_discount_bhd),
                finalAmount: toNum(request.final_amount_bhd) ?? amountPaid,
            });
        } catch (e) { console.error('❌ Coupon consume error:', e); }
    } else if (request.coupon_redemption_id) {
        try { await couponService.confirmRedemption(request.coupon_redemption_id); }
        catch (e) { console.error('❌ Coupon confirm error:', e); }
    }

    // Create invoice with actual amount paid
    const invoiceResult = await createInvoice(subscriptionResult.insertId, amountPaid, 0);

    // Admin details — the acting admin, or the system when PayPal auto-confirms
    let admin = { name: 'GSN Network', email: process.env.ADMIN_EMAIL || 'admin@system.com' };
    if (actorIsAdmin && actorId) {
        const [adminRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [actorId]);
        admin = adminRows[0] || admin;
    }

    const [companyRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [request.user_id]);
    const company = companyRows[0];

    // 🚀 QUEUE EMAIL WORKFLOW - Payment Approved (NON-BLOCKING)
    queueSubscriptionEmails.paymentApproved({
        companyId: request.user_id,
        companyName: company.name || 'N/A',
        companyEmail: company.email,
        planName: request.plan_name,
        startDate: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        expiryDate: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        invoiceId: invoiceResult.invoiceNumber,
        adminId: actorId,
        adminName: admin.name || 'Admin',
        adminEmail: admin.email
    }).then(jobId => {
        console.log(`✅ Payment approval emails queued (Job ID: ${jobId})`);
    }).catch(error => {
        console.error('❌ Failed to queue payment approval emails:', error);
    });

    // 🎁 REFERRAL REWARD — fire for company role on first subscription approval
    processReferralReward(request.user_id, 'subscription_approved', {
        baseAmount: toNum(request.plan_price) ?? amountPaid,
    }).catch(err =>
        console.error('❌ Referral reward (subscription_approved) error:', err)
    );

    return {
        subscriptionId: subscriptionResult.insertId,
        invoiceId: invoiceResult.invoiceId,
        invoiceNumber: invoiceResult.invoiceNumber,
        planName: request.plan_name,
        startDate,
        endDate,
        amountPaid,
    };
};

// @desc    Activate subscription (with PayPal or manual payment)
// @route   POST /api/subscriptions/activate
// @access  Private
const activateSubscription = async (req, res) => {
    const userId = req.user.id;
    const { 
        planId, 
        paymentMethod = 'manual',
        orderId,
        payerId,
        paymentDetails,
        prorationApplied,
        prorationDetails,
        couponRedemptionId,
        couponCode,
        couponDiscount,
        couponFinalAmount,
        walletAmountApplied = 0,
        billingCycle = 'monthly'
    } = req.body;

    if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
    }

    const isYearly = String(billingCycle).toLowerCase() === 'yearly';

    try {
        // Check if plan exists and is active
        const planSql = `SELECT * FROM membership_plans WHERE id = ? AND is_active = 1`;
        const [planRows] = await db.execute(planSql, [planId]);
        
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        const plan = planRows[0];

        // A yearly purchase bills 12 months up-front at the plan's annual price.
        // When the admin has not set an annual price we fall back to 10× the
        // monthly rate.
        const monthlyPrice = parseFloat(plan.price);
        const yearlyPrice = normalizeYearlyPrice(plan.yearly_price);
        const planPrice = isYearly
            ? (yearlyPrice ?? Number((monthlyPrice * 10).toFixed(2)))
            : monthlyPrice;
        const planDuration = isYearly ? 12 : (parseInt(plan.duration_months, 10) || 1);

        // Get user details
        const userSql = `SELECT * FROM users WHERE id = ?`;
        const [userRows] = await db.execute(userSql, [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Recover a PayPal payment that was captured but never confirmed, so the
        // customer is not blocked by a pending row that PayPal has already settled.
        await reconcilePaypalRequests(userId);

        // Check if user already has a pending request
        const existingRequestSql = `
            SELECT * FROM subscription_requests 
            WHERE user_id = ? AND status = 'pending'
        `;
        const [existingRequestRows] = await db.execute(existingRequestSql, [userId]);

        if (existingRequestRows.length > 0) {
            return res.status(400).json({ message: 'You already have a pending subscription request' });
        }

        // Check if user already has an active subscription
        const existingSql = `
            SELECT us.*, mp.price as plan_price, mp.name as plan_name
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
            ORDER BY us.end_date DESC
            LIMIT 1
        `;
        const [existingRows] = await db.execute(existingSql, [userId]);

        let isUpgrade = false;
        let oldSubscription = null;

        if (existingRows.length > 0) {
            oldSubscription = existingRows[0];
            const currentPrice = parseFloat(oldSubscription.plan_price);
            const newPrice = planPrice;

            // Check if it's an upgrade
            if (newPrice > currentPrice) {
                isUpgrade = true;
            } else if (newPrice <= currentPrice && oldSubscription.plan_id !== planId) {
                // Prevent downgrade or same price plan change
                return res.status(400).json({ 
                    message: 'Downgrading is not available. Please contact support for assistance.' 
                });
            } else if (oldSubscription.plan_id === planId) {
                return res.status(400).json({ message: 'You already have this plan active' });
            }
        }

        // Determine amount paid (with proration / coupon if applicable)
        let amountPaid = prorationApplied && prorationDetails 
            ? parseFloat(prorationDetails.amountToCharge)
            : planPrice;
        if (couponFinalAmount && !isNaN(parseFloat(couponFinalAmount))) {
            amountPaid = parseFloat(couponFinalAmount);
        }

        // 💳 Optional wallet contribution (partial payment).
        // The wallet is only debited at approval time, so a failed external
        // payment never finalises the deduction.
        const walletApplied = await resolveWalletContribution(userId, amountPaid, walletAmountApplied);
        if (walletApplied.error) {
            return res.status(400).json({ message: walletApplied.error });
        }
        const externalAmount = walletApplied.remaining;

        // Record the request first: it is the audit trail for every payment
        // channel. For PayPal it is flipped to 'approved' right below once
        // PayPal confirms the charge; bank transfers stay 'pending' for review.
        const requestSql = `
            INSERT INTO subscription_requests 
            (user_id, plan_id, transaction_id, payment_method, payment_proof_url, status, company_name, user_name, user_email, user_phone, plan_name, plan_price, duration_months, paypal_order_id, paypal_payer_id, proration_applied, proration_details, is_upgrade, old_subscription_id, amount_paid, coupon_code, coupon_discount_bhd, final_amount_bhd, coupon_redemption_id, wallet_amount_applied, external_amount_bhd)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const paymentProofUrl = paymentMethod === 'paypal' ? 'PayPal Payment' : null;
        const transactionId = orderId || `TXN-${Date.now()}`;

        const [result] = await db.execute(requestSql, [
            userId,
            planId,
            transactionId,
            paymentMethod,
            paymentProofUrl,
            user.name || 'N/A',
            user.name,
            user.email,
            user.phone || null,
            plan.name,
            planPrice,
            planDuration,
            orderId || null,
            payerId || null,
            prorationApplied ? 1 : 0,
            prorationDetails ? JSON.stringify(prorationDetails) : null,
            isUpgrade ? 1 : 0,
            oldSubscription ? oldSubscription.id : null,
            amountPaid,
            couponCode || null,
            couponDiscount || null,
            amountPaid,
            couponRedemptionId || null,
            walletApplied.amount,
            externalAmount
        ]);

        // 🎟️ Confirm coupon redemption — PayPal payment was already captured
        if (couponRedemptionId) {
            try { await couponService.confirmRedemption(couponRedemptionId); }
            catch (e) { console.error('❌ Coupon confirm error:', e); }
        }

        // 💳 PayPal → verify server-to-server and activate immediately.
        // The buyer already approved the order in the checkout SDK and PayPal is
        // the source of truth, so no receipt upload / admin approval is needed.
        // Bank transfers keep the manual approval path untouched.
        let activation = null;
        if (paymentMethod === 'paypal' && externalAmount > 0) {
            // isConfigured() reads a cache, so make sure it is loaded first —
            // a cold cache would otherwise look like "PayPal is not set up".
            await paypalService.ensureConfig();
        }
        if (paymentMethod === 'paypal' && externalAmount > 0 && paypalService.isConfigured()) {
            try {
                const order = await paypalService.verifyOrder(orderId);

                if (!order.paid) {
                    // Nothing was captured — the buyer never completed the payment.
                    await db.execute('DELETE FROM subscription_requests WHERE id = ? AND status = ?', [result.insertId, 'pending']);
                    return res.status(402).json({ message: 'PayPal did not confirm this payment. Please try again.' });
                }

                // The buyer paid the grossed-up amount (base + PayPal's processing
                // fee) so the plan price still nets out. Fees are only charged on
                // the PayPal path — bank transfers are untouched.
                const baseUsd = currencyService.bhdToUsd(externalAmount);
                const expectedUsd = paypalFeeService.breakdownSync(baseUsd, user.country).total;
                const amountError = paypalService.assertAmount(order, expectedUsd, 0.5);
                if (amountError) {
                    // Money is in — never reject, route it to the manual queue.
                    console.warn(`⚠️ PayPal amount mismatch for order ${orderId} (${amountError}) — queued for manual review`);
                } else {
                    activation = await finalizeSubscriptionRequest(result.insertId, { actorId: null, actorIsAdmin: false });
                    console.log(`✅ Subscription auto-activated via PayPal order ${orderId} (capture ${order.captureId})`);
                }
            } catch (verifyError) {
                // Never lose a payment: fall back to the manual review queue.
                console.error('❌ PayPal verification failed, queued for manual review:', verifyError.message);
            }
        }

        // Manual paths only — tell the customer their proof is in and flag it for
        // the admins. A PayPal auto-activation has already emailed everyone.
        if (!activation) {
            // 🚀 QUEUE EMAIL WORKFLOW - Payment Proof Submitted (NON-BLOCKING)
            queueSubscriptionEmails.paymentProofSubmitted({
                companyId: userId,
                companyName: user.name || 'N/A',
                companyEmail: user.email,
                planName: plan.name,
                planDuration: `${planDuration} month${planDuration > 1 ? 's' : ''}`,
                planPrice: `${amountPaid}`,
                paymentMethod: paymentMethod === 'paypal' ? 'PayPal' : paymentMethod,
                transactionReference: transactionId,
                subscriptionId: result.insertId
            }).then(jobId => {
                console.log(`✅ Payment proof submission emails queued (Job ID: ${jobId})`);
            }).catch(error => {
                console.error('❌ Failed to queue payment proof submission emails:', error);
            });

            // 🔔 CREATE ADMIN NOTIFICATION - Subscription Payment Proof Submitted
            try {
                await sendSubscriptionPaymentProofNotificationToAdmin(
                    userId,
                    user.name || 'N/A',
                    plan.name,
                    amountPaid,
                    transactionId,
                    result.insertId
                );
            } catch (notificationError) {
                console.error('❌ Failed to create admin notification for subscription payment proof:', notificationError);
                // Don't fail the request if notification creation fails
            }
        }

        res.status(201).json({
            message: activation
                ? (isUpgrade
                    ? 'Upgrade completed successfully. Your new plan is now active.'
                    : 'Payment received. Your membership is now active.')
                : (isUpgrade
                    ? 'Upgrade request submitted successfully. Admin will review and approve.'
                    : 'Subscription request submitted successfully. Admin will review and approve.'),
            requestId: result.insertId,
            planName: plan.name,
            status: activation ? 'approved' : 'pending',
            autoActivated: Boolean(activation),
            subscriptionId: activation ? activation.subscriptionId : null,
            amountPaid,
            isUpgrade,
            oldPlan: oldSubscription ? oldSubscription.plan_name : null
        });

    } catch (error) {
        console.error('Error activating subscription:', error);
        res.status(500).json({ message: 'Server error activating subscription' });
    }
};

// @desc    Get all subscriptions (Admin)
// @route   GET /api/subscriptions/admin/all
// @access  Private/Admin
const getAllSubscriptions = async (req, res) => {
    try {
        const sql = `
            SELECT us.*, u.name as user_name, u.email as user_email, mp.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            ORDER BY us.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching subscriptions' });
    }
};

// @desc    Delete a plan (Admin)
// @route   DELETE /api/subscriptions/admin/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if plan exists
        const checkSql = `SELECT * FROM membership_plans WHERE id = ?`;
        const [planRows] = await db.execute(checkSql, [id]);
        
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check if plan has active subscriptions
        const subscriptionSql = `
            SELECT COUNT(*) as count FROM user_subscriptions 
            WHERE plan_id = ? AND status = 'active' AND end_date >= CURDATE()
        `;
        const [subscriptionRows] = await db.execute(subscriptionSql, [id]);
        
        if (subscriptionRows[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete plan with active subscriptions. Deactivate it instead.' 
            });
        }

        // Delete the plan
        const deleteSql = `DELETE FROM membership_plans WHERE id = ?`;
        await db.execute(deleteSql, [id]);

        res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ message: 'Server error deleting plan' });
    }
};

// @desc    Submit bank transfer subscription request
// @route   POST /api/subscriptions/bank-transfer-request
// @access  Private
const submitBankTransferRequest = async (req, res) => {
    const userId = req.user.id;
    const { planId, transactionId, paymentMethod = 'bank_transfer', prorationApplied, prorationDetails, couponCode, couponFinalAmount, walletAmountApplied = 0, billingCycle = 'monthly' } = req.body;

    if (!planId || !transactionId) {
        return res.status(400).json({ message: 'Plan ID and transaction ID are required' });
    }

    const isYearly = String(billingCycle).toLowerCase() === 'yearly';

    if (!req.file) {
        return res.status(400).json({ message: 'Payment proof image is required' });
    }

    try {
        // Check if plan exists and is active
        const planSql = `SELECT * FROM membership_plans WHERE id = ? AND is_active = 1`;
        const [planRows] = await db.execute(planSql, [planId]);
        
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        const plan = planRows[0];

        // Yearly billing covers 12 months at the annual price (fallback 10× monthly).
        const monthlyPrice = parseFloat(plan.price);
        const yearlyPrice = normalizeYearlyPrice(plan.yearly_price);
        const planPrice = isYearly
            ? (yearlyPrice ?? Number((monthlyPrice * 10).toFixed(2)))
            : monthlyPrice;
        const planDuration = isYearly ? 12 : (parseInt(plan.duration_months, 10) || 1);

        // Get user details
        const userSql = `SELECT * FROM users WHERE id = ?`;
        const [userRows] = await db.execute(userSql, [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Release/settle any stale PayPal request before blocking a new one.
        await reconcilePaypalRequests(userId);

        // Check if user already has a pending request
        const existingRequestSql = `
            SELECT * FROM subscription_requests 
            WHERE user_id = ? AND status = 'pending'
        `;
        const [existingRows] = await db.execute(existingRequestSql, [userId]);

        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'You already have a pending subscription request' });
        }

        // Check if user already has an active subscription (for upgrade detection)
        const existingSql = `
            SELECT us.*, mp.price as plan_price, mp.name as plan_name
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
            ORDER BY us.end_date DESC
            LIMIT 1
        `;
        const [existingSubRows] = await db.execute(existingSql, [userId]);

        let isUpgrade = false;
        let oldSubscription = null;

        if (existingSubRows.length > 0) {
            oldSubscription = existingSubRows[0];
            const currentPrice = parseFloat(oldSubscription.plan_price);
            const newPrice = planPrice;

            // Check if it's an upgrade
            if (newPrice > currentPrice) {
                isUpgrade = true;
            }
        }

        // Parse proration details
        let parsedProrationDetails = null;
        if (prorationDetails) {
            try {
                parsedProrationDetails = typeof prorationDetails === 'string' 
                    ? JSON.parse(prorationDetails) 
                    : prorationDetails;
            } catch (e) {
                console.error('Error parsing proration details:', e);
            }
        }

        // Calculate amount paid with proration
        let amountPaid = prorationApplied && parsedProrationDetails 
            ? parseFloat(parsedProrationDetails.amountToCharge)
            : planPrice;

        // 🎟️ Lock coupon (single-use enforcement) before creating the request
        let couponRedemptionId = null;
        let couponDiscount = null;
        if (couponCode) {
            try {
                const lock = await couponService.lockForOrder({
                    userId,
                    identifier: couponCode,
                    orderType: 'subscription',
                    orderRefId: `bank-${Date.now()}`,
                    orderAmount: amountPaid,
                });
                couponRedemptionId = lock.redemptionId;
                couponDiscount = lock.discountAmount;
                amountPaid = lock.finalAmount;
            } catch (e) {
                return res.status(400).json({ message: e.message || 'Could not apply coupon' });
            }
        }

        // 💳 Optional wallet contribution (partial payment)
        const walletApplied = await resolveWalletContribution(userId, amountPaid, walletAmountApplied);
        if (walletApplied.error) {
            return res.status(400).json({ message: walletApplied.error });
        }
        const externalAmount = walletApplied.remaining;

        // Store the subscription request with proration data
        const requestSql = `
            INSERT INTO subscription_requests 
            (user_id, plan_id, transaction_id, payment_method, payment_proof_url, status, company_name, user_name, user_email, user_phone, plan_name, plan_price, duration_months, proration_applied, proration_details, is_upgrade, old_subscription_id, amount_paid, coupon_code, coupon_discount_bhd, final_amount_bhd, coupon_redemption_id, wallet_amount_applied, external_amount_bhd)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const paymentProofUrl = req.file.path; // Cloudinary URL

        const [result] = await db.execute(requestSql, [
            userId,
            planId,
            transactionId,
            paymentMethod,
            paymentProofUrl,
            user.name || 'N/A', // Use name as company_name
            user.name,
            user.email,
            user.phone || null,
            plan.name,
            planPrice,
            planDuration,
            prorationApplied ? 1 : 0,
            parsedProrationDetails ? JSON.stringify(parsedProrationDetails) : null,
            isUpgrade ? 1 : 0,
            oldSubscription ? oldSubscription.id : null,
            amountPaid,
            couponCode || null,
            couponDiscount,
            amountPaid,
            couponRedemptionId,
            walletApplied.amount,
            externalAmount
        ]);

        // 🚀 QUEUE EMAIL WORKFLOW - Payment Proof Submitted (NON-BLOCKING)
        queueSubscriptionEmails.paymentProofSubmitted({
            companyId: userId,
            companyName: user.name || 'N/A',
            companyEmail: user.email,
            planName: plan.name,
            planDuration: `${planDuration} month${planDuration > 1 ? 's' : ''}`,
            planPrice: `$${amountPaid}`,
            paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod,
            transactionReference: transactionId,
            subscriptionId: result.insertId
        }).then(jobId => {
            console.log(`✅ Payment proof submission emails queued (Job ID: ${jobId})`);
        }).catch(error => {
            console.error('❌ Failed to queue payment proof submission emails:', error);
        });

        // 🔔 CREATE ADMIN NOTIFICATION - Subscription Payment Proof Submitted
        try {
            await sendSubscriptionPaymentProofNotificationToAdmin(
                userId,
                user.name || 'N/A',
                plan.name,
                amountPaid,
                transactionId,
                result.insertId
            );
        } catch (notificationError) {
            console.error('❌ Failed to create admin notification for subscription payment proof:', notificationError);
            // Don't fail the request if notification creation fails
        }

        res.status(201).json({
            message: isUpgrade 
                ? 'Upgrade request submitted successfully. Admin will review and approve.' 
                : 'Subscription request submitted successfully. Admin will review and approve.',
            requestId: result.insertId,
            status: 'pending',
            amountPaid,
            isUpgrade,
            oldPlan: oldSubscription ? oldSubscription.plan_name : null
        });

    } catch (error) {
        console.error('Error submitting subscription request:', error);
        res.status(500).json({ message: 'Server error submitting subscription request' });
    }
};

// @desc    Get all subscription requests (Admin)
// @route   GET /api/admin-panel/subscription-requests
// @access  Private/Admin
const getSubscriptionRequests = async (req, res) => {
    try {
        const sql = `
            SELECT sr.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.name as company_name,
                   mp.name as plan_name, mp.price as plan_price, mp.duration_months
            FROM subscription_requests sr
            JOIN users u ON sr.user_id = u.id
            JOIN membership_plans mp ON sr.plan_id = mp.id
            WHERE sr.status = 'pending'
            ORDER BY sr.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching subscription requests:', error);
        res.status(500).json({ message: 'Server error fetching subscription requests' });
    }
};

// @desc    Get subscription request details (Admin)
// @route   GET /api/admin-panel/subscription-requests/:id
// @access  Private/Admin
const getSubscriptionRequestDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            SELECT sr.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.name as company_name,
                   mp.name as plan_name, mp.price as plan_price, mp.duration_months, mp.features
            FROM subscription_requests sr
            JOIN users u ON sr.user_id = u.id
            JOIN membership_plans mp ON sr.plan_id = mp.id
            WHERE sr.id = ?
        `;

        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subscription request not found' });
        }

        const request = rows[0];
        request.features = request.features ? JSON.parse(request.features) : [];

        res.status(200).json(request);
    } catch (error) {
        console.error('Error fetching subscription request details:', error);
        res.status(500).json({ message: 'Server error fetching request details' });
    }
};

// @desc    Approve subscription request (Admin)
// @route   POST /api/admin-panel/subscription-requests/:id/approve
// @access  Private/Admin
const approveSubscriptionRequest = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await finalizeSubscriptionRequest(id, { actorId: req.user.id });

        res.status(200).json({
            message: 'Subscription request approved successfully',
            subscriptionId: result.subscriptionId,
            invoiceId: result.invoiceId
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Error approving subscription request:', error);
        res.status(500).json({ message: 'Server error approving subscription request' });
    }
};

// @desc    Reject subscription request (Admin)
// @route   POST /api/admin-panel/subscription-requests/:id/reject
// @access  Private/Admin
const rejectSubscriptionRequest = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'Rejection reason is required' });
    }

    try {
        // Check if request exists and is pending
        const requestSql = `SELECT * FROM subscription_requests WHERE id = ? AND status = 'pending'`;
        const [requestRows] = await db.execute(requestSql, [id]);
        
        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Subscription request not found or already processed' });
        }

        const request = requestRows[0];

        // Update request status
        await db.execute(
            `UPDATE subscription_requests SET status = 'rejected', rejection_reason = ?, processed_at = NOW() WHERE id = ?`,
            [reason, id]
        );

        // 💳 Refund the wallet portion back to the company.
        // The wallet is debited when the admin approves, so if a deduction for
        // this request already exists (e.g. it was approved and later reversed)
        // the exact same amount is credited back on rejection. Idempotent —
        // a request is only ever refunded once.
        const walletApplied = Number(request.wallet_amount_applied) || 0;
        if (walletApplied > 0) {
            try {
                const [debits] = await db.execute(
                    `SELECT id FROM referral_transactions
                     WHERE user_id = ? AND trigger_event = 'subscription_wallet'
                       AND trigger_ref_id = ? AND type = 'subscription_payment' AND status = 'completed'
                     LIMIT 1`,
                    [request.user_id, id]
                );
                const [refunds] = await db.execute(
                    `SELECT id FROM referral_transactions
                     WHERE user_id = ? AND trigger_event = 'subscription_refund' AND trigger_ref_id = ?
                     LIMIT 1`,
                    [request.user_id, id]
                );

                if (debits.length > 0 && refunds.length === 0) {
                    await walletCredit({
                        userId: request.user_id,
                        amount: walletApplied,
                        type: 'refund',
                        description: `Wallet refund — subscription request rejected (${request.plan_name || 'plan'})`,
                        triggerEvent: 'subscription_refund',
                        triggerRefId: id,
                        createdBy: req.user.id,
                    });
                    console.log(`✅ Wallet refunded ${walletApplied} BHD to company #${request.user_id} (request #${id})`);
                }
            } catch (e) {
                console.error('❌ Wallet refund on rejection failed:', e);
            }
        }

        // 🎟️ Release coupon redemption — payment was not completed
        if (request.coupon_redemption_id) {
            try { await couponService.releaseRedemption({ redemptionId: request.coupon_redemption_id, reason: 'Subscription request rejected' }); }
            catch (e) { console.error('❌ Coupon release error:', e); }
        } else if (request.coupon_code) {
            try { await couponService.releaseByOrder({ orderType: 'subscription', orderRefId: request.transaction_id, reason: 'Subscription request rejected' }); }
            catch (e) { console.error('❌ Coupon release error:', e); }
        }

        // Get admin and company details for email
        const adminId = req.user.id;
        const [adminRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [adminId]);
        const admin = adminRows[0] || { name: 'Admin', email: 'admin@system.com' };

        const [companyRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [request.user_id]);
        const company = companyRows[0];

        // 🚀 QUEUE EMAIL WORKFLOW - Payment Rejected (NON-BLOCKING)
        queueSubscriptionEmails.paymentRejected({
            companyId: request.user_id,
            companyName: company.name || 'N/A',
            companyEmail: company.email,
            planName: request.plan_name,
            rejectionReason: reason,
            correctionNeeded: 'Please review the rejection reason and resubmit with correct payment proof.',
            adminId: adminId,
            adminName: admin.name || 'Admin',
            adminEmail: admin.email
        }).then(jobId => {
            console.log(`✅ Payment rejection emails queued (Job ID: ${jobId})`);
        }).catch(error => {
            console.error('❌ Failed to queue payment rejection emails:', error);
        });

        // Send notification to user (you can implement this)
        // await sendNotification(request.user_id, 'subscription_rejected', { reason });

        res.status(200).json({
            message: 'Subscription request rejected successfully'
        });

    } catch (error) {
        console.error('Error rejecting subscription request:', error);
        res.status(500).json({ message: 'Server error rejecting subscription request' });
    }
};

// @desc    Get company subscription transactions
// @route   GET /api/company/subscription-transactions
// @access  Private/Company
const getCompanySubscriptionTransactions = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT 
                us.id,
                us.start_date,
                us.end_date,
                us.status,
                us.payment_status,
                us.payment_method,
                us.amount_paid,
                us.transaction_id,
                us.created_at,
                mp.name as plan_name,
                mp.duration_months,
                mp.price as plan_price,
                'subscription' as type
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching company subscription transactions:', error);
        res.status(500).json({ message: 'Server error fetching subscription transactions' });
    }
};

export {
    getPlans,
    getMySubscription,
    activateSubscription,
    getPaypalStatus,
    createPlan,
    updatePlan,
    getAllPlans,
    getAllSubscriptions,
    deletePlan,
    submitBankTransferRequest,
    getSubscriptionRequests,
    getSubscriptionRequestDetails,
    approveSubscriptionRequest,
    rejectSubscriptionRequest,
    getCompanySubscriptionTransactions,
    finalizeSubscriptionRequest
};
