// API utility with proper token handling and loading states

const API_BASE_URL = ''; // Use relative URLs with Vite proxy

// Endpoints that never need a session. A stale/expired token left in
// localStorage must never bounce a guest off a public page (home, /quote,
// /subscriptions, directories...), so these bypass all token handling.
const PUBLIC_ENDPOINTS = [
  '/api/user/login',
  '/api/user/register',
  '/api/user/forgot-password',
  '/api/user/reset-password',
  '/api/subscriptions/plans',
  '/api/wallet/currency-rate',
  '/api/geo/',
  '/api/logistics-categories',
  '/api/business-categories',
  '/api/contact',
  '/api/public',
];

const isPublicEndpoint = (endpoint) =>
  typeof endpoint === 'string' && PUBLIC_ENDPOINTS.some((p) => endpoint.startsWith(p));

// Token management
export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if token is expired or will expire soon (within 30 minutes)
export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    const isExpired = payload.exp < currentTime;
    
    return isExpired;
  } catch (error) {
    return true;
  }
};

// Check if token will expire soon (within 10 minutes) - reduced from 30 minutes
export const isTokenExpiringSoon = (token) => {
  if (!token) {
    return true;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    const tenMinutesFromNow = currentTime + (10 * 60); // 10 minutes in seconds - reduced from 30
    
    return payload.exp < tenMinutesFromNow;
  } catch (error) {
    return true;
  }
};

// Refresh token function
export const refreshAuthToken = async () => {
  const currentToken = getToken();
  
  if (!currentToken || isTokenExpired(currentToken)) {
    throw new Error('No valid token to refresh');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/user/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    // Update stored token and user data
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data.token;
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    removeToken();
    throw error;
  }
};

