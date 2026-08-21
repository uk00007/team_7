import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => apiClient.post('/auth/login', { email, password }),
  register: async (data) => apiClient.post('/auth/register', data),
  logout: async () => apiClient.post('/auth/logout'),
  getCurrentUser: async () => apiClient.get('/auth/me'),
};
