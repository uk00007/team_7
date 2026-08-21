import apiClient from './apiClient';

export const activityService = {
  getAll: async (filters) => apiClient.get('/activities', { params: filters }),
  getById: async (id) => apiClient.get(`/activities/${id}`),
  create: async (data) => apiClient.post('/activities', data),
  update: async (id, data) => apiClient.put(`/activities/${id}`, data),
  remove: async (id) => apiClient.delete(`/activities/${id}`),
};
