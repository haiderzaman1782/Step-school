import api from './api.js';
import { transformUser } from '../utils/dataTransformers.js';

export const usersService = {
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return {
      users: (response.data.users || []).map(transformUser),
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return transformUser(response.data);
  },

  create: async (userData) => {
    const formData = new FormData();
    formData.append('fullName', userData.fullName || userData.name || '');
    formData.append('email', userData.email || '');
    formData.append('phone', userData.phone || '');
    formData.append('role', userData.role || 'customer');
    formData.append('status', userData.status || 'active');
    
    // Append avatar file if it's a File object
    if (userData.avatar instanceof File) {
      formData.append('avatar', userData.avatar);
    }
    
    const response = await api.post('/users', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return transformUser(response.data);
  },

  update: async (id, userData) => {
    const formData = new FormData();
    formData.append('fullName', userData.fullName || userData.name || '');
    formData.append('email', userData.email || '');
    formData.append('phone', userData.phone || '');
    formData.append('role', userData.role || '');
    formData.append('status', userData.status || '');
    
    // Append avatar file if it's a File object
    if (userData.avatar instanceof File) {
      formData.append('avatar', userData.avatar);
    }
    
    const response = await api.put(`/users/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return transformUser(response.data);
  },

  delete: async (id) => {
    await api.delete(`/users/${id}`);
    return { success: true };
  },
};

