import { Appointment } from '../models/Appointment.js';

export const getAllAppointments = async (req, res) => {
  try {
    const { limit = 100, offset = 0, status, search } = req.query;
    const appointments = await Appointment.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      search,
    });

    res.json({
      appointments,
      pagination: {
        total: appointments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const {
      id,
      patientName,
      phone,
      email,
      service,
      date,
      time,
      assignedAgent,
      status,
      paymentStatus,
      userId,
    } = req.body;

    if (!patientName || !service || !date || !time) {
      return res.status(400).json({ error: 'Required fields: patientName, service, date, time' });
    }

    // Generate ID if not provided
    const appointmentId = id || `APT${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const appointment = await Appointment.create({
      id: appointmentId,
      patientName,
      phone,
      email,
      service,
      date,
      time,
      assignedAgent,
      status: status || 'pending',
      paymentStatus: paymentStatus || 'pending',
      userId,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, service, date, time, assignedAgent, paymentStatus } = req.body;

    const appointment = await Appointment.update(id, {
      status,
      service,
      date,
      time,
      assignedAgent,
      paymentStatus,
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.delete(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
