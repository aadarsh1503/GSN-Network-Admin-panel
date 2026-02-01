// API utility with proper token handling and loading states

const API_BASE_URL = ''; // Use relative URLs with Vite proxy

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
  const publicPaths = ['/login', '/register', '/user-register', '/forgot-password', '/reset-password', '/', '/unauthorized'];
  
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
  
  // Check if token needs refreshing (expired or expiring soon)
  if (token && (isTokenExpired(token) || isTokenExpiringSoon(token))) {
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
      
      // Handle token validation errors
      if (response.status === 401 || response.status === 403) {
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
  activateSubscription: (planId, paymentMethod = 'manual') => api.post('/api/subscriptions/activate', { planId, paymentMethod }),
  getBankDetails: () => api.get('/api/bank-details/active'),
  submitBankTransferRequest: (formData) => api.post('/api/subscriptions/bank-transfer-request', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
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
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map(c => c.name.common).sort();
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