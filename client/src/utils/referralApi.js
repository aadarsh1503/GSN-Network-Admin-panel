// utils/referralApi.js
// Dedicated API utility for referral endpoints — uses hardcoded backend URL
// to bypass Vite proxy issues.

const BACKEND_URL = 'http://localhost:5000';

// ─── Token helper ────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

// ─── Core request function ───────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = getToken();

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  // Attach body
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
}

// ─── Exported API methods ─────────────────────────────────────────────────────
export const referralApi = {
  // User-facing
  getMyCode:   ()           => request('/api/referrals/my-code'),
  getHistory:  (page = 1, limit = 20, status = '') => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set('status', status);
    return request(`/api/referrals/history?${params}`);
  },
  getWallet:   ()           => request('/api/referrals/wallet'),
  validateCode: (referralCode, registrantRole) =>
    request('/api/referrals/validate-code', {
      method: 'POST',
      body: { referralCode, registrantRole },
    }),

  // Admin
  adminGetAll: (page = 1, limit = 50, status = '', role = '') => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set('status', status);
    if (role)   params.set('role',   role);
    return request(`/api/referrals/admin/all?${params}`);
  },
  adminGetRules:    ()                      => request('/api/referrals/admin/rules'),
  adminUpdateRule:  (entityType, data)       => request(`/api/referrals/admin/rules/${entityType}`, { method: 'PUT', body: data }),
  adminAdjustWallet:(data)                   => request('/api/referrals/admin/adjust-wallet', { method: 'POST', body: data }),
  adminGetWallets:  (page = 1, limit = 50)    => request(`/api/referrals/admin/wallets?page=${page}&limit=${limit}`),
  adminGetCode:     ()                        => request('/api/referrals/admin/universal-code'),
  adminUpdateCode:  (code)                   => request('/api/referrals/admin/universal-code', { method: 'PUT', body: { code } }),
};

export default referralApi;
