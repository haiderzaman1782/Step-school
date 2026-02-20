import pool from '../config/database.js';

const DEFAULT_PAYMENT_PLAN = [
    { payment_type: 'advance', display_order: 1, amount: 30000 },
    { payment_type: 'after_pre_registration', display_order: 2, amount: 10000 },
    { payment_type: 'submitted_examination', display_order: 3, amount: 10000 },
    { payment_type: 'roll_number_slip', display_order: 4, amount: 10000 },
];

export const PaymentPlan = {
    DEFAULT_PLAN: DEFAULT_PAYMENT_PLAN,

    findByClientId: async (clientId) => {
        const result = await pool.query(
            `SELECT
         pp.*,
         COALESCE(SUM(fp.amount_paid), 0) AS paid_amount,
         CASE WHEN COUNT(fp.id) > 0 THEN TRUE ELSE FALSE END AS paid
       FROM payment_plans pp
       LEFT JOIN fee_payments fp ON fp.payment_plan_id = pp.id
       WHERE pp.client_id = $1
       GROUP BY pp.id
       ORDER BY pp.display_order`,
            [clientId]
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM payment_plans WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async ({ client_id, payment_type, amount, due_date = null, display_order }) => {
        const result = await pool.query(
            `INSERT INTO payment_plans (client_id, payment_type, amount, due_date, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [client_id, payment_type, amount, due_date, display_order]
        );
        return result.rows[0];
    },

    /**
     * Create the default 4-milestone plan for a client.
     */
    createDefaults: async (clientId) => {
        const rows = [];
        for (const plan of DEFAULT_PAYMENT_PLAN) {
            const row = await PaymentPlan.create({ client_id: clientId, ...plan });
            rows.push(row);
        }
        return rows;
    },

    /**
     * Bulk-create from provided array.
     */
    bulkCreate: async (clientId, planArray) => {
        const rows = [];
        for (const plan of planArray) {
            const row = await PaymentPlan.create({ client_id: clientId, ...plan });
            rows.push(row);
        }
        return rows;
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM payment_plans WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },
};
