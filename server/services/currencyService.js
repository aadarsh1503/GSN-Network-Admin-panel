// services/currencyService.js
// Realtime multi-currency conversion.
//
// The platform prices everything in BHD (subscriptions, wallet, referrals) while
// quote payments are charged to PayPal in USD. Buyers however want to see the
// amount in their own local currency. So we fetch a single BHD-based rate table
// from a public FX API, cache it in memory + DB, and use it to convert BHD (or
// USD) into any world currency on the fly.
//
// 1 BHD = 2.6526 USD (official peg). Used until a live rate is fetched.

import db from '../config/db.js';

const DEFAULT_BHD_TO_USD = 2.6526;
const CACHE_TTL_MS = 15 * 60 * 1000; // refresh at most every 15 minutes
const FX_API_URL = process.env.CURRENCY_API_URL || 'https://open.er-api.com/v6/latest/BHD';

// Fallback table used only when the FX API is unreachable on a cold start.
const FALLBACK_RATES = {
  USD: 2.6526,
  BHD: 1,
  SAR: 9.95,
  AED: 9.7429,
  QAR: 9.6579,
  KWD: 0.8112,
  OMR: 1.0206,
  INR: 232.5,
  PKR: 738.5,
  BDT: 322.4,
  NPR: 377.4,
  LKR: 776.5,
  EUR: 2.4413,
  GBP: 2.0604,
  CNY: 18.85,
  JPY: 396.5,
  TRY: 90.5,
  EGP: 128.4,
  JOD: 1.8811,
  IQD: 3474.6,
  KES: 342.4,
  NGN: 4057.5,
  ZAR: 47.9,
  AUD: 4.0238,
  CAD: 3.6412,
  SGD: 3.5537,
  MYR: 11.87,
  IDR: 41975,
  PHP: 148.6,
  THB: 90.2,
  VND: 67420,
  KRW: 3585.4,
  HKD: 20.66,
  CHF: 2.2957,
  RUB: 240.9,
  BRL: 14.35,
  MXN: 48.6,
};

