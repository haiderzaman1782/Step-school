import pool from '../config/database.js';

export const Client = {
    findAll: async ({ campus_id, client_id, search = '', limit = 10, offset = 0 }) => {
        let baseQuery = ' FROM clients WHERE 1=1';
        const params = [];

        if (campus_id) {
            params.push(campus_id);
            baseQuery += ` AND campus_id = $${params.length}`;
        }

        if (client_id) {
            params.push(client_id);
            baseQuery += ` AND id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            baseQuery += ` AND (name ILIKE $${params.length} OR city ILIKE $${params.length})`;
        }

        const countResult = await pool.query('SELECT COUNT(*)' + baseQuery, params);

        const query = `
      SELECT * ${baseQuery}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return {
            clients: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit,
                offset,
                pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        };
    },

    findById: async (id) => {
        // Get client with programs, payment plan and payment history (from vouchers)
        const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        const client = clientRes.rows[0];

        if (!client) return null;

        const programs = await pool.query('SELECT * FROM programs WHERE client_id = $1', [id]);
        const paymentPlan = await pool.query('SELECT * FROM payment_plans WHERE client_id = $1 ORDER BY display_order', [id]);

        // Derived payment history from vouchers
        const paymentHistory = await pool.query(`
      SELECT v.id as voucher_id, v.voucher_number, v.amount_paid, v.paid_date as payment_date, 
             v.payment_method, v.payment_notes, p.payment_type as milestone
      FROM vouchers v
      JOIN payment_plans p ON v.payment_plan_id = p.id
      WHERE v.client_id = $1 AND v.amount_paid > 0
      ORDER BY v.paid_date DESC
    `, [id]);

        return {
            ...client,
            programs: programs.rows,
            payment_plan: paymentPlan.rows,
            payment_history: paymentHistory.rows
        };
    },

    create: async (data, client_db = pool) => {
        const { name, director_name, city, campus_id, seat_cost, created_by_accountant_name } = data;
        const query = `
      INSERT INTO clients (name, director_name, city, campus_id, seat_cost, created_by_accountant_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const result = await client_db.query(query, [name, director_name, city, campus_id, seat_cost, created_by_accountant_name]);
        return result.rows[0];
    },

    update: async (id, data) => {
        const fields = [];
        const params = [];
        let i = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'total_seats' && key !== 'total_amount') {
                fields.push(`${key} = $${i++}`);
                params.push(value);
            }
        });

        if (fields.length === 0) return null;

        params.push(id);
        const query = `UPDATE clients SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
        const result = await pool.query(query, params);
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
};
