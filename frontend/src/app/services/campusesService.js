import api from './api';

export const campusesService = {
    getAll: async () => {
        const response = await api.get('/campuses');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/campuses', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/campuses/${id}`);
        return response.data;
    }
};
