import { Client } from '../models/Client.js';
import pool from '../config/database.js';

export const getAllClients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', campus_id } = req.query;
        const offset = (page - 1) * limit;

        // Campus isolation
        let targetCampusId = campus_id;
        let targetClientId = null;

        if (req.user.role === 'accountant') {
            targetCampusId = req.user.campus_id;
        } else if (req.user.role === 'client') {
            targetClientId = req.user.client_id;
            targetCampusId = null;
        }

        const { clients, pagination } = await Client.findAll({
            campus_id: targetCampusId,
            client_id: targetClientId,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({ clients, pagination });
    } catch (error) {
        console.error('GetAllClients error:', error);
        res.status(500).json({ error: 'Server error fetching clients' });
    }
};

export const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Role check
        if (req.user.role === 'accountant' && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied to this campus' });
        }

        if (req.user.role === 'client' && client.id !== req.user.client_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(client);
    } catch (error) {
        console.error('GetClientById error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createClient = async (req, res) => {
    const client_db = await pool.connect();
    try {
        if (req.user.role === 'client') return res.status(403).json({ error: 'Clients cannot create records' });

        const { name, city, seat_cost, programs, payment_plan, director_name } = req.body;
        const campus_id = req.user.role === 'accountant' ? req.user.campus_id : req.body.campus_id;

        if (!campus_id) {
            return res.status(400).json({ error: 'Campus ID is required' });
        }

        await client_db.query('BEGIN');

        // 1. Create client
        const client = await Client.create({
            name, city, campus_id, seat_cost, director_name,
            created_by_accountant_name: req.user.name
        }, client_db);

        // 2. Create programs
        if (programs && programs.length > 0) {
            for (const prog of programs) {
                await client_db.query(
                    'INSERT INTO programs (client_id, program_name, seat_count) VALUES ($1, $2, $3)',
                    [client.id, prog.program_name, prog.seat_count]
                );
            }
        }

        // 3. Create payment plan milestones
        if (payment_plan && payment_plan.length > 0) {
            for (let i = 0; i < payment_plan.length; i++) {
                const p = payment_plan[i];
                await client_db.query(
                    'INSERT INTO payment_plans (client_id, payment_type, amount, due_date, display_order) VALUES ($1, $2, $3, $4, $5)',
                    [client.id, p.payment_type, p.amount, p.due_date, i]
                );
            }
        }

        await client_db.query('COMMIT');
        res.status(201).json(client);
    } catch (error) {
        await client_db.query('ROLLBACK');
        console.error('CreateClient error:', error);
        res.status(500).json({ error: 'Failed to create client' });
    } finally {
        client_db.release();
    }
};

export const updateClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        if (req.user.role === 'accountant' && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await Client.update(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        if (req.user.role === 'accountant' && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Client.delete(req.params.id);
        res.json({ message: 'Client deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
    }
};
