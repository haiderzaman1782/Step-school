import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
} from '../controllers/clientsController.js';
import {
    getAllVouchers,
    getVoucherById,
    createVoucher,
    updateVoucherStatus,
    deleteVoucher,
    downloadVoucherPDF
} from '../controllers/vouchersController.js';
import {
    getAllPaymentTypes,
    createPaymentType,
    updatePaymentType
} from '../controllers/paymentTypesController.js';
import {
    getAccountantMetrics,
    getClientMetrics
} from '../controllers/dashboardController.js';
import upload from '../middleware/upload.js';


const router = express.Router();

// Auth Routes
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);

// Clients Routes (Accountant Only)
router.get('/clients', authenticateToken, authorizeRoles('accountant'), getAllClients);
router.get('/clients/:id', authenticateToken, authorizeRoles('accountant'), getClientById);
router.post('/clients', authenticateToken, authorizeRoles('accountant'), upload.single('avatar'), createClient);
router.put('/clients/:id', authenticateToken, authorizeRoles('accountant'), upload.single('avatar'), updateClient);
router.delete('/clients/:id', authenticateToken, authorizeRoles('accountant'), deleteClient);
router.get('/clients/:id/vouchers', authenticateToken, authorizeRoles('accountant'), getAllVouchers);

// Vouchers Routes
router.get('/vouchers', authenticateToken, getAllVouchers);
router.get('/vouchers/:id', authenticateToken, getVoucherById);
router.post('/vouchers', authenticateToken, authorizeRoles('accountant'), upload.single('attachment'), createVoucher);
router.patch('/vouchers/:id/status', authenticateToken, authorizeRoles('accountant'), updateVoucherStatus);
router.get('/vouchers/:id/pdf', authenticateToken, downloadVoucherPDF);
router.delete('/vouchers/:id', authenticateToken, authorizeRoles('accountant'), deleteVoucher);

// Payment Types Routes
router.get('/payment-types', authenticateToken, getAllPaymentTypes);
router.post('/payment-types', authenticateToken, authorizeRoles('accountant'), createPaymentType);
router.put('/payment-types/:id', authenticateToken, authorizeRoles('accountant'), updatePaymentType);

// Users Routes (Admin/Accountant)
router.get('/users', authenticateToken, authorizeRoles('accountant', 'admin'), getAllClients);
router.get('/users/:id', authenticateToken, authorizeRoles('accountant', 'admin'), getClientById);
router.post('/users', authenticateToken, authorizeRoles('accountant', 'admin'), upload.single('avatar'), createClient);
router.put('/users/:id', authenticateToken, authorizeRoles('accountant', 'admin'), upload.single('avatar'), updateClient);
router.delete('/users/:id', authenticateToken, authorizeRoles('accountant', 'admin'), deleteClient);

// Dashboard Routes
router.get('/dashboard/accountant', authenticateToken, authorizeRoles('accountant'), getAccountantMetrics);
router.get('/dashboard/client', authenticateToken, authorizeRoles('client'), getClientMetrics);

export default router;

