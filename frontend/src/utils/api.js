import axios from 'axios';
import { toast } from 'react-toastify'

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
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // Clear token and notify user
      localStorage.removeItem('access_token');
      // show a toast (ToastContainer is global in App)
      try { window.toast && window.toast('Session expired. Please login again.') } catch (e) {}
      // Using react-toastify via import is better — but to avoid bundling issues we also redirect
      // Redirect to login
      window.location.href = '/';
    }
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