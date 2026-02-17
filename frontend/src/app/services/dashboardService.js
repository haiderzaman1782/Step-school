import api from './api';

export const dashboardService = {
    getAccountantMetrics: async () => {
        const response = await api.get('/dashboard/accountant');
        return response.data;
    },

    getClientMetrics: async () => {
        const response = await api.get('/dashboard/client');
        return response.data;
    }
};
