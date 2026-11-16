import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  BASE_CURRENCY,
  PAYMENT_CURRENCY,
  convertAmount,
  currencyForCountry,
  detectGuestCurrency,
  formatMoney,
} from '../utils/currency';

const CurrencyContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// IP-detected country is cached so we only ask the geo API occasionally, not on
// every page view. The key is versioned because older builds cached the
// server's "everything failed -> United States" fallback, which showed USD to
// visitors in other countries.
const GEO_COUNTRY_KEY = 'gsn_geo_country_v2';
const GEO_TTL_MS = 12 * 60 * 60 * 1000;

const readGeoCountry = () => {
  try {
    const raw = localStorage.getItem(GEO_COUNTRY_KEY);
    if (!raw) return null;
    const { country, at } = JSON.parse(raw);
    if (!country || Date.now() - (at || 0) > GEO_TTL_MS) return null;
    return country;
  } catch {
    return null;
  }
};

/**
 * Global currency state.
 *
 * Base prices are BHD (subscriptions, wallet, admin) while quote payments are
 * charged in USD. Every buyer sees the amount converted into their own country's
 * currency, with the USD equivalent shown underneath. Admins are based in
 * Bahrain, so they keep BHD as their primary currency plus the USD equivalent.
 */
export const CurrencyProvider = ({ children }) => {
  const [rates, setRates] = useState(null);
  const [countryCurrency, setCountryCurrency] = useState(null);
  const [meta, setMeta] = useState({ source: 'default', updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(readStoredUser);
  const [geoCountry, setGeoCountry] = useState(readGeoCountry);
  const rawUserRef = useRef(JSON.stringify(user));

  // ── Live FX table ─────────────────────────────────────────────────────────
  const refresh = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/wallet/currency-rate${force ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.rates) setRates(data.rates);
      if (data?.countryCurrency) setCountryCurrency(data.countryCurrency);
      setMeta({ source: data?.source || 'live', updatedAt: data?.updatedAt || null });
    } catch (err) {
      console.warn('Currency rate unavailable:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pull the authoritative profile so the country — and therefore the local
  // currency — is always right, even when the cached login payload predates the
  // country field.
  const syncProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const profile = (await res.json())?.user;
      if (!profile) return;
      const stored = readStoredUser() || {};
      if (profile.country === stored.country && profile.role === stored.role) return;
      const merged = { ...stored, ...profile };
      localStorage.setItem('user', JSON.stringify(merged));
      rawUserRef.current = JSON.stringify(merged);
      setUser(merged);
    } catch {
      /* profile is best-effort; cached country still applies */
    }
  }, []);

  // Detect the visitor's country from their IP address so nobody has to type in
  // where they are. The result is cached for 12h.
  const syncGeo = useCallback(async () => {
    if (readGeoCountry()) return;
    try {
      // The visitor's own timezone is sent along so the server can fall back to
      // it (instead of its own UTC timezone) when every IP lookup fails.
      const res = await fetch('/api/geo/country', {
        headers: { 'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || '' },
      });
      if (!res.ok) return;
      const body = await res.json();
      const name = body?.data?.country_name;
      if (!name) return;
      // Only cache a real IP lookup. A timezone/fallback guess must not stick
      // around for 12 hours, otherwise a wrong country keeps the wrong currency.
      if (!body?.data?.fallback_reason) {
        localStorage.setItem(GEO_COUNTRY_KEY, JSON.stringify({ country: name, at: Date.now() }));
      }
      setGeoCountry(name);
    } catch {
      /* best-effort; the profile or browser locale still applies */
    }
  }, []);

  useEffect(() => {
    refresh();
    syncProfile();
    syncGeo();
    // Keep the rate (and country) fresh while the tab stays open. The server
    // serves its cached table and refreshes from the FX API in the background
    // when it goes stale, so this stays cheap.
    const id = setInterval(() => {
      refresh();
      syncProfile();
    }, 60000);
    return () => clearInterval(id);
  }, [refresh, syncProfile, syncGeo]);

  // ── Keep the logged-in user (and therefore the country) in sync ───────────
  useEffect(() => {
    const sync = () => {
      const raw = localStorage.getItem('user');
      if (raw !== rawUserRef.current) {
        rawUserRef.current = raw;
        setUser(readStoredUser());
      }
    };
    const onFocus = () => {
      sync();
      syncProfile();
      syncGeo();
    };
    const id = setInterval(sync, 5000);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', onFocus);
    };
  }, [syncProfile, syncGeo]);

  const isAdmin = user?.role === 'admin';

  // Currency follows the country. For a logged-in user we ALWAYS trust the
  // country they registered with, because they may be browsing from a different
  // IP (VPN, travel, office proxy) yet still expect their own currency. Guests
  // fall back to the IP-detected location, then the browser locale, then USD.
  const localCurrency = useMemo(() => {
    return (
      currencyForCountry(user?.country, countryCurrency) ||
      currencyForCountry(geoCountry, countryCurrency) ||
      detectGuestCurrency(countryCurrency) ||
      PAYMENT_CURRENCY
    );
  }, [user?.country, geoCountry, countryCurrency]);

  // Where the displayed country came from — the saved profile, or the visitor's
  // IP location (shown to guests on public pricing pages).
  const countrySource = user?.country ? 'profile' : geoCountry ? 'geo' : null;

  const currency = isAdmin ? BASE_CURRENCY : localCurrency;

  const convert = useCallback(
    (amount, from = BASE_CURRENCY, to = currency) => convertAmount(amount, from, to, rates),
    [rates, currency]
  );

  const format = useCallback(
    (amount, from = BASE_CURRENCY) => formatMoney(convert(amount, from, currency), currency),
    [convert, currency]
  );

  const formatUsd = useCallback(
    (amount, from = BASE_CURRENCY) =>
      formatMoney(convert(amount, from, PAYMENT_CURRENCY), PAYMENT_CURRENCY),
    [convert]
  );

  const formatIn = useCallback(
    (amount, code, from = BASE_CURRENCY) => formatMoney(convert(amount, from, code), code),
    [convert]
  );

  /** Primary amount plus the USD equivalent for the small secondary line. */
  const both = useCallback(
    (amount, from = BASE_CURRENCY) => ({
      main: format(amount, from),
      sub: `≈ ${formatUsd(amount, from)}`,
    }),
    [format, formatUsd]
  );

  const value = useMemo(
    () => ({
      ready: !loading && !!rates,
      loading,
      rates,
      source: meta.source,
      updatedAt: meta.updatedAt,
      baseCurrency: BASE_CURRENCY,
      paymentCurrency: PAYMENT_CURRENCY,
      currency,
      localCurrency,
      secondaryCurrency: PAYMENT_CURRENCY,
      isAdmin,
      country: user?.country || geoCountry || null,
      countrySource,
      isGuest: !user?.id,
      convert,
      format,
      formatIn,
      formatUsd,
      both,
      refresh,
    }),
    [loading, rates, meta, currency, localCurrency, isAdmin, geoCountry, user?.country, user?.id, countrySource, convert, format, formatIn, formatUsd, both, refresh]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

/** Access the global currency state. Safe to call outside the provider (returns defaults). */
export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  // Defensive fallback so a component rendered outside the provider (or during
  // an early error boundary render) never crashes.
  return {
    ready: false,
    loading: false,
    rates: null,
    source: 'default',
    updatedAt: null,
    baseCurrency: BASE_CURRENCY,
    paymentCurrency: PAYMENT_CURRENCY,
    currency: PAYMENT_CURRENCY,
    localCurrency: PAYMENT_CURRENCY,
    secondaryCurrency: PAYMENT_CURRENCY,
    isAdmin: false,
    country: null,
    countrySource: null,
    isGuest: true,
    convert: (amount) => Number(amount) || 0,
    format: (amount) => formatMoney(amount, PAYMENT_CURRENCY),
    formatIn: (amount, code) => formatMoney(amount, code),
    formatUsd: (amount) => formatMoney(amount, PAYMENT_CURRENCY),
    both: (amount) => ({
      main: formatMoney(amount, PAYMENT_CURRENCY),
      sub: `≈ ${formatMoney(amount, PAYMENT_CURRENCY)}`,
    }),
    refresh: () => Promise.resolve(),
  };
};

export default CurrencyContext;
