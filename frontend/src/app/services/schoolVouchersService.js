import api from './api';

export const schoolVouchersService = {
    getAll: async (params = {}) => {
        const response = await api.get('/school-vouchers', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/school-vouchers/${id}`);
        return response.data;
    },

    generate: async (data) => {
        const response = await api.post('/school-vouchers/generate', data);
        return response.data;
    },

    recordPayment: async (voucherId, data) => {
        const response = await api.post(`/school-vouchers/${voucherId}/record-payment`, data);
        return response.data;
    },

    cancel: async (id) => {
        const response = await api.patch(`/school-vouchers/${id}/cancel`);
        return response.data;
    },

    downloadPDF: async (id, voucherNumber) => {
        const response = await api.get(`/school-vouchers/${id}/pdf`, {
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
