import apiClient from './apiClient';

export const gamificationService = {
  getLevels:         async ()           => apiClient.get('/gamification/levels'),
  getMilestones:     async (studentId)  =>
    apiClient.get('/gamification/milestones', { params: studentId ? { studentId } : {} }),
  getAchievements:   async (studentId)  =>
    apiClient.get('/gamification/achievements', { params: studentId ? { studentId } : {} }),
  getStudentProfile: async (studentId)  => apiClient.get(`/gamification/student/${studentId}`),
  getTeamLeaderboard: async ()          => apiClient.get('/gamification/team-leaderboard'),
  getStreak:         async (studentId)  => apiClient.get(`/gamification/streak/${studentId}`),
};
