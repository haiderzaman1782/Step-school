import pool from '../config/database.js';

export const FeePayment = {
    findByClientId: async (clientId) => {
        const result = await pool.query(
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
            [clientId]
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query(
            `SELECT
         fp.*,
         pp.payment_type,
         sc.campus_id,
         u.full_name AS recorded_by
       FROM fee_payments fp
       JOIN payment_plans pp ON pp.id = fp.payment_plan_id
       JOIN school_clients sc ON sc.id = fp.client_id
       JOIN clients u ON u.id = fp.recorded_by_accountant_id
       WHERE fp.id = $1`,
            [id]
        );
        return result.rows[0];
    },

    create: async ({
        client_id,
        voucher_id = null,
        payment_plan_id,
        amount_paid,
        payment_date,
        payment_method = null,
        recorded_by_accountant_id,
        notes = null,
    }) => {
        const result = await pool.query(
            `INSERT INTO fee_payments
         (client_id, voucher_id, payment_plan_id, amount_paid, payment_date, payment_method, recorded_by_accountant_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [client_id, voucher_id, payment_plan_id, amount_paid, payment_date, payment_method, recorded_by_accountant_id, notes]
        );
        return result.rows[0];
    },

    update: async (id, { payment_plan_id, amount_paid, payment_date, payment_method, notes }) => {
        const fields = [];
        const vals = [];
        let i = 1;
        if (payment_plan_id !== undefined) { fields.push(`payment_plan_id = $${i++}`); vals.push(payment_plan_id); }
        if (amount_paid !== undefined) { fields.push(`amount_paid = $${i++}`); vals.push(amount_paid); }
        if (payment_date !== undefined) { fields.push(`payment_date = $${i++}`); vals.push(payment_date); }
        if (payment_method !== undefined) { fields.push(`payment_method = $${i++}`); vals.push(payment_method); }
        if (notes !== undefined) { fields.push(`notes = $${i++}`); vals.push(notes); }
        if (!fields.length) return FeePayment.findById(id);
        vals.push(id);
        const result = await pool.query(
            `UPDATE fee_payments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
            vals
        );
        return result.rows[0];
    },
};
