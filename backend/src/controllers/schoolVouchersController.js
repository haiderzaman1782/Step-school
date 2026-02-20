import { SchoolVoucher } from '../models/SchoolVoucher.js';
import { SchoolClient } from '../models/SchoolClient.js';
import { PaymentPlan } from '../models/PaymentPlan.js';
import { FeePayment } from '../models/FeePayment.js';
import { generateSchoolVoucherPDF } from '../utils/pdfGenerator.js';

const isOwner = (user) => user.role === 'admin' || user.role === 'owner';

// ──────────────────────────────────────────────────────────
// GET /api/school-vouchers
// ──────────────────────────────────────────────────────────
export const getAllSchoolVouchers = async (req, res) => {
    try {
        const { clientId, status, search, limit = 20, offset = 0 } = req.query;
        const campusId = isOwner(req.user) ? null : req.user.campus_id;

        const data = await SchoolVoucher.findAll({
            campusId,
            clientId,
            status,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.json(data);
    } catch (err) {
        console.error('getAllSchoolVouchers:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// GET /api/school-vouchers/:id
// ──────────────────────────────────────────────────────────
export const getSchoolVoucherById = async (req, res) => {
    try {
        const voucher = await SchoolVoucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (!isOwner(req.user) && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot access vouchers from other campuses' });
        }

        res.json(voucher);
    } catch (err) {
        console.error('getSchoolVoucherById:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// POST /api/school-vouchers/generate
// Body: { client_id, payment_plan_id }
// ──────────────────────────────────────────────────────────
export const generateVoucher = async (req, res) => {
    try {
        const { client_id, payment_plan_id } = req.body;
        if (!client_id || !payment_plan_id) {
            return res.status(400).json({ error: 'client_id and payment_plan_id are required' });
        }

        const client = await SchoolClient.findById(client_id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        if (!isOwner(req.user) && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot access clients from other campuses' });
        }

        const plan = await PaymentPlan.findById(payment_plan_id);
        if (!plan || plan.client_id !== client_id) {
            return res.status(404).json({ error: 'Payment plan not found for this client' });
        }

        // Check for existing pending voucher for same milestone
        const existing = await SchoolVoucher.findAll({
            clientId: client_id,
            status: 'pending',
        });
        const duplicate = existing.vouchers.find((v) => v.payment_plan_id === payment_plan_id);
        if (duplicate) {
            return res.status(400).json({
                error: 'A pending voucher already exists for this payment milestone',
                voucher_id: duplicate.id,
            });
        }

        const voucher = await SchoolVoucher.create({
            client_id,
            payment_plan_id,
            amount: plan.amount,
            generated_by_accountant_id: req.user.id,
            campus_id: req.user.campus_id || client.campus_id,
        });

        const full = await SchoolVoucher.findById(voucher.id);
        res.status(201).json(full);
    } catch (err) {
        console.error('generateVoucher:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// POST /api/school-vouchers/:voucherId/record-payment
// Body: { amount_paid, payment_date, payment_method, notes }
// ──────────────────────────────────────────────────────────
export const recordPayment = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { amount_paid, payment_date, payment_method, notes } = req.body;

        if (!amount_paid || !payment_date) {
            return res.status(400).json({ error: 'amount_paid and payment_date are required' });
        }
        if (parseFloat(amount_paid) <= 0) {
            return res.status(400).json({ error: 'amount_paid must be greater than 0' });
        }

        const voucher = await SchoolVoucher.findById(voucherId);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (voucher.status === 'paid') {
            return res.status(400).json({ error: 'Voucher has already been marked as paid' });
        }
        if (voucher.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot record payment for a cancelled voucher' });
        }

        if (!isOwner(req.user) && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot access vouchers from other campuses' });
        }

        // Mark voucher as paid
        await SchoolVoucher.markPaid(voucherId, {
            paid_by_accountant_id: req.user.id,
            paid_date: payment_date,
        });

        // Create fee payment record
        const feePayment = await FeePayment.create({
            client_id: voucher.client_id,
            voucher_id: voucherId,
            payment_plan_id: voucher.payment_plan_id,
            amount_paid: parseFloat(amount_paid),
            payment_date,
            payment_method: payment_method || null,
            recorded_by_accountant_id: req.user.id,
            notes: notes || null,
        });

        const updatedVoucher = await SchoolVoucher.findById(voucherId);
        res.json({ voucher: updatedVoucher, payment: feePayment });
    } catch (err) {
        console.error('recordPayment:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// GET /api/school-vouchers/:id/pdf
// ──────────────────────────────────────────────────────────
export const downloadSchoolVoucherPDF = async (req, res) => {
    try {
        const voucher = await SchoolVoucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (!isOwner(req.user) && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${voucher.voucher_number}.pdf"`);
        generateSchoolVoucherPDF(voucher, res);
    } catch (err) {
        console.error('downloadSchoolVoucherPDF:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

// ──────────────────────────────────────────────────────────
// PATCH /api/school-vouchers/:id/cancel
// ──────────────────────────────────────────────────────────
export const cancelSchoolVoucher = async (req, res) => {
    try {
        const voucher = await SchoolVoucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
        if (voucher.status === 'paid') {
            return res.status(400).json({ error: 'Cannot cancel a paid voucher' });
        }
        if (!isOwner(req.user) && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await SchoolVoucher.cancel(req.params.id);
        res.json(updated);
    } catch (err) {
        console.error('cancelSchoolVoucher:', err);
        res.status(500).json({ error: err.message });
    }
};
