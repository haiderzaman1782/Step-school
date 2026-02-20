import api from './api';

export const schoolClientsService = {
    getAll: async (params = {}) => {
        const response = await api.get('/school-clients', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/school-clients/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/school-clients', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/school-clients/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/school-clients/${id}`);
        return response.data;
    },
};
