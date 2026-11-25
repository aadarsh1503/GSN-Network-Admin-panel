// utils/currency.js
// Pure helpers for multi-currency display. The platform prices in BHD
// (subscriptions, wallet, admin) and charges quote payments in USD, but each
// buyer should see the amount in their own local currency with the USD
// equivalent alongside.
//
// No React here on purpose — these helpers are safe to call from anywhere.

// Used only when the live country→currency map from the server is unavailable.
export const FALLBACK_COUNTRY_CURRENCY = {
  Bahrain: 'BHD', 'Saudi Arabia': 'SAR', UAE: 'AED', 'United Arab Emirates': 'AED',
  Qatar: 'QAR', Kuwait: 'KWD', Oman: 'OMR', Jordan: 'JOD', Iraq: 'IQD', Egypt: 'EGP',
  Turkey: 'TRY', India: 'INR', Pakistan: 'PKR', Bangladesh: 'BDT', Nepal: 'NPR',
  'Sri Lanka': 'LKR', Maldives: 'MVR', China: 'CNY', Japan: 'JPY', 'South Korea': 'KRW',
  Thailand: 'THB', Vietnam: 'VND', Malaysia: 'MYR', Singapore: 'SGD', Indonesia: 'IDR',
  Philippines: 'PHP', Kazakhstan: 'KZT', 'United States': 'USD', USA: 'USD',
  Canada: 'CAD', Mexico: 'MXN', Brazil: 'BRL', Argentina: 'ARS', Chile: 'CLP',
  'United Kingdom': 'GBP', Germany: 'EUR', France: 'EUR', Italy: 'EUR', Spain: 'EUR',
  Netherlands: 'EUR', Portugal: 'EUR', Ireland: 'EUR', Switzerland: 'CHF',
  Sweden: 'SEK', Norway: 'NOK', Denmark: 'DKK', Poland: 'PLN', Russia: 'RUB',
  Ukraine: 'UAH', 'South Africa': 'ZAR', Nigeria: 'NGN', Kenya: 'KES', Ghana: 'GHS',
  Ethiopia: 'ETB', Tanzania: 'TZS', Uganda: 'UGX', Morocco: 'MAD', Algeria: 'DZD',
  Tunisia: 'TND', Australia: 'AUD', 'New Zealand': 'NZD',
};

export const BASE_CURRENCY = 'BHD';
export const PAYMENT_CURRENCY = 'USD';

/** ISO currency code for a country name, or null when unknown. */
export const currencyForCountry = (country, map) => {
  if (!country) return null;
  const name = String(country).trim();
  if (!name) return null;
  return (map && map[name]) || FALLBACK_COUNTRY_CURRENCY[name] || null;
};

/**
 * Best-effort currency for a browser locale / timezone when we have no profile
 * country (guest visitors). e.g. 'en-IN' -> 'India' -> 'INR'.
 */
export const currencyForLocale = (locale, map) => {
  if (!locale || typeof locale !== 'string') return null;
  const parts = locale.split('-');
  if (parts.length < 2) return null;
  const region = parts[parts.length - 1].toUpperCase();
  if (!/^[A-Z]{2}$/.test(region)) return null;
  try {
    const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(region);
    return currencyForCountry(countryName, map);
  } catch {
    return null;
  }
};

/** Guest fallback: guess the country currency from the browser locale. */
export const detectGuestCurrency = (map) => {
  if (typeof navigator === 'undefined') return null;
  const locales = [navigator.language, ...(navigator.languages || [])];
  for (const locale of locales) {
    const code = currencyForLocale(locale, map);
    if (code) return code;
  }
  return null;
};

/**
 * Convert between any two currencies using the BHD-based rate table
 * ({ BHD: 1, USD: 2.6526, INR: 232.5, ... }).
 */
export const convertAmount = (amount, from, to, rates) => {
  const value = Number(amount) || 0;
  if (!from || !to || from === to || !rates) return value;
  const fromRate = from === BASE_CURRENCY ? 1 : Number(rates[from]);
  const toRate = to === BASE_CURRENCY ? 1 : Number(rates[to]);
  if (!fromRate || !toRate) return value;
  return (value / fromRate) * toRate;
};

const formatterCache = new Map();

const getFormatter = (code) => {
  if (formatterCache.has(code)) return formatterCache.get(code);
  let formatter;
  try {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      // 'symbol' instead of 'narrowSymbol' so ambiguous glyphs stay readable
      // (e.g. CNY -> "CN¥" rather than "¥", which also means Japanese Yen).
      currencyDisplay: 'symbol',
    });
  } catch {
    try {
      formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: code });
    } catch {
      formatter = null;
    }
  }
  formatterCache.set(code, formatter);
  return formatter;
};

/** Format an amount in the given ISO currency, e.g. formatMoney(120, 'INR'). */
export const formatMoney = (amount, code) => {
  const value = Number(amount) || 0;
  if (!code) return value.toFixed(2);
  const formatter = getFormatter(code);
  if (!formatter) return `${code} ${value.toFixed(2)}`;
  return formatter.format(value);
};

/** Compact "≈ $146.10" style secondary line. */
export const formatSecondary = (amount, code = PAYMENT_CURRENCY) =>
  `≈ ${formatMoney(amount, code)}`;
