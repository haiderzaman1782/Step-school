import api from './api.js';
import { transformCall, transformLiveCall } from '../utils/dataTransformers.js';

export const callsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/calls', { params });
    return {
      calls: (response.data.calls || []).map(transformCall),
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/calls/${id}`);
    return transformCall(response.data);
  },

  create: async (callData) => {
    const response = await api.post('/calls', {
      callerName: callData.callerName,
      phoneNumber: callData.phoneNumber,
      callType: callData.callType,
      status: callData.status || 'completed',
      duration: callData.duration,
      timestamp: callData.timestamp || new Date().toISOString(),
      purpose: callData.purpose,
      notes: callData.notes,
      userId: callData.userId || null,
    });
    return transformCall(response.data);
  },

  getLiveCalls: async () => {
    // Get active calls for live voice call table
    const response = await api.get('/calls', {
      params: {
        status: 'active',
        limit: 100,
      },
    });
    return (response.data.calls || []).map(transformLiveCall);
  },
};

