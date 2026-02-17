import { Client } from '../models/Client.js';
import bcrypt from 'bcryptjs';

export const getAllClients = async (req, res) => {
    try {
        const { limit, offset, search, status } = req.query;
        const clients = await Client.findAll({
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
            search,
            status
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createClient = async (req, res) => {
    try {
        const { email, password, fullName, phone, address, role, status } = req.body;
        const existing = await Client.findByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Generate client_id: CL-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const client_id = `CL-${dateStr}-${randomSuffix}`;

        const client = await Client.create({
            client_id,
            full_name: fullName || req.body.name || 'New Client',
            email,
            phone,
            address,
            role: role || 'client',
            status: status || 'active',
            password: password || 'Welcome123', // Default password if not provided
            avatar_url: req.file ? `/uploads/avatars/${req.file.filename}` : null
        });
        res.status(201).json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { fullName, email, phone, address, role, status } = req.body;
        const client = await Client.update(req.params.id, {
            full_name: fullName || req.body.full_name,
            email,
            phone,
            address,
            role,
            status,
            avatar_url: req.file ? `/uploads/avatars/${req.file.filename}` : req.body.avatar_url
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteClient = async (req, res) => {
    try {
        await Client.delete(req.params.id);
        res.json({ message: 'Client deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
