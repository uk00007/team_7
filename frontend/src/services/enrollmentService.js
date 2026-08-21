import apiClient from './apiClient';

export const enrollmentService = {
  enroll:          async (activityId) => apiClient.post('/enrollments', { activityId }),
  getMyEnrollments: async ()          => apiClient.get('/enrollments/my'),
};
