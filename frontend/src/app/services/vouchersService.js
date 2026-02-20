import api from './api';

export const vouchersService = {
    getAll: async (params = {}) => {
        const response = await api.get('/vouchers', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/vouchers/${id}`);
        return response.data;
    },

    generate: async (data) => {
        const response = await api.post('/vouchers/generate', data);
        return response.data;
    },

    createManual: async (data) => {
        const response = await api.post('/vouchers/manual', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/vouchers/${id}`);
        return response.data;
    },

    recordPayment: async (voucherId, data) => {
        // Note: PATCH for recording a payment increment
        const response = await api.patch(`/vouchers/${voucherId}/record-payment`, data);
        return response.data;
    },

    editPayment: async (voucherId, data) => {
        const response = await api.put(`/vouchers/${voucherId}/payment`, data);
        return response.data;
    },

    cancel: async (id) => {
        const response = await api.patch(`/vouchers/${id}/cancel`);
        return response.data;
    },

    downloadPDF: async (id, voucherNumber) => {
        const response = await api.get(`/vouchers/${id}/pdf`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${voucherNumber || 'voucher'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};
