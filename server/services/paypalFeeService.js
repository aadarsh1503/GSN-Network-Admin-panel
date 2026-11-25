// services/paypalFeeService.js
//
// PayPal processing-fee model used at checkout.
//
// IMPORTANT: PayPal exposes **no API** that returns its fee *rates* — those only
// exist as static pages on paypal.com and depend on the merchant country, the
// buyer country, domestic/international and the payment method. So the rates
// below are configuration (stored in general_settings, editable from the admin
// panel) and can optionally be *learned* from the merchant's own settled
// payments via PayPal's Transaction Search API, which does report the fee
// actually charged on each past transaction.
//
// At checkout the buyer is grossed up so the seller still nets the listed price:
//     charge = (base + fixed) / (1 - percent)
//
// Everything is in USD because that is the currency the PayPal orders are
// created in (see paypalService).

import db from '../config/db.js';
import paypalService from './paypalService.js';

const KEYS = {
  enabled: 'paypal_fee_enabled',
  merchantCountry: 'paypal_merchant_country',
  intlPct: 'paypal_fee_intl_pct',
  intlFixed: 'paypal_fee_intl_fixed',
  domesticPct: 'paypal_fee_domestic_pct',
  domesticFixed: 'paypal_fee_domestic_fixed',
  source: 'paypal_fee_source',
  lastSync: 'paypal_fee_last_sync',
  samples: 'paypal_fee_sample_count',
};

