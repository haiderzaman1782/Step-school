import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const Client = {
    findAll: async ({ limit = 10, offset = 0, search = '', status = '' }) => {
        let baseQuery = ' FROM clients WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            baseQuery += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length} OR client_id ILIKE $${params.length})`;
        }

        if (status) {
            params.push(status);
            baseQuery += ` AND status = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*)' + baseQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Get paginated results
        const query = 'SELECT id, client_id, full_name, email, phone, address, avatar_url, role, status, created_at' +
            baseQuery +
            ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return {
            users: result.rows,
            pagination: {
                total,
                limit,
                offset,
                pages: Math.ceil(total / limit)
            }
        };
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        return result.rows[0];
    },

    findByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM clients WHERE email = $1', [email]);
        return result.rows[0];
    },

    create: async (clientData) => {
        const { client_id, full_name, email, phone, address, avatar_url, password, role, status } = clientData;
        const password_hash = await bcrypt.hash(password, 10);

        const query = `
      INSERT INTO clients (client_id, full_name, email, phone, address, avatar_url, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, client_id, full_name, email, phone, address, avatar_url, role, status, created_at
    `;
        const params = [client_id, full_name, email, phone, address, avatar_url, password_hash, role || 'client', status || 'active'];

        const result = await pool.query(query, params);
        return result.rows[0];
    },

    update: async (id, clientData) => {
        const { full_name, email, phone, address, avatar_url, role, status } = clientData;
        const query = `
      UPDATE clients
      SET full_name = $1, email = $2, phone = $3, address = $4, avatar_url = $5, role = $6, status = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, client_id, full_name, email, phone, address, avatar_url, role, status, updated_at
    `;
        const params = [full_name, email, phone, address, avatar_url, role, status, id];

        const result = await pool.query(query, params);
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
};
