import api from './api';

export const programsService = {
    add: async (clientId, data) => {
        const response = await api.post(`/school-clients/${clientId}/programs`, data);
        return response.data;
    },

    update: async (clientId, programId, data) => {
        const response = await api.put(`/school-clients/${clientId}/programs/${programId}`, data);
        return response.data;
    },

    delete: async (clientId, programId) => {
        const response = await api.delete(`/school-clients/${clientId}/programs/${programId}`);
        return response.data;
    },
};