// Indicative defaults. The international figures come from PayPal's published
// Bahrain merchant fee table and MUST be confirmed against the account's own
// agreement. Domestic defaults match the international ones so the platform
// never under-charges by accident.
const DEFAULTS = {
  enabled: true,
  merchantCountry: 'Bahrain',
  intlPct: 4.9,
  intlFixed: 0.3,
  domesticPct: 4.9,
  domesticFixed: 0.3,
  source: 'default',
  lastSync: null,
  samples: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = { ...DEFAULTS };
let loadedAt = 0;
let loading = null;

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

/** Anything that is not the merchant's own country counts as international. */
export const isInternational = (country, cfg = cache) => {
  const buyer = String(country ?? '').trim().toLowerCase();
  const merchant = String(cfg.merchantCountry ?? '').trim().toLowerCase();
  if (!buyer) return true; // unknown buyer country → assume international (safer)
  if (!merchant) return false;
  return buyer !== merchant;
};

const parseConfig = (byKey) => ({
  enabled: byKey[KEYS.enabled] === undefined
    ? DEFAULTS.enabled
    : (byKey[KEYS.enabled] === '1' || byKey[KEYS.enabled] === 'true'),
  merchantCountry: String(byKey[KEYS.merchantCountry] ?? DEFAULTS.merchantCountry).trim() || DEFAULTS.merchantCountry,
  intlPct: Number.isFinite(Number(byKey[KEYS.intlPct])) ? Number(byKey[KEYS.intlPct]) : DEFAULTS.intlPct,
  intlFixed: Number.isFinite(Number(byKey[KEYS.intlFixed])) ? Number(byKey[KEYS.intlFixed]) : DEFAULTS.intlFixed,
  domesticPct: Number.isFinite(Number(byKey[KEYS.domesticPct])) ? Number(byKey[KEYS.domesticPct]) : DEFAULTS.domesticPct,
  domesticFixed: Number.isFinite(Number(byKey[KEYS.domesticFixed])) ? Number(byKey[KEYS.domesticFixed]) : DEFAULTS.domesticFixed,
  source: String(byKey[KEYS.source] ?? DEFAULTS.source),
  lastSync: byKey[KEYS.lastSync] || null,
  samples: Number(byKey[KEYS.samples]) || 0,
});

/** (Re)reads the fee configuration from general_settings into the cache. */
export const refreshFeeConfig = async () => {
  if (loading) return loading;
  loading = (async () => {
    try {
      const [rows] = await db.execute(
        'SELECT setting_key, setting_value FROM general_settings WHERE setting_key IN (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        Object.values(KEYS)
      );
      const byKey = {};
      rows.forEach((r) => { byKey[r.setting_key] = r.setting_value; });
      cache = parseConfig(byKey);
      loadedAt = Date.now();
    } catch (error) {
      // Table missing / cold DB — keep the previous (or default) values.
      console.error('ℹ️  Could not load PayPal fee settings:', error.message);
    } finally {
      loading = null;
    }
  })();
  return loading;
};

const ensureConfig = async () => {
  if (!loadedAt || Date.now() - loadedAt > CACHE_TTL_MS) await refreshFeeConfig();
};

const upsert = (key, value) => db.execute(
  `INSERT INTO general_settings (setting_key, setting_value, setting_type) VALUES (?, ?, 'text')
   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
  [key, String(value)]
);

/** Current fee configuration (never blocks on the network). */
export const getFeeConfig = async () => {
  await ensureConfig();
  return { ...cache };
};

/** Persists a partial fee configuration update and refreshes the cache. */
export const updateFeeConfig = async (patch = {}) => {
  // The admin can set any rate he needs (4.5%, 5%, 10%, …). 100% is the hard
  // ceiling because the gross-up divides by (1 - rate); anything above 99%
  // would explode the charged amount, so it is capped just below 100.
  const clampPct = (v) => Math.min(Math.max(Number(v) || 0, 0), 99);
  const clampFixed = (v) => Math.min(Math.max(Number(v) || 0, 0), 100);

  if (patch.enabled !== undefined) await upsert(KEYS.enabled, patch.enabled ? '1' : '0');
  if (patch.merchantCountry !== undefined) await upsert(KEYS.merchantCountry, String(patch.merchantCountry).trim());
  if (patch.intlPct !== undefined) await upsert(KEYS.intlPct, clampPct(patch.intlPct));
  if (patch.intlFixed !== undefined) await upsert(KEYS.intlFixed, clampFixed(patch.intlFixed));
  if (patch.domesticPct !== undefined) await upsert(KEYS.domesticPct, clampPct(patch.domesticPct));
  if (patch.domesticFixed !== undefined) await upsert(KEYS.domesticFixed, clampFixed(patch.domesticFixed));
  if (patch.source !== undefined) await upsert(KEYS.source, String(patch.source));

  await refreshFeeConfig();
  return { ...cache };
};

/**
 * Grosses a base USD amount up so the seller nets `baseUsd` after PayPal's fee.
 * Returns the fee breakdown the checkout shows the buyer.
 */
export const computeBreakdown = (baseUsd, international = true, cfg = cache) => {
  const base = round2(baseUsd);
  const hasFee = cfg.enabled && base > 0;
  const pct = international ? cfg.intlPct : cfg.domesticPct;
  const fixed = international ? cfg.intlFixed : cfg.domesticFixed;

  if (!hasFee) {
    return { enabled: false, base, fee: 0, total: base, percent: 0, fixed: 0, international };
  }

  const rate = Math.min(Math.max(Number(pct) || 0, 0), 99) / 100;
  const total = round2((base + (Number(fixed) || 0)) / (1 - rate));
  return {
    enabled: true,
    base,
    fee: round2(total - base),
    total,
    percent: Number(pct) || 0,
    fixed: Number(fixed) || 0,
    international,
  };
};

/** Breakdown for a buyer country (async: reads the cached config first). */
export const quoteForCountry = async (baseUsd, country) => {
  const cfg = await getFeeConfig();
  return {
    ...computeBreakdown(baseUsd, isInternational(country, cfg), cfg),
    merchantCountry: cfg.merchantCountry,
  };
};

/** Live (sync) breakdown from the cached config — for request handlers. */
export const breakdownSync = (baseUsd, country) => computeBreakdown(
  baseUsd,
  isInternational(country, cache),
  cache
);

// ── Learning the real fee from settled transactions ─────────────────────────

/**
 * Least-squares fit of fee = slope*amount + intercept.
 * Exported for testing; returns null when the samples cannot support a fit.
 */
export const fitLinear = (samples) => {
  const n = samples.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  samples.forEach(({ amount, fee }) => {
    sx += amount; sy += fee; sxy += amount * fee; sxx += amount * amount;
  });
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) return null;
  return { slope, intercept };
};

const learnGroup = (samples) => {
  const fit = fitLinear(samples);
  if (!fit) {
    // Too few points for a fit — fall back to the blended rate, no fixed part.
    const totalAmount = samples.reduce((a, s) => a + s.amount, 0);
    const totalFee = samples.reduce((a, s) => a + s.fee, 0);
    if (!(totalAmount > 0)) return null;
    return { pct: round2((totalFee / totalAmount) * 100), fixed: 0 };
  }
  return {
    pct: round2(Math.min(Math.max(fit.slope * 100, 0), 99)),
    fixed: round2(Math.min(Math.max(fit.intercept, 0), 100)),
  };
};

/**
 * Reads recent PayPal transactions and derives the effective fee rates from the
 * fees PayPal actually charged. Only USD transactions are used (that is what
 * checkout bills in). Updates the stored configuration and returns it.
 */
export const learnFeesFromPayPal = async ({ days = 30 } = {}) => {
  await paypalService.ensureConfig();
  if (!paypalService.isConfigured()) {
    throw new Error('PayPal is not configured on the server');
  }

  const cfg = await getFeeConfig();
  const end = new Date();
  const start = new Date(end.getTime() - Math.max(1, Number(days) || 30) * 86400000);

  const rows = await paypalService.searchTransactions({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  // Only settled, USD, positive payments tell us anything about the fee.
  const usable = rows.filter((r) =>
    r.currency === 'USD'
    && r.amount > 0
    && Number.isFinite(r.fee)
    && (!r.status || r.status === 'S' || r.status === 'COMPLETED')
  );

  const international = usable.filter((r) => isInternational(r.country, cfg));
  const domestic = usable.filter((r) => !isInternational(r.country, cfg));

  const learnedIntl = learnGroup(international);
  const learnedDomestic = learnGroup(domestic);

  if (!learnedIntl && !learnedDomestic) {
    throw new Error(`No usable USD transactions found in the last ${days} day(s). Nothing to learn yet.`);
  }

  const patch = { source: 'learned' };
  if (learnedIntl) { patch.intlPct = learnedIntl.pct; patch.intlFixed = learnedIntl.fixed; }
  if (learnedDomestic) { patch.domesticPct = learnedDomestic.pct; patch.domesticFixed = learnedDomestic.fixed; }

  const updated = await updateFeeConfig(patch);
  await upsert(KEYS.lastSync, new Date().toISOString());
  await upsert(KEYS.samples, usable.length);
  await refreshFeeConfig();

  return {
    ...updated,
    learned: {
      international: learnedIntl ? { ...learnedIntl, samples: international.length } : null,
      domestic: learnedDomestic ? { ...learnedDomestic, samples: domestic.length } : null,
      scanned: rows.length,
      usable: usable.length,
    },
  };
};

export default {
  isInternational,
  refreshFeeConfig,
  getFeeConfig,
  updateFeeConfig,
  computeBreakdown,
  quoteForCountry,
  breakdownSync,
  learnFeesFromPayPal,
};
