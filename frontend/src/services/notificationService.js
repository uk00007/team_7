import apiClient from './apiClient';

export const notificationService = {
  getAll: async () => apiClient.get('/notifications'),
  markRead: async (id) => apiClient.put(`/notifications/${id}/read`),
};
