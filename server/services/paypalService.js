// services/paypalService.js
//
// Server-to-server PayPal integration used to *verify* (and, when the buyer has
// only approved the order, capture) payments made from the checkout SDK.
//
// This is what makes PayPal payments "direct": PayPal itself confirms the money,
// so annual memberships and wallet top-ups are activated/credited without any
// manual receipt upload or admin approval. Bank transfers stay manual.
//
// Credentials live in the ADMIN PANEL (general_settings), not in .env, so they
// can be rotated without a redeploy:
//   paypal_client_id      REST app client id
//   paypal_client_secret  REST app secret   <-- when empty, PayPal stays manual
//   paypal_webhook_id     only needed to verify webhook signatures
//   paypal_env            sandbox | live    (defaults to sandbox)
//
// The values are cached in memory: primed at boot, refreshed whenever an admin
// saves them, and re-read lazily once the cache goes stale.

import fetch from 'node-fetch';
import db from '../config/db.js';

const DEFAULT_CURRENCY = 'USD';

const SETTING_KEYS = {
  clientId: 'paypal_client_id',
  clientSecret: 'paypal_client_secret',
  webhookId: 'paypal_webhook_id',
  environment: 'paypal_env',
};

/** Keys that must never leave the server (excluded from every public response). */
export const SENSITIVE_SETTING_KEYS = [SETTING_KEYS.clientSecret, SETTING_KEYS.webhookId];

const CACHE_TTL_MS = 5 * 60 * 1000;

let config = { clientId: '', clientSecret: '', webhookId: '', environment: 'sandbox' };
let loadedAt = 0;
let loading = null;
// OAuth2 client-credentials token (cached until shortly before expiry).
let tokenCache = { token: null, expiresAt: 0 };

// PayPal credentials (client id, secret, webhook id) are single tokens that never
// contain whitespace. The PayPal dashboard wraps them across multiple lines, so a
// straight copy-paste can carry an internal newline — which would make every
// auth request fail with "Client Authentication failed". Strip ALL whitespace,
// not just the edges.
const cleanCredential = (value) => String(value ?? '').replace(/\s+/g, '');
const trim = (value) => String(value ?? '').trim();

/** (Re)reads the PayPal configuration from general_settings into the cache. */
export const refreshConfig = async () => {
  if (loading) return loading;
  loading = (async () => {
    try {
      const [rows] = await db.execute(
        'SELECT setting_key, setting_value FROM general_settings WHERE setting_key IN (?, ?, ?, ?)',
        Object.values(SETTING_KEYS)
      );
      const byKey = {};
      rows.forEach((row) => { byKey[row.setting_key] = row.setting_value; });
      const next = {
        clientId: cleanCredential(byKey[SETTING_KEYS.clientId]),
        clientSecret: cleanCredential(byKey[SETTING_KEYS.clientSecret]),
        webhookId: cleanCredential(byKey[SETTING_KEYS.webhookId]),
        environment: trim(byKey[SETTING_KEYS.environment]).toLowerCase() === 'live' ? 'live' : 'sandbox',
      };
      // A rotated app (or environment) invalidates the cached OAuth token.
      if (next.clientId !== config.clientId || next.clientSecret !== config.clientSecret || next.environment !== config.environment) {
        tokenCache = { token: null, expiresAt: 0 };
      }
      config = next;
      loadedAt = Date.now();
    } catch (error) {
      console.error('❌ Could not load PayPal settings:', error.message);
    } finally {
      loading = null;
    }
  })();
  return loading;
};

/**
 * Makes sure the cached credentials are loaded before they are used.
 * `isConfigured()` is synchronous, so callers that gate behaviour on it must
 * await this first — otherwise a cold cache would look "not configured".
 */
export const ensureConfig = async () => {
  if (!loadedAt || Date.now() - loadedAt > CACHE_TTL_MS) await refreshConfig();
};

const clientId = () => config.clientId;
const clientSecret = () => config.clientSecret;
const webhookId = () => config.webhookId;

/** True when the server holds the credentials needed to talk to PayPal. */
export const isConfigured = () => Boolean(clientId() && clientSecret());

/** Sandbox vs live. Sandbox is the safe default when nothing is configured. */
const isSandbox = () => config.environment !== 'live';

export const getEnvironment = () => (isSandbox() ? 'sandbox' : 'live');

const apiBase = () =>
  isSandbox() ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

// ── OAuth2 client-credentials token ──────────────────────────────────────────

export const getAccessToken = async () => {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  await ensureConfig();
  if (!isConfigured()) throw new Error('PayPal is not configured on the server');

  const auth = Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64');
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_description || 'Could not authenticate with PayPal');
  }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3000) * 1000,
  };
  return tokenCache.token;
};

const apiRequest = async (path, { method = 'GET', body } = {}) => {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const getOrder = async (orderId) => {
  const { ok, data } = await apiRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  if (!ok) throw new Error(data?.message || 'Could not fetch the PayPal order');
  return data;
};

export const captureOrder = async (orderId) => {
  const { ok, data } = await apiRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    { method: 'POST' }
  );
  if (!ok) throw new Error(data?.message || 'Could not capture the PayPal order');
  return data;
};

