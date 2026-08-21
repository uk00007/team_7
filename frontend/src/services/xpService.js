import apiClient from './apiClient';

export const xpService = {
  getUserStats: async () => apiClient.get('/xp/stats'),
  getLeaderboard: async (type) => apiClient.get('/xp/leaderboard', { params: { type } }),
  getMyAchievements: async () => apiClient.get('/xp/achievements'),
};
