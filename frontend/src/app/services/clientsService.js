import api from './api';

export const clientsService = {
    getAll: async (params) => {
        const response = await api.get('/clients', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },

    create: async (formData) => {
        const response = await api.post('/clients', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    update: async (id, formData) => {
        const response = await api.put(`/clients/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    }
};