// Handle authentication failures and redirect
const handleAuthFailure = (error, accountIssueType = null) => {
  // Add persistent logging to track when this is called
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] AUTH_FAILURE: ${error.message} - Current path: ${window.location.pathname} - Issue: ${accountIssueType}`;
  
  try {
    const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
    logs.unshift(logEntry);
    if (logs.length > 50) logs.splice(50);
    localStorage.setItem('auth_debug_logs', JSON.stringify(logs));
  } catch (e) {
    // Silent fail for logging
  }
  
  removeToken();
  
  // Show appropriate message based on account issue type
  if (accountIssueType === 'deactivated') {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('accountDeactivated', {
        detail: { message: error.message }
      }));
    }
  } else if (accountIssueType === 'blacklisted') {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('accountBlacklisted', {
        detail: { message: error.message }
      }));
    }
  }
  
  // Only redirect if we're not already on login/public pages
  const currentPath = window.location.pathname;
  const publicPaths = [
    '/login', '/register', '/user-register', '/forgot-password', '/reset-password',
    '/', '/unauthorized', '/subscriptions', '/payment', '/blacklist',
    '/business-directory', '/company-directory', '/company/freight-quotes',
  ];

  if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/quote')) {
    // Use window.location to force a full page redirect and clear any cached state
    window.location.href = '/login';
  }
  
  throw error;
};

// API request wrapper with proper error handling, retry logic, and automatic token refresh
export const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  const maxRetries = 3;
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
  
  // Track request details
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();
  
  let token = getToken();
  const isPublic = isPublicEndpoint(endpoint);

  // Public endpoints must work for guests. If a stale token is sitting in
  // localStorage we simply ignore it here — otherwise the expiry check below
  // would clear the session and redirect the visitor to /login even though the
  // page they are on is public (e.g. /subscriptions).
  if (isPublic) {
    token = null;
  }

  // Check if token needs refreshing (expired or expiring soon)
  if (!isPublic && token && (isTokenExpired(token) || isTokenExpiringSoon(token))) {
    try {
      // Only refresh if token is not completely expired
      if (!isTokenExpired(token)) {
        token = await refreshAuthToken();
      } else {
        // Token is completely expired, redirect to login
        const error = new Error('Authentication failed: Your session has expired. Please login again.');
        handleAuthFailure(error);
        return;
      }
    } catch (refreshError) {
      const error = new Error('Authentication failed: Unable to refresh session. Please login again.');
      handleAuthFailure(error);
      return;
    }
  }

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Explicitly add Authorization header after spread to ensure it's not overridden
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Handle FormData for file uploads
  if (options.body instanceof FormData) {
    // Remove Content-Type header for FormData to let browser set it with boundary
    delete config.headers['Content-Type'];
    config.body = options.body;
  } else if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const fetchStartTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    const fetchEndTime = Date.now();
    const fetchDuration = fetchEndTime - fetchStartTime;
    
    // Handle different response types
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token validation errors. Public endpoints are skipped — they may
      // legitimately fail for guests and must not clear the session/redirect.
      if (!isPublic && (response.status === 401 || response.status === 403)) {
        // Check if this is a token validation error vs a role authorization error
        const isTokenError = errorData.message && (
          errorData.message.includes('token') || 
          errorData.message.includes('expired') ||
          errorData.message.includes('invalid') ||
          errorData.message.includes('not found')
        );
        
        const isRoleError = errorData.message && errorData.message.includes('not authorized to access this route');
        const isAccountDeactivated = errorData.accountDeactivated === true;
        const isAccountBlacklisted = errorData.accountBlacklisted === true;
        
        if (isTokenError || isAccountDeactivated || isAccountBlacklisted) {
          // Handle token issues, account deactivation, and blacklisting
          const error = new Error('Authentication failed: ' + (errorData.message || 'Please login again'));
          const issueType = isAccountDeactivated ? 'deactivated' : isAccountBlacklisted ? 'blacklisted' : null;
          handleAuthFailure(error, issueType);
          return;
        } else if (isRoleError) {
          // For role errors, just throw the error without clearing localStorage
          throw new Error(errorData.message || `Access denied: ${response.status}`);
        } else {
          // For other 401/403 errors, be cautious and clear localStorage
          const error = new Error('Authentication failed: ' + (errorData.message || 'Please login again'));
          handleAuthFailure(error);
          return;
        }
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      return responseData;
    }
    
    const responseText = await response.text();
    return responseText;
  } catch (error) {
    const errorTime = Date.now();
    
    // ECONNRESET TRACKING
    if (error.message.includes('ECONNRESET')) {
      // Log to localStorage for debugging
      try {
        const econnresetLogs = JSON.parse(localStorage.getItem('econnreset_debug_logs') || '[]');
        econnresetLogs.unshift({
          timestamp: new Date().toISOString(),
          endpoint,
          method: config.method,
          retryCount,
          error: error.message,
          stack: error.stack,
          userAgent: navigator.userAgent,
          currentPath: window.location.pathname
        });
        if (econnresetLogs.length > 20) econnresetLogs.splice(20);
        localStorage.setItem('econnreset_debug_logs', JSON.stringify(econnresetLogs));
      } catch (e) {
        // Silent fail for logging
      }
    }
    
    // If it's an auth error, it's already handled above
    if (error.message.includes('Authentication failed')) {
      throw error;
    }
    
    // Handle network errors with retry logic
    const isNetworkError = error.name === 'TypeError' || 
                          error.message.includes('ECONNRESET') ||
                          error.message.includes('ENOTFOUND') ||
                          error.message.includes('ECONNREFUSED') ||
                          error.message.includes('fetch');
    
    if (isNetworkError && retryCount < maxRetries) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Retry the request
      return apiRequest(endpoint, options, retryCount + 1);
    }
    
    // If all retries failed or it's not a network error, throw the error
    throw error;
  }
};

// Specific API methods
export const api = {
  // GET request
  get: async (endpoint, options = {}) => {
    return apiRequest(endpoint, { method: 'GET', ...options });
  },

  // POST request
  post: async (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  },

  // PUT request
  put: async (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
  },

  // DELETE request
  delete: async (endpoint, options = {}) => {
    return apiRequest(endpoint, { method: 'DELETE', ...options });
  },
};

// Subscription API methods
export const subscriptionAPI = {
  getPlans: () => api.get('/api/subscriptions/plans'),
  getMySubscription: () => api.get('/api/subscriptions/my-subscription'),
  getPaypalStatus: () => api.get('/api/subscriptions/paypal-status'),
  activateSubscription: (planId, paymentMethod = 'manual', paymentData = {}) => 
    api.post('/api/subscriptions/activate', { 
      planId, 
      paymentMethod,
      ...paymentData 
    }),
  getBankDetails: () => api.get('/api/bank-details/active'),
  submitBankTransferRequest: (formData) => api.post('/api/subscriptions/bank-transfer-request', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Company Wallet & Referral Reward System API methods
export const walletAPI = {
  // Public
  getCurrencyRate: (refresh = false) => api.get(`/api/wallet/currency-rate${refresh ? '?refresh=1' : ''}`),

  // Company
  getWallet: () => api.get('/api/wallet'),
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/api/wallet/transactions${qs ? `?${qs}` : ''}`);
  },
  getMyTopups: () => api.get('/api/wallet/topups'),
  createPaypalTopup: (data) => api.post('/api/wallet/topup/paypal', data),
  createBankTopup: (formData) => api.post('/api/wallet/topup/bank', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  previewSubscription: (planId) => api.get(`/api/wallet/subscription-preview/${planId}`),
  paySubscriptionWithWallet: (data) => api.post('/api/wallet/subscription/pay', data),

  // Admin
  admin: {
    getOverview: () => api.get('/api/wallet/admin/overview'),
    getSettings: () => api.get('/api/wallet/admin/settings'),
    updateSettings: (data) => api.put('/api/wallet/admin/settings', data),
    refreshRate: () => api.post('/api/wallet/admin/refresh-rate', {}),
    listWallets: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/wallet/admin/wallets${qs ? `?${qs}` : ''}`);
    },
    walletDetail: (userId) => api.get(`/api/wallet/admin/wallets/${userId}`),
    adjust: (data) => api.post('/api/wallet/admin/adjust', data),
    bulkAdjust: (data) => api.post('/api/wallet/admin/bulk-adjust', data),
    listTransactions: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/wallet/admin/transactions${qs ? `?${qs}` : ''}`);
    },
    listTopups: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/wallet/admin/topups${qs ? `?${qs}` : ''}`);
    },
    approveTopup: (id) => api.post(`/api/wallet/admin/topups/${id}/approve`, {}),
    rejectTopup: (id, reason) => api.post(`/api/wallet/admin/topups/${id}/reject`, { reason }),
    listCompanyBankDetails: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/bank-details/admin/companies${qs ? `?${qs}` : ''}`);
    },
  },
};

