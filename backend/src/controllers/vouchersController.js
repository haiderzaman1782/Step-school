import { Voucher } from '../models/Voucher.js';
import { Client } from '../models/Client.js';
import { generateSchoolVoucherPDF } from '../utils/pdfGenerator.js';

export const getAllVouchers = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, client_id, campus_id } = req.query;
        const offset = (page - 1) * limit;

        let targetCampusId = campus_id;
        let targetClientId = client_id;

        if (req.user.role === 'accountant') {
            targetCampusId = req.user.campus_id;
        } else if (req.user.role === 'client') {
            targetClientId = req.user.client_id;
            targetCampusId = null; // Clients don't filter by campus
        }

        const result = await Voucher.findAll({
            campus_id: targetCampusId,
            client_id: targetClientId,
            status,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(result);
    } catch (error) {
        console.error('GetAllVouchers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getVoucherById = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (req.user.role === 'accountant' && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.role === 'client' && voucher.client_id !== req.user.client_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(voucher);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const generateVoucher = async (req, res) => {
    try {
        const { client_id, payment_plan_id, due_date } = req.body;

        const client = await Client.findById(client_id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        if (req.user.role === 'accountant' && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const milestone = client.payment_plan.find(p => p.id === payment_plan_id);
        if (!milestone) return res.status(404).json({ error: 'Payment milestone not found' });

        const voucherNumber = await Voucher.generateVoucherNumber(client.campus_id);

        const voucher = await Voucher.create({
            voucher_number: voucherNumber,
            client_id,
            campus_id: client.campus_id,
            payment_plan_id,
            amount: milestone.amount,
            due_date: due_date || milestone.due_date,
            generated_by_accountant_name: req.user.name
        });

        res.status(201).json(voucher);
    } catch (error) {
        console.error('GenerateVoucher error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

export const createManualVoucher = async (req, res) => {
    try {
        const { client_id, amount, type, due_date, amount_paid, payment_method, notes } = req.body;

        const client = await Client.findById(client_id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        if (req.user.role === 'accountant' && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if we can find a matching payment plan milestone by type
        let milestone = client.payment_plan.find(p => p.payment_type === type);

        const voucherNumber = await Voucher.generateVoucherNumber(client.campus_id);

        let voucher = await Voucher.create({
            voucher_number: voucherNumber,
            client_id,
            campus_id: client.campus_id,
            payment_plan_id: milestone ? milestone.id : null,
            amount: parseFloat(amount),
            due_date: due_date,
            generated_by_accountant_name: req.user.name
        });

        // If initial payment is provided, record it immediately
        if (amount_paid && parseFloat(amount_paid) > 0) {
            voucher = await Voucher.recordPayment(voucher.id, {
                amount_paid: parseFloat(amount_paid),
                payment_method: payment_method || 'Cash',
                payment_notes: notes || 'Initial payment during generation',
                paid_by_accountant_name: req.user.name,
                paid_date: new Date()
            });
        }

        res.status(201).json(voucher);
    } catch (error) {
        console.error('CreateManualVoucher error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

export const recordPayment = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { amount_paid, payment_method, notes, payment_date } = req.body;

        const voucher = await Voucher.findById(voucherId);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (req.user.role === 'accountant' && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await Voucher.recordPayment(voucherId, {
            amount_paid,
            payment_method,
            payment_notes: notes,
            paid_by_accountant_name: req.user.name,
            paid_date: payment_date
        });

        res.json(updated);
    } catch (error) {
        console.error('RecordPayment error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

export const editPayment = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (req.user.role === 'accountant' && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await Voucher.update(voucherId, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const cancelVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (req.user.role === 'accountant' && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (voucher.status === 'paid') {
            return res.status(400).json({ error: 'Fully paid vouchers cannot be cancelled' });
        }

        const updated = await Voucher.update(req.params.id, { status: 'cancelled' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        if (req.user.role === 'accountant' && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Voucher.delete(req.params.id);
        res.json({ message: 'Voucher deleted successfully' });
    } catch (error) {
        console.error('DeleteVoucher error:', error);
        res.status(500).json({ error: 'Failed to delete voucher' });
    }
};

export const downloadPDF = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (req.user.role === 'accountant' && voucher.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.role === 'client' && voucher.client_id !== req.user.client_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${voucher.voucher_number}.pdf`);

        generateSchoolVoucherPDF(voucher, res);
    } catch (error) {
        console.error('PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
