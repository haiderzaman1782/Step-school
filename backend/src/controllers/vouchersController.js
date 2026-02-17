import { Voucher } from '../models/Voucher.js';
import { generateVoucherPDF } from '../utils/pdfGenerator.js';

export const getAllVouchers = async (req, res) => {
    try {
        const { limit, offset, status, clientId, search } = req.query;

        // If client role, restrict to their own vouchers
        const filterClientId = req.user.role === 'client' ? req.user.id : clientId;

        const vouchers = await Voucher.findAll({
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
            status,
            clientId: filterClientId,
            search
        });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createVoucher = async (req, res) => {
    try {
        // Generate voucher number: VCH-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const voucher_number = `VCH-${dateStr}-${randomSuffix}`;

        const voucher = await Voucher.create({
            ...req.body,
            client_id: req.body.clientId || req.body.client_id,
            payment_type_id: req.body.paymentTypeId || req.body.payment_type_id,
            due_date: req.body.dueDate || req.body.due_date,
            voucher_number,
            created_by: req.user.id,
            attachment_url: req.file ? `/uploads/vouchers/${req.file.filename}` : null
        });
        res.status(201).json(voucher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getVoucherById = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        // Check permission
        if (req.user.role === 'client' && voucher.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(voucher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateVoucherStatus = async (req, res) => {
    try {
        const { status, payment_date, payment_method, reference_number } = req.body;
        const voucher = await Voucher.updateStatus(req.params.id, status, payment_date, payment_method, reference_number);
        res.json(voucher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteVoucher = async (req, res) => {
    try {
        await Voucher.delete(req.params.id);
        res.json({ message: 'Voucher deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const downloadVoucherPDF = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

        // Check permission
        if (req.user.role === 'client' && voucher.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=voucher-${voucher.voucher_number}.pdf`);

        generateVoucherPDF(voucher, res);
    } catch (error) {
        console.error('PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
