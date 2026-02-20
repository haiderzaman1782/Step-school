import pool from '../config/database.js';

const PAYMENT_TYPE_LABELS = {
    advance: 'Advance Payment',
    after_pre_registration: 'After Pre-Registration',
    submitted_examination: 'After Examination Submission',
    roll_number_slip: 'Roll Number Slip Issuance',
};

/**
 * Generate a sequential, human-readable voucher number: VOC-YYYY-NNN
 */
const generateVoucherNumber = async () => {
    const year = new Date().getFullYear();
    const result = await pool.query(
        `SELECT COUNT(*) FROM school_vouchers WHERE voucher_number LIKE $1`,
        [`VOC-${year}-%`]
    );
    const seq = parseInt(result.rows[0].count) + 1;
    return `VOC-${year}-${String(seq).padStart(3, '0')}`;
};

export const SchoolVoucher = {
    PAYMENT_TYPE_LABELS,

    findAll: async ({ campusId = null, clientId = null, status = '', search = '', limit = 20, offset = 0 } = {}) => {
        const params = [];
        let where = 'WHERE 1=1';

        if (campusId) {
            params.push(campusId);
            where += ` AND sv.campus_id = $${params.length}`;
        }
        if (clientId) {
            params.push(clientId);
            where += ` AND sv.client_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            where += ` AND sv.status = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            where += ` AND (sv.voucher_number ILIKE $${params.length} OR sc.name ILIKE $${params.length})`;
        }

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM school_vouchers sv JOIN school_clients sc ON sc.id = sv.client_id ${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const dataParams = [...params, limit, offset];
        const result = await pool.query(
            `SELECT
         sv.*,
         sc.name AS client_name,
         sc.city AS client_city,
         ca.name AS campus_name,
         pp.payment_type,
         pp.display_order
       FROM school_vouchers sv
       JOIN school_clients sc ON sc.id = sv.client_id
       JOIN campuses ca ON ca.id = sv.campus_id
       JOIN payment_plans pp ON pp.id = sv.payment_plan_id
       ${where}
       ORDER BY sv.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
        );

        return { vouchers: result.rows, pagination: { total, limit, offset } };
    },

    findById: async (id) => {
        const result = await pool.query(
            `SELECT
         sv.*,
         sc.name AS client_name, sc.city AS client_city,
         sc.total_seats, sc.seat_cost, sc.total_amount,
         ca.name AS campus_name,
         pp.payment_type, pp.amount AS plan_amount, pp.display_order,
         gen.full_name AS generated_by_name,
         paid_by.full_name AS paid_by_name
       FROM school_vouchers sv
       JOIN school_clients sc ON sc.id = sv.client_id
       JOIN campuses ca ON ca.id = sv.campus_id
       JOIN payment_plans pp ON pp.id = sv.payment_plan_id
       JOIN clients gen ON gen.id = sv.generated_by_accountant_id
       LEFT JOIN clients paid_by ON paid_by.id = sv.paid_by_accountant_id
       WHERE sv.id = $1`,
            [id]
        );
        return result.rows[0];
    },

    create: async ({ client_id, payment_plan_id, amount, generated_by_accountant_id, campus_id }) => {
        const voucher_number = await generateVoucherNumber();
        const result = await pool.query(
            `INSERT INTO school_vouchers
         (voucher_number, client_id, payment_plan_id, amount, generated_by_accountant_id, campus_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [voucher_number, client_id, payment_plan_id, amount, generated_by_accountant_id, campus_id]
        );
        return result.rows[0];
    },

    markPaid: async (id, { paid_by_accountant_id, paid_date }) => {
        const result = await pool.query(
            `UPDATE school_vouchers
       SET status = 'paid', paid_date = $1, paid_by_accountant_id = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [paid_date, paid_by_accountant_id, id]
        );
        return result.rows[0];
    },

    cancel: async (id) => {
        const result = await pool.query(
            `UPDATE school_vouchers SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    },
};