// Country (as stored in users.country, e.g. "India", "UAE") -> ISO currency code.
const COUNTRY_CURRENCY = {
  Bahrain: 'BHD', 'Saudi Arabia': 'SAR', UAE: 'AED', 'United Arab Emirates': 'AED',
  Qatar: 'QAR', Kuwait: 'KWD', Oman: 'OMR', Jordan: 'JOD', Iraq: 'IQD', Lebanon: 'LBP',
  Yemen: 'YER', Syria: 'SYP', Iran: 'IRR', Israel: 'ILS', Turkey: 'TRY', Egypt: 'EGP',
  Libya: 'LYD', Tunisia: 'TND', Algeria: 'DZD', Morocco: 'MAD', Sudan: 'SDG',
  'Western Sahara': 'MAD', Mauritania: 'MRU', Djibouti: 'DJF', Somalia: 'SOS',
  Ethiopia: 'ETB', Eritrea: 'ERN', Kenya: 'KES', Tanzania: 'TZS', Uganda: 'UGX',
  Rwanda: 'RWF', Burundi: 'BIF', 'South Sudan': 'SSP', Nigeria: 'NGN', Ghana: 'GHS',
  Senegal: 'XOF', Mali: 'XOF', 'Burkina Faso': 'XOF', 'Ivory Coast': 'XOF',
  "Cote d'Ivoire": 'XOF', "Côte d'Ivoire": 'XOF', Niger: 'XOF', Togo: 'XOF',
  Benin: 'XOF', Guinea: 'GNF', 'Guinea-Bissau': 'XOF', Gambia: 'GMD', 'Sierra Leone': 'SLE',
  Liberia: 'LRD', Cameroon: 'XAF', Chad: 'XAF', Gabon: 'XAF', Congo: 'XAF',
  'DR Congo': 'CDF', 'Democratic Republic of the Congo': 'CDF', Angola: 'AOA',
  Zambia: 'ZMW', Zimbabwe: 'ZWL', Malawi: 'MWK', Mozambique: 'MZN', Madagascar: 'MGA',
  Mauritius: 'MUR', Seychelles: 'SCR', Comoros: 'KMF', Botswana: 'BWP', Namibia: 'NAD',
  'South Africa': 'ZAR', Lesotho: 'LSL', Eswatini: 'SZL', Swaziland: 'SZL',
  India: 'INR', Pakistan: 'PKR', Bangladesh: 'BDT', Nepal: 'NPR', 'Sri Lanka': 'LKR',
  Bhutan: 'BTN', Afghanistan: 'AFN', Maldives: 'MVR', China: 'CNY',
  'Hong Kong': 'HKD', Macau: 'MOP', Taiwan: 'TWD', Japan: 'JPY', 'South Korea': 'KRW',
  'North Korea': 'KPW', Mongolia: 'MNT', Thailand: 'THB', Vietnam: 'VND',
  Cambodia: 'KHR', Laos: 'LAK', Myanmar: 'MMK', Malaysia: 'MYR', Singapore: 'SGD',
  Indonesia: 'IDR', Philippines: 'PHP', Brunei: 'BND', 'Timor-Leste': 'USD',
  Kazakhstan: 'KZT', Uzbekistan: 'UZS', Turkmenistan: 'TMT', Kyrgyzstan: 'KGS',
  Tajikistan: 'TJS', Azerbaijan: 'AZN', Armenia: 'AMD', Georgia: 'GEL',
  'United States': 'USD', USA: 'USD', Canada: 'CAD', Mexico: 'MXN', Belize: 'BZD',
  Guatemala: 'GTQ', Honduras: 'HNL', 'El Salvador': 'USD', Nicaragua: 'NIO',
  'Costa Rica': 'CRC', Panama: 'PAB', Cuba: 'CUP', 'Dominican Republic': 'DOP',
  Haiti: 'HTG', Jamaica: 'JMD', 'Trinidad and Tobago': 'TTD', Bahamas: 'BSD',
  Barbados: 'BBD', Guyana: 'GYD', Suriname: 'SRD', Brazil: 'BRL', Argentina: 'ARS',
  Chile: 'CLP', Peru: 'PEN', Colombia: 'COP', Venezuela: 'VES', Ecuador: 'USD',
  Bolivia: 'BOB', Paraguay: 'PYG', Uruguay: 'UYU', 'United Kingdom': 'GBP',
  Ireland: 'EUR', France: 'EUR', Germany: 'EUR', Spain: 'EUR', Portugal: 'EUR',
  Italy: 'EUR', Netherlands: 'EUR', Belgium: 'EUR', Luxembourg: 'EUR', Austria: 'EUR',
  Switzerland: 'CHF', Liechtenstein: 'CHF', Monaco: 'EUR', Andorra: 'EUR',
  Malta: 'EUR', Cyprus: 'EUR', Greece: 'EUR', Finland: 'EUR', Estonia: 'EUR',
  Latvia: 'EUR', Lithuania: 'EUR', Slovakia: 'EUR', Slovenia: 'EUR', Croatia: 'EUR',
  Bulgaria: 'BGN', Romania: 'RON', Poland: 'PLN', Czechia: 'CZK',
  'Czech Republic': 'CZK', Hungary: 'HUF', Denmark: 'DKK', Norway: 'NOK',
  Sweden: 'SEK', Iceland: 'ISK', Russia: 'RUB', Ukraine: 'UAH', Belarus: 'BYN',
  Moldova: 'MDL', Serbia: 'RSD', 'North Macedonia': 'MKD', Macedonia: 'MKD',
  Albania: 'ALL', Montenegro: 'EUR', 'Bosnia and Herzegovina': 'BAM', Kosovo: 'EUR',
  Australia: 'AUD', 'New Zealand': 'NZD', Fiji: 'FJD', 'Papua New Guinea': 'PGK',
  Samoa: 'WST', Tonga: 'TOP', Vanuatu: 'VUV', 'Solomon Islands': 'SBD',
  'New Caledonia': 'XPF', 'French Polynesia': 'XPF',
};

let cache = { bhdToUsd: DEFAULT_BHD_TO_USD, rates: { ...FALLBACK_RATES }, source: 'default', updatedAt: 0 };
let refreshInFlight = null;
let bootstrapped = false;

/** Read the last persisted rate table (used as fallback). */
const readRateFromDb = async () => {
  try {
    const [rows] = await db.execute(
      `SELECT setting_key, setting_value FROM wallet_settings
       WHERE setting_key IN ('bhd_usd_rate','bhd_usd_rate_source')`
    );
    const map = {};
    rows.forEach((r) => { map[r.setting_key] = r.setting_value; });

    // The full table is too large for wallet_settings.setting_value (varchar 255)
    // so it lives in general_settings, and we hydrate it on startup.
    let rates = null;
    try {
      const [full] = await db.execute(
        "SELECT setting_value FROM general_settings WHERE setting_key = 'fx_rates_json'"
      );
      const parsed = JSON.parse(full[0]?.setting_value || 'null');
      if (parsed && typeof parsed === 'object') rates = parsed;
    } catch { /* ignore malformed cache */ }

    const rate = Number(map.bhd_usd_rate);
    if (!rates && rate > 0) rates = { ...FALLBACK_RATES, USD: rate };

    if (rates) {
      cache = {
        bhdToUsd: Number(rates.USD) || (rate > 0 ? rate : DEFAULT_BHD_TO_USD),
        rates,
        source: map.bhd_usd_rate_source || 'db',
        updatedAt: Date.now(),
      };
    }
  } catch {
    /* table may not exist yet — ignore, defaults apply */
  }
};

