import pool from '../config/database.js';

export const Voucher = {
    findAll: async ({ limit = 10, offset = 0, status = '', clientId = '', search = '' }) => {
        let query = `
      SELECT v.*, c.full_name as client_name, pt.type_name as payment_type_name
      FROM vouchers v
      JOIN clients c ON v.client_id = c.id
      JOIN payment_types pt ON v.payment_type_id = pt.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND v.status = $${params.length}`;
        }

        if (clientId) {
            params.push(clientId);
            query += ` AND v.client_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (v.voucher_number ILIKE $${params.length} OR c.full_name ILIKE $${params.length})`;
        }

        query += ` ORDER BY v.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    },

    findById: async (id) => {
        const query = `
      SELECT v.*, c.full_name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address,
             pt.type_name as payment_type_name
      FROM vouchers v
      JOIN clients c ON v.client_id = c.id
      JOIN payment_types pt ON v.payment_type_id = pt.id
      WHERE v.id = $1
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    create: async (voucherData) => {
        const { voucher_number, client_id, payment_type_id, amount, due_date, description, attachment_url, created_by } = voucherData;
        const query = `
      INSERT INTO vouchers (voucher_number, client_id, payment_type_id, amount, due_date, description, attachment_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const params = [voucher_number, client_id, payment_type_id, amount, due_date, description, attachment_url, created_by];

        const result = await pool.query(query, params);
        return result.rows[0];
    },

    updateStatus: async (id, status, payment_date = null, payment_method = null, reference_number = null) => {
        const query = `
      UPDATE vouchers
      SET status = $1, payment_date = $2, payment_method = $3, reference_number = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
        const params = [status, payment_date, payment_method, reference_number, id];

        const result = await pool.query(query, params);
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM vouchers WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
};
