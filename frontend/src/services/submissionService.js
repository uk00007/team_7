import apiClient from './apiClient';

export const submissionService = {
  // enroll via the dedicated enrollment endpoint
  enroll: async (activityId) => apiClient.post('/enrollments', { activityId }),

  // submit — always send JSON; safely handle FormData input
  submit: async (activityId, data) => {
    let content = '';
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      content = data.get('description') || '';
    } else if (data && typeof data === 'object') {
      content = data.content || data.description || '';
    }
    return apiClient.post('/submissions', { activityId, content });
  },

  getByActivity: async (activityId) => apiClient.get(`/submissions/activity/${activityId}`),
  getAll:        async ()           => apiClient.get('/submissions/pending'),
  getPending:    async ()           => apiClient.get('/submissions/pending'),
  review:        async (id, data)   => apiClient.put(`/submissions/${id}/review`, data),
  getMySubmissions: async ()        => apiClient.get('/submissions/my'),
};
