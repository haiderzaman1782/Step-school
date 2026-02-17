import pool from '../config/database.js';

export const PaymentType = {
    findAll: async (onlyActive = true) => {
        let query = 'SELECT * FROM payment_types';
        if (onlyActive) {
            query += ' WHERE is_active = true';
        }
        query += ' ORDER BY type_name ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    create: async (data) => {
        const { type_name, description } = data;
        const result = await pool.query(
            'INSERT INTO payment_types (type_name, description) VALUES ($1, $2) RETURNING *',
            [type_name, description]
        );
        return result.rows[0];
    },

    update: async (id, data) => {
        const { type_name, description, is_active } = data;
        const result = await pool.query(
            'UPDATE payment_types SET type_name = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [type_name, description, is_active, id]
        );
        return result.rows[0];
    }
};
