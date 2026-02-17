import api from './api';
import { transformVoucher } from '../utils/dataTransformers.js';

export const vouchersService = {
    getAll: async (params) => {
        const response = await api.get('/vouchers', { params });
        return (response.data || []).map(transformVoucher);
    },
    getById: async (id) => {
        const response = await api.get(`/vouchers/${id}`);
        return transformVoucher(response.data);
    },
    create: async (formData) => {
        const response = await api.post('/vouchers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return transformVoucher(response.data);
    },
    updateStatus: async (id, statusData) => {
        const response = await api.patch(`/vouchers/${id}/status`, statusData);
        return transformVoucher(response.data);
    },
    downloadPDF: async (id, voucherNumber) => {
        const response = await api.get(`/vouchers/${id}/pdf`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `voucher-${voucherNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    delete: async (id) => {
        const response = await api.delete(`/vouchers/${id}`);
        return response.data;
    }
};
