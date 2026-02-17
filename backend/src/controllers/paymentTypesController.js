import { PaymentType } from '../models/PaymentType.js';

export const getAllPaymentTypes = async (req, res) => {
    try {
        const types = await PaymentType.findAll(req.query.onlyActive !== 'false');
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPaymentType = async (req, res) => {
    try {
        const type = await PaymentType.create(req.body);
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePaymentType = async (req, res) => {
    try {
        const type = await PaymentType.update(req.params.id, req.body);
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
