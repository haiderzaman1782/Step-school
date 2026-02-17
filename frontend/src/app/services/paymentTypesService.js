import api from './api';

export const paymentTypesService = {
    getAll: async () => {
        const response = await api.get('/payment-types');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/payment-types', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/payment-types/${id}`, data);
        return response.data;
    }
};
