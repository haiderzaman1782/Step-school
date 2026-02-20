import { FeePayment } from '../models/FeePayment.js';
import { SchoolClient } from '../models/SchoolClient.js';

const isOwner = (user) => user.role === 'admin' || user.role === 'owner';

// ──────────────────────────────────────────────────────────
// PUT /api/fee-payments/:paymentId
// Allows editing: payment_plan_id, amount_paid, payment_date,
//                 payment_method, notes
// ──────────────────────────────────────────────────────────
export const editFeePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { payment_plan_id, amount_paid, payment_date, payment_method, notes } = req.body;

        const payment = await FeePayment.findById(paymentId);
        if (!payment) return res.status(404).json({ error: 'Payment record not found' });

        // Campus isolation
        if (!isOwner(req.user) && payment.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot modify payments from other campuses' });
        }

        if (amount_paid !== undefined && parseFloat(amount_paid) <= 0) {
            return res.status(400).json({ error: 'amount_paid must be greater than 0' });
        }

        const updated = await FeePayment.update(paymentId, {
            payment_plan_id,
            amount_paid: amount_paid !== undefined ? parseFloat(amount_paid) : undefined,
            payment_date,
            payment_method,
            notes,
        });

        res.json(updated);
    } catch (err) {
        console.error('editFeePayment:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// GET /api/fee-payments?client_id=:id
// ──────────────────────────────────────────────────────────
export const getFeePaymentsByClient = async (req, res) => {
    try {
        const { client_id } = req.query;
        if (!client_id) return res.status(400).json({ error: 'client_id query param required' });

        const client = await SchoolClient.findById(client_id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        if (!isOwner(req.user) && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot access clients from other campuses' });
        }

        const payments = await FeePayment.findByClientId(client_id);
        res.json(payments);
    } catch (err) {
        console.error('getFeePaymentsByClient:', err);
        res.status(500).json({ error: err.message });
    }
};
