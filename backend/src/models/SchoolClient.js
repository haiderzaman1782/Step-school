import pool from '../config/database.js';

export const SchoolClient = {
    /**
     * Get all school clients, campus-filtered for accountant.
     */
    findAll: async ({ campusId = null, search = '', page = 1, limit = 20 } = {}) => {
        const offset = (page - 1) * limit;
        const params = [];
        let where = 'WHERE 1=1';

        if (campusId) {
            params.push(campusId);
            where += ` AND sc.campus_id = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            where += ` AND (sc.name ILIKE $${params.length} OR sc.city ILIKE $${params.length})`;
        }

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM school_clients sc ${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const dataParams = [...params, limit, offset];
        const result = await pool.query(
            `SELECT
         sc.id, sc.name, sc.city, sc.campus_id, sc.total_seats,
         sc.seat_cost, sc.total_amount, sc.created_at,
         ca.name AS campus_name,
         (SELECT COUNT(*) FROM programs p WHERE p.client_id = sc.id) AS programs_count,
         COALESCE((SELECT SUM(fp.amount_paid) FROM fee_payments fp WHERE fp.client_id = sc.id), 0) AS total_paid,
         sc.total_amount - COALESCE((SELECT SUM(fp.amount_paid) FROM fee_payments fp WHERE fp.client_id = sc.id), 0) AS balance
       FROM school_clients sc
       JOIN campuses ca ON ca.id = sc.campus_id
       ${where}
       ORDER BY sc.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
        );

        return {
            clients: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    },

    /**
     * Get a single school client with full nested data.
     */
    findById: async (id) => {
        // Client base row
        const clientResult = await pool.query(
            `SELECT
         sc.*,
         ca.name AS campus_name,
         u.full_name AS created_by_name,
         COALESCE((SELECT SUM(fp.amount_paid) FROM fee_payments fp WHERE fp.client_id = sc.id), 0) AS total_paid,
         sc.total_amount - COALESCE((SELECT SUM(fp.amount_paid) FROM fee_payments fp WHERE fp.client_id = sc.id), 0) AS balance
       FROM school_clients sc
       JOIN campuses ca ON ca.id = sc.campus_id
       LEFT JOIN clients u ON u.id = sc.created_by_accountant_id
       WHERE sc.id = $1`,
            [id]
        );
        if (!clientResult.rows[0]) return null;
        const client = clientResult.rows[0];

        // Programs
        const programsResult = await pool.query(
            `SELECT id, program_name, seat_count, created_at
       FROM programs WHERE client_id = $1 ORDER BY created_at`,
            [id]
        );

        // Payment plan with paid status
        const planResult = await pool.query(
            `SELECT
         pp.*,
         CASE WHEN EXISTS(
           SELECT 1 FROM fee_payments fp WHERE fp.payment_plan_id = pp.id
         ) THEN TRUE ELSE FALSE END AS paid,
         COALESCE((SELECT SUM(fp.amount_paid) FROM fee_payments fp WHERE fp.payment_plan_id = pp.id), 0) AS paid_amount,
         (SELECT fp.payment_date FROM fee_payments fp WHERE fp.payment_plan_id = pp.id ORDER BY fp.created_at DESC LIMIT 1) AS paid_date
       FROM payment_plans pp
       WHERE pp.client_id = $1
       ORDER BY pp.display_order`,
            [id]
        );

        // Payment history
        const historyResult = await pool.query(
            `SELECT
         fp.*,
         pp.payment_type,
         u.full_name AS recorded_by,
         sv.voucher_number
       FROM fee_payments fp
       JOIN payment_plans pp ON pp.id = fp.payment_plan_id
       JOIN clients u ON u.id = fp.recorded_by_accountant_id
       LEFT JOIN school_vouchers sv ON sv.id = fp.voucher_id
       WHERE fp.client_id = $1
       ORDER BY fp.payment_date DESC, fp.created_at DESC`,
            [id]
        );

        return {
            ...client,
            programs: programsResult.rows,
            payment_plan: planResult.rows,
            payment_history: historyResult.rows,
        };
    },

    create: async ({ name, campus_id, seat_cost, city = null, created_by_accountant_id }) => {
        const result = await pool.query(
            `INSERT INTO school_clients (name, campus_id, seat_cost, city, created_by_accountant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, campus_id, seat_cost, city, created_by_accountant_id]
        );
        return result.rows[0];
    },

    update: async (id, { name, seat_cost, city }) => {
        const result = await pool.query(
            `UPDATE school_clients
       SET name = COALESCE($1, name),
           seat_cost = COALESCE($2, seat_cost),
           city = COALESCE($3, city),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
            [name, seat_cost, city, id]
        );
        // After seat_cost change, recalculate total_amount
        await pool.query(
            `UPDATE school_clients
       SET total_amount = total_seats * seat_cost, updated_at = NOW()
       WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query(
            'DELETE FROM school_clients WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    },
};
