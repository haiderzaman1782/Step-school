import api from './api';

export const feePaymentsService = {
    getByClient: async (clientId) => {
        const response = await api.get('/fee-payments', { params: { client_id: clientId } });
        return response.data;
    },

    edit: async (paymentId, data) => {
        const response = await api.put(`/fee-payments/${paymentId}`, data);
        return response.data;
    },
};
