// API utility with proper token handling and loading states

const API_BASE_URL = '/api';

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

// API request wrapper with proper error handling
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  // Check token validity before making request
  if (token && isTokenExpired(token)) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Token expired');
  }

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Add body for POST/PUT requests
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle different response types
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle token validation errors
      if (response.status === 401 || response.status === 403) {
        if (errorData.message?.includes('token') || errorData.message?.includes('authorized')) {
          removeToken();
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API Request Error:', error);
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
  getPlans: () => api.get('/subscriptions/plans'),
  getMySubscription: () => api.get('/subscriptions/my-subscription'),
  activateSubscription: (planId) => api.post('/subscriptions/activate', { planId }),
};

// Quotes API methods
export const quotesAPI = {
  getAvailableQuotes: () => api.get('/quotes/available'),
  getMyQuotes: () => api.get('/quotes/my-quotes'),
  getAllQuotes: () => api.get('/quotes/all'),
  submitQuote: (quoteData) => api.post('/quotes/submit', quoteData),
};

// User API methods
export const userAPI = {
  login: (credentials) => api.post('/user/login', credentials),
  register: (userData) => api.post('/user/register', userData),
  getProfile: () => api.get('/user/profile'),
};

export default api;