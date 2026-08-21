import apiClient from './apiClient';

export const analyticsService = {
  getAdminOverview: async () => apiClient.get('/analytics/overview'),
  getStudentAnalytics: async () => apiClient.get('/analytics/students'),
  getAdminAnalytics: async () => apiClient.get('/analytics/admin'),
};
