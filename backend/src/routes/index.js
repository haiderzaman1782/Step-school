import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import {
    getAllClients, getClientById, createClient, updateClient, deleteClient
} from '../controllers/clientsController.js';
import {
    getAllVouchers, getVoucherById, generateVoucher, createManualVoucher, recordPayment, editPayment, deleteVoucher, cancelVoucher, downloadPDF
} from '../controllers/vouchersController.js';
import {
    getAllCampuses, createCampus, deleteCampus
} from '../controllers/campusesController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT and attach user info
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Role check middleware
const roles = (...allowed) => (req, res, next) => {
    if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

// Auth
router.post('/auth/login', login);
router.get('/auth/me', auth, getMe);

// Clients
router.get('/clients', auth, getAllClients);
router.get('/clients/:id', auth, getClientById);
router.post('/clients', auth, roles('accountant', 'owner'), createClient);
router.put('/clients/:id', auth, roles('accountant', 'owner'), updateClient);
router.delete('/clients/:id', auth, roles('accountant', 'owner'), deleteClient);

// Campuses
router.get('/campuses', auth, getAllCampuses);
router.post('/campuses', auth, roles('owner'), createCampus);
router.delete('/campuses/:id', auth, roles('owner'), deleteCampus);

// Vouchers
router.get('/vouchers', auth, getAllVouchers);
router.get('/vouchers/:id', auth, getVoucherById);
router.post('/vouchers/generate', auth, roles('accountant', 'owner'), generateVoucher);
router.post('/vouchers/manual', auth, roles('accountant', 'owner'), createManualVoucher);
router.patch('/vouchers/:voucherId/record-payment', auth, roles('accountant', 'owner'), recordPayment);
router.put('/vouchers/:voucherId/payment', auth, roles('accountant', 'owner'), editPayment);
router.delete('/vouchers/:id', auth, roles('accountant', 'owner'), deleteVoucher);
router.patch('/vouchers/:id/cancel', auth, roles('accountant', 'owner'), cancelVoucher);
router.get('/vouchers/:id/pdf', auth, downloadPDF);

// Legacy/Aliases (redirect or remove)
// No longer using separate programs or fee-payments routes

export default router;