// Company bank account + PayPal API methods
export const bankAccountAPI = {
  getMyBankDetails: () => api.get('/api/bank-details'),
  saveBankDetails: (data) => api.post('/api/bank-details', data),
  updateBankDetails: (id, data) => api.put(`/api/bank-details/${id}`, data),
  deleteBankDetails: (id) => api.delete(`/api/bank-details/${id}`),
  getPaypal: () => api.get('/api/bank-details/paypal'),
  updatePaypal: (paypal_email) => api.put('/api/bank-details/paypal', { paypal_email }),
};

// General settings API methods
export const settingsAPI = {
  getPaypalSettings: () => api.get('/api/general-settings/paypal'),
  updatePaypalSettings: (data) => api.put('/api/general-settings/paypal', data),
  testPaypalConnection: () => api.post('/api/general-settings/paypal/test'),
  updatePaypalFee: (data) => api.put('/api/general-settings/paypal-fee', data),
  syncPaypalFee: (days = 30) => api.post('/api/general-settings/paypal-fee/sync', { days }),
};

// PayPal checkout config (client id + environment) is managed in the admin panel,
// so the checkout always follows what the admin configured — no build-time env.
// Sandbox is assumed until the answer arrives, which is the safe default.
let paypalConfig = { clientId: '', sandbox: true };
let paypalConfigPromise = null;

export const getPaypalConfig = () => {
  if (!paypalConfigPromise) {
    paypalConfigPromise = fetch('/api/general-settings/paypal')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data || {};
        paypalConfig = {
          clientId: data.paypal_client_id || '',
          sandbox: data.paypal_env !== 'live',
        };
        return paypalConfig;
      })
      .catch(() => paypalConfig);
  }
  return paypalConfigPromise;
};

// Kick the lookup off at startup so the synchronous sandbox check below is
// already accurate by the time a checkout modal renders. The promise is shared,
// so this costs a single request per page load.
getPaypalConfig();

// Client id used to load the PayPal checkout SDK.
export const getPaypalClientId = async () => (await getPaypalConfig()).clientId;

// Whether checkout should go through sandbox.paypal.com instead of paypal.com.
export const isPaypalSandbox = () => paypalConfig.sandbox;

// ── PayPal processing fee (checkout gross-up) ────────────────────────────────
// PayPal exposes no API for its fee *rates*, so the percentages are admin
// configuration served by the backend. Cached for the session — the numbers
// change rarely, and the server re-checks authoritatively at payment time.
let paypalFeeConfig = null;
let paypalFeeConfigPromise = null;

export const getPaypalFeeConfig = ({ refresh = false } = {}) => {
  if (refresh || !paypalFeeConfigPromise) {
    paypalFeeConfigPromise = fetch('/api/general-settings/paypal-fee')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const d = json?.data || {};
        paypalFeeConfig = {
          enabled: d.enabled !== false,
          merchantCountry: d.merchantCountry || 'Bahrain',
          intlPct: Number(d.intlPct) || 0,
          intlFixed: Number(d.intlFixed) || 0,
          domesticPct: Number(d.domesticPct) || 0,
          domesticFixed: Number(d.domesticFixed) || 0,
          source: d.source || 'default',
          lastSync: d.lastSync || null,
        };
        return paypalFeeConfig;
      })
      .catch(() => paypalFeeConfig);
  }
  return paypalFeeConfigPromise;
};

