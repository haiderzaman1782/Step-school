import pool from '../config/database.js';

export const Program = {
    findByClientId: async (clientId) => {
        const result = await pool.query(
            'SELECT * FROM programs WHERE client_id = $1 ORDER BY created_at',
            [clientId]
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async ({ client_id, program_name, seat_count }) => {
        const result = await pool.query(
            `INSERT INTO programs (client_id, program_name, seat_count)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [client_id, program_name, seat_count]
        );
        return result.rows[0];
    },

    update: async (id, { program_name, seat_count }) => {
        const fields = [];
        const vals = [];
        let i = 1;
        if (program_name !== undefined) { fields.push(`program_name = $${i++}`); vals.push(program_name); }
        if (seat_count !== undefined) { fields.push(`seat_count = $${i++}`); vals.push(seat_count); }
        if (!fields.length) return Program.findById(id);
        fields.push(`updated_at = NOW()`);
        vals.push(id);
        const result = await pool.query(
            `UPDATE programs SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            vals
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM programs WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    countByClientId: async (clientId) => {
        const result = await pool.query(
            'SELECT COUNT(*) FROM programs WHERE client_id = $1',
            [clientId]
        );
        return parseInt(result.rows[0].count);
    },
};
