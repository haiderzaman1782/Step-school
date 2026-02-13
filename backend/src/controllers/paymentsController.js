import { Payment } from '../models/Payment.js';

export const getAllPayments = async (req, res) => {
  try {
    const { limit = 100, offset = 0, status, search } = req.query;
    const payments = await Payment.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      search,
    });

    res.json({
      payments,
      pagination: {
        total: payments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

export const createPayment = async (req, res) => {
  try {
    const {
      id,
      transactionId,
      customerName,
      appointmentId, // Keep for compatibility if needed, though model might ignore
      paymentMethod,
      amount,
      status,
      date,
      timestamp,
      refundStatus,
      service,
      userId,
      invoiceNumber,
      callReference,
      failureReason,
    } = req.body;

    if (!customerName || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Required fields: customerName, amount, paymentMethod' });
    }

    const payment = await Payment.create({
      id,
      transactionId,
      customerName,
      appointmentId,
      paymentMethod,
      amount: parseFloat(amount),
      status: status || 'pending',
      date: date || new Date().toISOString().split('T')[0],
      timestamp: timestamp || new Date().toISOString(),
      refundStatus,
      service,
      userId,
      invoiceNumber,
      callReference,
      failureReason,
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refundStatus, failureReason } = req.body;

    const payment = await Payment.update(id, {
      status,
      refundStatus,
      failureReason,
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.delete(id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully', payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};
