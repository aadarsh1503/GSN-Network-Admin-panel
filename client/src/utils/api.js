// API utility with proper token handling and loading states

const API_BASE_URL = '';

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

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Handle authentication failures and redirect
const handleAuthFailure = (error) => {
  removeToken();
  
  // Only redirect if we're not already on login/public pages
  const currentPath = window.location.pathname;
  const publicPaths = ['/login', '/register', '/user-register', '/forgot-password', '/reset-password', '/', '/unauthorized'];
  
  if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/quote')) {
    // Use window.location to force a full page redirect and clear any cached state
    window.location.href = '/login';
  }
  
  throw error;
};

// API request wrapper with proper error handling
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  // Check token validity before making request
  if (token && isTokenExpired(token)) {
    const error = new Error('Authentication failed: Your session has expired. Please login again.');
    handleAuthFailure(error);
    return; // This won't be reached due to redirect, but good practice
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle different response types
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token validation errors
      if (response.status === 401 || response.status === 403) {
        const error = new Error('Authentication failed: ' + (errorData.message || 'Please login again'));
        handleAuthFailure(error);
        return; // This won't be reached due to redirect, but good practice
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
    // If it's an auth error, it's already handled above
    if (error.message.includes('Authentication failed')) {
      throw error;
    }
    
    // For network errors or other issues
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
  getProfile: () => api.get('/api/user/profile'),
};

export default api;