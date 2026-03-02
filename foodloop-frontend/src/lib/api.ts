import axios from 'axios';
import { auth } from './firebase';
import { getAuth } from 'firebase/auth';

// Support both Vite and CRA-style env vars with a sensible fallback
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.REACT_APP_API_URL ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const auth = getAuth();
      auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Product API
export const productAPI = {
  add: (data: any) => api.post('/products', data),
  getAll: () => api.get('/products'),
  getUrgent: () => api.get('/products/urgent'),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Discount API
export const discountAPI = {
  calculate: () => api.post('/discounts/calculate'),
  apply: () => api.post('/discounts/apply'),
  getSummary: () => api.get('/discounts/summary'),
};

// Donation API
export const donationAPI = {
  record: (data: any) => api.post('/donations', data),
  getHistory: () => api.get('/donations/history'),
  updateStatus: (id: string, status: string) =>
    api.patch(`/donations/${id}/status`, { status }),
  getByFoodBank: () => api.get('/donations/by-food-bank'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getWasteReport: () => api.get('/analytics/waste-report'),
  getInventoryTrends: () => api.get('/analytics/inventory-trends'),
};


export default api;
