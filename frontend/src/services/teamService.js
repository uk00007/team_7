import apiClient from './apiClient';

export const teamService = {
  getMyTeam: async () => apiClient.get('/teams/my-team'),
  getTeamLeaderboard: async () => apiClient.get('/teams/leaderboard'),
};
