import pool from '../config/database.js';
import { SchoolClient } from '../models/SchoolClient.js';
import { Program } from '../models/Program.js';
import { PaymentPlan } from '../models/PaymentPlan.js';

// ──────────────────────────────────────────────────────────
// GET /api/school-clients
// Owner: all campuses | Accountant: own campus only
// ──────────────────────────────────────────────────────────
export const getAllSchoolClients = async (req, res) => {
    try {
        const { search, page = 1, limit = 20, campus_id } = req.query;
        const isOwner = req.user.role === 'admin' || req.user.role === 'owner';

        // Accountants are locked to their campus
        const effectiveCampusId = isOwner
            ? (campus_id || null)
            : req.user.campus_id;

        const data = await SchoolClient.findAll({
            campusId: effectiveCampusId,
            search,
            page: parseInt(page),
            limit: parseInt(limit),
        });

        res.json(data);
    } catch (err) {
        console.error('getAllSchoolClients:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// GET /api/school-clients/:id
// ──────────────────────────────────────────────────────────
export const getSchoolClientById = async (req, res) => {
    try {
        const client = await SchoolClient.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        // Accountant campus isolation
        const isOwner = req.user.role === 'admin' || req.user.role === 'owner';
        if (!isOwner && client.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot access clients from other campuses' });
        }

        res.json(client);
    } catch (err) {
        console.error('getSchoolClientById:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// POST /api/school-clients
// Body: { name, city, seat_cost, programs[], payment_plan[] }
// ──────────────────────────────────────────────────────────
export const createSchoolClient = async (req, res) => {
    const dbClient = await pool.connect();
    try {
        const { name, city, seat_cost, programs = [], payment_plan } = req.body;

        // Validate required
        if (!name || !seat_cost) {
            return res.status(400).json({ error: 'name and seat_cost are required' });
        }
        if (!programs.length) {
            return res.status(400).json({ error: 'At least one program is required' });
        }
        if (isNaN(parseFloat(seat_cost)) || parseFloat(seat_cost) <= 0) {
            return res.status(400).json({ error: 'seat_cost must be greater than 0' });
        }
        for (const p of programs) {
            if (!p.program_name) return res.status(400).json({ error: 'program_name is required for all programs' });
            if (!p.seat_count || parseInt(p.seat_count) <= 0) {
                return res.status(400).json({ error: 'seat_count must be greater than 0 for all programs' });
            }
        }

        // Force campus from JWT
        const campus_id = req.user.campus_id;
        if (!campus_id) {
            return res.status(400).json({ error: 'Accountant has no campus assigned. Contact admin.' });
        }

        await dbClient.query('BEGIN');

        // 1. Create school client
        const newClient = await dbClient.query(
            `INSERT INTO school_clients (name, campus_id, seat_cost, city, created_by_accountant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, campus_id, parseFloat(seat_cost), city || null, req.user.id]
        );
        const schoolClient = newClient.rows[0];

        // 2. Create programs (trigger will auto-calc totals)
        const createdPrograms = [];
        for (const p of programs) {
            const prog = await dbClient.query(
                `INSERT INTO programs (client_id, program_name, seat_count) VALUES ($1, $2, $3) RETURNING *`,
                [schoolClient.id, p.program_name, parseInt(p.seat_count)]
            );
            createdPrograms.push(prog.rows[0]);
        }

        // 3. Create payment plan (use provided or defaults)
        const planData = payment_plan && payment_plan.length ? payment_plan : PaymentPlan.DEFAULT_PLAN;
        const createdPlan = [];
        for (const item of planData) {
            const pl = await dbClient.query(
                `INSERT INTO payment_plans (client_id, payment_type, amount, due_date, display_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [schoolClient.id, item.payment_type, parseFloat(item.amount), item.due_date || null, item.display_order]
            );
            createdPlan.push(pl.rows[0]);
        }

        await dbClient.query('COMMIT');

        // 4. Return fresh client with updated totals (trigger ran in DB)
        const fullClient = await SchoolClient.findById(schoolClient.id);
        res.status(201).json(fullClient);
    } catch (err) {
        await dbClient.query('ROLLBACK');
        console.error('createSchoolClient:', err);
        res.status(500).json({ error: err.message });
    } finally {
        dbClient.release();
    }
};

// ──────────────────────────────────────────────────────────
// PUT /api/school-clients/:id
// ──────────────────────────────────────────────────────────
export const updateSchoolClient = async (req, res) => {
    try {
        const existing = await SchoolClient.findById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Client not found' });

        if (existing.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot modify clients from other campuses' });
        }

        const updated = await SchoolClient.update(req.params.id, req.body);
        const fullClient = await SchoolClient.findById(updated.id);
        res.json(fullClient);
    } catch (err) {
        console.error('updateSchoolClient:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/school-clients/:id
// ──────────────────────────────────────────────────────────
export const deleteSchoolClient = async (req, res) => {
    try {
        const existing = await SchoolClient.findById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Client not found' });

        if (existing.campus_id !== req.user.campus_id) {
            return res.status(403).json({ error: 'Cannot delete clients from other campuses' });
        }

        await SchoolClient.delete(req.params.id);
        res.json({ message: 'Client deleted successfully' });
    } catch (err) {
        console.error('deleteSchoolClient:', err);
        res.status(500).json({ error: err.message });
    }
};
