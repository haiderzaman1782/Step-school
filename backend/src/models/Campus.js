import pool from '../config/database.js';

export const Campus = {
    findAll: async () => {
        const result = await pool.query('SELECT * FROM campuses ORDER BY name ASC');
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM campuses WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async (data) => {
        const { name, city, location } = data;
        const query = `
            INSERT INTO campuses (name, city, location)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [name, city, location]);
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM campuses WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
};
