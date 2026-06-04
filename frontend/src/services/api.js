import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      localStorage.removeItem('vd_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users
export const usersAPI = {
  me: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  sessions: () => api.get('/users/me/sessions'),
};

// Tasks
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  archive: (id) => api.patch(`/tasks/${id}/archive`),
  addDependency: (id, data) => api.post(`/tasks/${id}/dependencies`, data),
};

// Goals
export const goalsAPI = {
  getAll: (params) => api.get('/goals', { params }),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Habits
export const habitsAPI = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  log: (id, data) => api.post(`/habits/${id}/log`, data),
};

// Notes
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Focus
export const focusAPI = {
  getSessions: () => api.get('/focus'),
  start: (data) => api.post('/focus/start', data),
  end: (id) => api.post(`/focus/${id}/end`),
  stats: () => api.get('/focus/stats'),
};

// AI
export const aiAPI = {
  breakdown: (goal) => api.post('/ai/breakdown', { goal }),
  plan: (data) => api.post('/ai/plan', data),
  assistant: (data) => api.post('/ai/assistant', data),
};

// Analytics
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Search
export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
};

// Admin
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id) => api.patch(`/admin/users/${id}/ban`),
  suspendUser: (id, data) => api.patch(`/admin/users/${id}/suspend`, data),
  getActivity: (params) => api.get('/admin/activity', { params }),
  getAudit: () => api.get('/admin/audit'),
};

// Super Admin
export const superAdminAPI = {
  createAdmin: (data) => api.post('/superadmin/admins', data),
  removeAdmin: (id) => api.delete(`/superadmin/admins/${id}`),
  getAnalytics: () => api.get('/superadmin/analytics'),
  getSettings: () => api.get('/superadmin/settings'),
  updateSettings: (settings) => api.put('/superadmin/settings', { settings }),
};

export default api;
