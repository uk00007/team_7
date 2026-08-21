import apiClient from './apiClient';

export const quizService = {
  getQuiz: async (id) => apiClient.get(`/quizzes/${id}`),
  submitQuiz: async (id, answers) => apiClient.post(`/quizzes/${id}/submit`, { answers }),
};
