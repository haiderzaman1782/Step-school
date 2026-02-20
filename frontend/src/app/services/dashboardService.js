import api from './api';

export const dashboardService = {
    getMetrics: async () => {
        const response = await api.get('/dashboard/metrics');
        return response.data;
    },
    getClientMetrics: async () => {
        const response = await api.get('/dashboard/client-metrics');
        return response.data;
    }
};
