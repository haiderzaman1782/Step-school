import api from './api.js';
import { transformAppointment } from '../utils/dataTransformers.js';

export const appointmentsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return {
      appointments: (response.data.appointments || []).map(transformAppointment),
      pagination: response.data.pagination,
    };
  },

  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return transformAppointment(response.data);
  },

  create: async (appointmentData) => {
    // Generate ID if not provided
    const appointmentId = appointmentData.id || `APT${String(Date.now()).slice(-6)}`;

    const response = await api.post('/appointments', {
      id: appointmentId,
      patientName: appointmentData.patientName,
      phone: appointmentData.phone,
      email: appointmentData.email,
      service: appointmentData.service,
      date: appointmentData.date,
      time: appointmentData.time,
      assignedAgent: appointmentData.assignedAgent,
      status: appointmentData.status || 'pending',
      paymentStatus: appointmentData.paymentStatus || 'pending',
      userId: appointmentData.userId || null,
    });
    return transformAppointment(response.data);
  },

  update: async (id, appointmentData) => {
    const response = await api.put(`/appointments/${id}`, {
      status: appointmentData.status,
      service: appointmentData.service,
      date: appointmentData.date,
      time: appointmentData.time,
      assignedAgent: appointmentData.assignedAgent,
      paymentStatus: appointmentData.paymentStatus,
    });
    return transformAppointment(response.data);
  },

  delete: async (id) => {
    await api.delete(`/appointments/${id}`);
    return { success: true };
  },
};

