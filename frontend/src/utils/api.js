import axios from 'axios';

// Use VITE_API_URL fallback to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle unauthorized/expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    // treat requests to auth endpoints as caller-handled (do not redirect)
    const isAuthEndpoint = typeof requestUrl === 'string' && requestUrl.startsWith('/auth');

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      // Clear token and cached user for protected endpoint failures
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expires_at');
      // Do not show toast here to avoid duplicate notifications; ProtectedRoute handles user-facing message.
      console.info('Session expired or unauthorized response received; redirecting to login.');
      window.location.href = '/';
    }

    // For auth endpoints (login/register/token) let the caller handle the error so UI can show messages
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export default api;