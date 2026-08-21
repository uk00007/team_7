import apiClient from './apiClient';

export const coachService = {
  getRecommendation: async () => apiClient.get('/coach/recommendation'),
};