/** Fee config already in memory (null until the first fetch resolves). */
export const getCachedPaypalFeeConfig = () => paypalFeeConfig;

/**
 * Mirrors the server's gross-up so the buyer sees the exact amount they will be
 * charged: enough that the seller still receives `baseUsd` after PayPal's cut.
 *     charge = (base + fixed) / (1 - percent)
 * Unknown buyer country counts as international, same as the server.
 */
export const computePaypalFee = (baseUsd, config, userCountry) => {
  const base = Math.round((Number(baseUsd) || 0) * 100) / 100;
  const cfg = config || {};
  const merchant = String(cfg.merchantCountry || '').trim().toLowerCase();
  const buyer = String(userCountry ?? '').trim().toLowerCase();
  const international = !buyer || buyer !== merchant;
  const pct = international ? Number(cfg.intlPct) || 0 : Number(cfg.domesticPct) || 0;
  const fixed = international ? Number(cfg.intlFixed) || 0 : Number(cfg.domesticFixed) || 0;

  if (cfg.enabled === false || base <= 0) {
    return { enabled: false, base, fee: 0, total: base, percent: 0, fixed: 0, international };
  }
  const rate = Math.min(Math.max(pct, 0), 99) / 100;
  const total = Math.round(((base + fixed) / (1 - rate)) * 100) / 100;
  return {
    enabled: true,
    base,
    fee: Math.round((total - base) * 100) / 100,
    total,
    percent: pct,
    fixed,
    international,
  };
};

// Quotes API methods
export const quotesAPI = {
  getAvailableQuotes: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return api.get(`/api/quotes/available?t=${timestamp}&r=${random}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  getMyQuotes: () => api.get('/api/quotes/my-quotes'),
  getAllQuotes: () => api.get('/api/quotes/all'),
  submitQuote: (quoteData) => api.post('/api/quotes/submit', quoteData),
};

// User API methods
export const userAPI = {
  login: (credentials) => api.post('/api/user/login', credentials),
  register: (userData) => api.post('/api/user/register', userData),
  getProfile: () => api.get('/api/user/me'),
  keepAlive: () => api.get('/api/user/keep-alive'), // Keep-alive ping endpoint
};

// Public API methods (no authentication required)
export const publicAPI = {
  // Geo location service - no auth required
  getCountry: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/geo/country`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Lets the server fall back to the visitor's real timezone when all
          // IP lookups fail, instead of guessing from the server's own clock.
          'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        },
        // Don't include credentials for public endpoints
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Geo service failed: ${error.message}`);
    }
  },
  
  // Other public endpoints can be added here
  getCountries: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/geo/countries`, {
        method: 'GET',
        credentials: 'omit'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.countries;
    } catch (error) {
      throw new Error(`Countries service failed: ${error.message}`);
    }
  }
};

// Check account status periodically
export const checkAccountStatus = async () => {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    return { active: false, reason: 'no_token' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.accountDeactivated) {
        return { active: false, reason: 'deactivated', message: errorData.message };
      }
      if (errorData.accountBlacklisted) {
        return { active: false, reason: 'blacklisted', message: errorData.message };
      }
      return { active: false, reason: 'unauthorized' };
    }

    if (response.ok) {
      const userData = await response.json();
      return { active: true, user: userData };
    }

    return { active: false, reason: 'unknown' };
  } catch (error) {
    return { active: false, reason: 'network_error' };
  }
};

// Start periodic account status checking
export const startAccountStatusMonitoring = (intervalMinutes = 5) => {
  // Clear any existing interval
  if (window.accountStatusInterval) {
    clearInterval(window.accountStatusInterval);
  }

  // Set up periodic checking
  window.accountStatusInterval = setInterval(async () => {
    const token = getToken();
    if (!token) return; // No need to check if not logged in

    const status = await checkAccountStatus();
    if (!status.active) {
      if (status.reason === 'deactivated') {
        // Account was deactivated - force logout with specific message
        const error = new Error(status.message || 'Your account has been deactivated');
        handleAuthFailure(error, 'deactivated');
      } else if (status.reason === 'blacklisted') {
        // Account was blacklisted - force logout with specific message
        const error = new Error(status.message || 'Your account has been blacklisted');
        handleAuthFailure(error, 'blacklisted');
      } else if (status.reason === 'unauthorized') {
        // Token expired or invalid - force logout
        const error = new Error('Your session has expired. Please login again.');
        handleAuthFailure(error, null);
      }
    }
  }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
};

// Stop account status monitoring
export const stopAccountStatusMonitoring = () => {
  if (window.accountStatusInterval) {
    clearInterval(window.accountStatusInterval);
    window.accountStatusInterval = null;
  }
};
export default api;