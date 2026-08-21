import apiClient from './apiClient';

export const certificateService = {
  upload: async (data) => apiClient.post('/certificates/upload', data),
  getAll: async () => apiClient.get('/certificates'),
};