/** Normalises the parts of an order we care about. */
const summarize = (order) => {
  const unit = order?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const amount = capture?.amount || unit?.amount || {};
  const value = amount?.value != null ? Number(amount.value) : null;
  return {
    orderId: order?.id || null,
    intent: order?.intent || null,
    status: order?.status || null,
    currency: amount?.currency_code || null,
    amount: Number.isFinite(value) ? value : null,
    captureId: capture?.id || null,
    captureStatus: capture?.status || null,
    payerId: order?.payer?.payer_id || null,
  };
};

/**
 * Confirms an order server-to-server and returns a normalised summary.
 * If the buyer approved but the charge was never captured, the capture is
 * completed here so the payment is guaranteed to be settled.
 */
export const verifyOrder = async (orderId) => {
  let order = await getOrder(orderId);
  if (order?.status === 'APPROVED' && order?.intent === 'CAPTURE') {
    order = await captureOrder(orderId);
  }
  const summary = summarize(order);
  const paid =
    summary.status === 'COMPLETED' &&
    summary.captureStatus !== 'DECLINED' &&
    summary.captureStatus !== 'FAILED';
  return { ...summary, paid };
};

/**
 * Validates a verified order against the amount we expect to be charged.
 * Returns an error message string, or null when everything matches.
 */
export const assertAmount = (summary, expectedUsd, tolerance = 0.05) => {
  if (summary.currency && summary.currency !== DEFAULT_CURRENCY) {
    return `unexpected currency (${summary.currency})`;
  }
  if (summary.amount == null) {
    return 'the paid amount could not be read from PayPal';
  }
  if (expectedUsd != null && summary.amount + tolerance < Number(expectedUsd)) {
    return `paid $${summary.amount.toFixed(2)} but $${Number(expectedUsd).toFixed(2)} was required`;
  }
  return null;
};

// ── Reporting ────────────────────────────────────────────────────────────────

/**
 * Reads the merchant's settled transactions (GET /v1/reporting/transactions).
 *
 * PayPal never exposes its fee *rates*, but every settled payment does carry the
 * fee it actually charged. This lets us learn the effective fee from real money
 * instead of guessing. Returns a normalised list of { amount, fee, currency,
 * country, status, eventCode }.
 */
export const searchTransactions = async ({ startDate, endDate, pageSize = 100, maxPages = 5 } = {}) => {
  const rows = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const qs = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      page_size: String(pageSize),
      page: String(page),
      fields: 'transaction_info,payer_info',
    });
    const { ok, status, data } = await apiRequest(`/v1/reporting/transactions?${qs.toString()}`);
    if (!ok) {
      const reason = data?.message || data?.error_description || 'Could not read PayPal transactions';
      // PayPal reports missing scopes as a plain 403 "insufficient permissions",
      // which tells the admin nothing. Point them at the exact dashboard toggle.
      const name = String(data?.name || '');
      if (status === 403 || /insufficient permissions|AUTHORIZATION_ERROR|NOT_AUTHORIZED/i.test(`${name} ${reason}`)) {
        throw new Error(
          `PayPal refused the reporting call (${reason}). Enable the "Transaction Search" permission for this app: `
          + 'log in to the PayPal Developer Dashboard → My Apps & Credentials → open your app → Live/Sandbox → '
          + 'Features → tick "Transaction Search" and save, then try again. Until then, set the fee % manually.'
        );
      }
      throw new Error(reason);
    }
    const details = data?.transaction_details || [];
    details.forEach((d) => {
      const info = d?.transaction_info || {};
      // fee_amount / transaction_amount may be either an object or a bare string.
      const amountRaw = info.transaction_amount;
      const feeRaw = info.fee_amount;
      const amount = Number(typeof amountRaw === 'object' ? amountRaw?.value : amountRaw);
      const fee = Number(typeof feeRaw === 'object' ? feeRaw?.value : feeRaw);
      if (!Number.isFinite(amount) || !Number.isFinite(fee) || amount <= 0) return;
      rows.push({
        amount,
        fee,
        currency:
          (typeof amountRaw === 'object' ? amountRaw?.currency_code : null)
          || info.currency_code
          || null,
        country: d?.payer_info?.country_code || null,
        status: info.transaction_status || null,
        eventCode: info.transaction_event_code || null,
      });
    });
    if (details.length < pageSize) break;
  }
  return rows;
};

// ── Webhooks ─────────────────────────────────────────────────────────────────

/** Verifies a webhook signature with PayPal. Returns true when authentic. */
export const verifyWebhookSignature = async (headers, event) => {
  if (!webhookId()) return false;
  const { ok, data } = await apiRequest('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId(),
      webhook_event: event,
    },
  });
  return ok && data?.verification_status === 'SUCCESS';
};

export default {
  refreshConfig,
  ensureConfig,
  isConfigured,
  getEnvironment,
  getAccessToken,
  getOrder,
  captureOrder,
  verifyOrder,
  assertAmount,
  searchTransactions,
  verifyWebhookSignature,
};