const writeSetting = async (key, value) => {
  await db.execute(
    `INSERT INTO wallet_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, String(value)]
  );
};

const persistRate = async (rates, source) => {
  try {
    await writeSetting('bhd_usd_rate', rates.USD);
    await writeSetting('bhd_usd_rate_source', source);
    await db.execute(
      `INSERT INTO general_settings (setting_key, setting_value, setting_type) VALUES ('fx_rates_json', ?, 'text')
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(rates)]
    );
  } catch (e) {
    console.log('ℹ️  Could not persist FX rate:', e.message);
  }
};

/** Fetch a fresh BHD-based rate table from the live FX API. Never throws. */
export const refreshBhdToUsdRate = async () => {
  try {
    if (typeof fetch !== 'function') return cache;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(FX_API_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`FX API responded ${resp.status}`);
    const data = await resp.json();
    const usd = Number(data?.rates?.USD);
    if (!usd || usd <= 0) throw new Error('FX API returned no USD rate');

    // Keep only sane, positive entries and make sure BHD maps to itself.
    const rates = { BHD: 1 };
    Object.entries(data?.rates || {}).forEach(([code, value]) => {
      const n = Number(value);
      if (n > 0 && /^[A-Z]{3}$/.test(code)) rates[code] = n;
    });
    rates.USD = usd;

    cache = { bhdToUsd: usd, rates, source: 'live', updatedAt: Date.now() };
    await persistRate(rates, 'live');
    console.log(`💱 FX table refreshed: 1 BHD = ${usd} USD (${Object.keys(rates).length} currencies)`);
  } catch (e) {
    console.log(`ℹ️  FX refresh skipped (${e.message}); using cached rate ${cache.bhdToUsd}`);
  }
  return cache;
};

/** Get the current rate table. Never blocks on the external FX API. */
export const getRates = async () => {
  if (!bootstrapped) {
    bootstrapped = true;
    await readRateFromDb();
    // Very first run ever (nothing cached): pay the one-time cost of a live
    // fetch so the very first page load already shows real rates.
    if (!cache.updatedAt) await refreshBhdToUsdRate();
  }
  // Serve the cached table straight away. When it is stale, kick off a single
  // background refresh instead of awaiting the external API — callers such as
  // the wallet/checkout endpoints must stay fast even if the FX API is slow.
  if (Date.now() - cache.updatedAt > CACHE_TTL_MS && !refreshInFlight) {
    refreshInFlight = refreshBhdToUsdRate()
      .catch(() => cache)
      .finally(() => { refreshInFlight = null; });
  }
  const bhdToUsd = cache.bhdToUsd;
  return {
    base: 'BHD',
    bhdToUsd,
    usdToBhd: bhdToUsd > 0 ? Number((1 / bhdToUsd).toFixed(6)) : 0,
    rates: cache.rates,
    countryCurrency: COUNTRY_CURRENCY,
    source: cache.source,
    updatedAt: new Date(cache.updatedAt || Date.now()).toISOString(),
  };
};

/** Synchronous accessor for the last known rate (no network). */
export const getBhdToUsdSync = () => cache.bhdToUsd;

/** Synchronous accessor for the last known BHD-based rate table. */
export const getRatesSync = () => ({ ...cache.rates, USD: cache.bhdToUsd });

/** ISO currency code for a country name, with a safe USD fallback. */
export const countryToCurrency = (country) => {
  if (!country) return 'USD';
  return COUNTRY_CURRENCY[String(country).trim()] || 'USD';
};

/**
 * Convert between any two currencies using the BHD-based table.
 * Returns a number rounded to `decimals` (default: currency-aware).
 */
export const convert = (amount, from = 'BHD', to = 'BHD') => {
  const value = Number(amount) || 0;
  const rates = getRatesSync();
  if (from === to) return value;
  const fromRate = from === 'BHD' ? 1 : Number(rates[from]);
  const toRate = to === 'BHD' ? 1 : Number(rates[to]);
  if (!fromRate || !toRate) return value;
  return (value / fromRate) * toRate;
};

export const bhdToUsd = (amountBhd) =>
  Number((Number(amountBhd) * getBhdToUsdSync()).toFixed(2));

export const usdToBhd = (amountUsd) =>
  Number((Number(amountUsd) / (getBhdToUsdSync() || DEFAULT_BHD_TO_USD)).toFixed(3));

export default {
  getRates,
  refreshBhdToUsdRate,
  getBhdToUsdSync,
  getRatesSync,
  countryToCurrency,
  convert,
  bhdToUsd,
  usdToBhd,
  DEFAULT_BHD_TO_USD,
  COUNTRY_CURRENCY,
};

export { COUNTRY_CURRENCY, DEFAULT_BHD_TO_USD };
