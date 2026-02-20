import pool from '../config/database.js';

export const Voucher = {
    findAll: async ({ campus_id, client_id, status, search, limit = 10, offset = 0 }) => {
        let baseQuery = ' FROM vouchers v LEFT JOIN clients c ON v.client_id = c.id WHERE 1=1';
        const params = [];

        if (campus_id) {
            params.push(campus_id);
            baseQuery += ` AND v.campus_id = $${params.length}`;
        }
        if (client_id) {
            params.push(client_id);
            baseQuery += ` AND v.client_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            baseQuery += ` AND v.status = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            baseQuery += ` AND (v.voucher_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
        }

        const countResult = await pool.query('SELECT COUNT(*)' + baseQuery, params);

        const query = `
      SELECT v.*, c.name as client_name, c.city as client_city
      ${baseQuery}
      ORDER BY v.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return {
            vouchers: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit,
                offset,
                pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        };
    },

    findById: async (id) => {
        const query = `
      SELECT v.*, 
             c.name as client_name, c.city as client_city, c.campus_id as client_campus_id,
             p.payment_type as milestone_name
      FROM vouchers v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN payment_plans p ON v.payment_plan_id = p.id
      WHERE v.id = $1
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    create: async (data) => {
        const {
            voucher_number, client_id, campus_id, payment_plan_id,
            amount, due_date, generated_by_accountant_name
        } = data;

        const query = `
      INSERT INTO vouchers (
        voucher_number, client_id, campus_id, payment_plan_id, 
        amount, due_date, generated_by_accountant_name, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;
        const result = await pool.query(query, [
            voucher_number, client_id, campus_id, payment_plan_id,
            amount, due_date, generated_by_accountant_name
        ]);
        return result.rows[0];
    },

    /**
     * Records a payment directly on the voucher.
     * This is the core of the simplification.
     */
    recordPayment: async (id, paymentData) => {
        const { amount_paid, payment_method, payment_notes, paid_by_accountant_name, paid_date } = paymentData;

        // We use a transaction or a careful UPDATE to increment amount_paid
        const query = `
      UPDATE vouchers
      SET 
        amount_paid = amount_paid + $1,
        payment_method = $2,
        payment_notes = CASE 
          WHEN payment_notes IS NULL OR payment_notes = '' THEN $3 
          ELSE payment_notes || ' | ' || $3 
        END,
        paid_by_accountant_name = $4,
        paid_date = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
        const result = await pool.query(query, [
            amount_paid, payment_method, payment_notes,
            paid_by_accountant_name, paid_date || new Date(), id
        ]);

        const updatedVoucher = result.rows[0];

        // Auto-update status based on new amount_paid
        let status = 'pending';
        if (parseFloat(updatedVoucher.amount_paid) >= parseFloat(updatedVoucher.amount)) {
            status = 'paid';
        } else if (parseFloat(updatedVoucher.amount_paid) > 0) {
            status = 'partial';
        }

        if (status !== updatedVoucher.status) {
            const statusUpdate = await pool.query(
                'UPDATE vouchers SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );
            return statusUpdate.rows[0];
        }

        return updatedVoucher;
    },

    update: async (id, data) => {
        const fields = [];
        const params = [];
        let i = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'balance') { // logic balance is generated
                fields.push(`${key} = $${i++}`);
                params.push(value);
            }
        });

        if (fields.length === 0) return null;

        params.push(id);
        const query = `UPDATE vouchers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
        const result = await pool.query(query, params);
        return result.rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM vouchers WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    generateVoucherNumber: async (campus_id) => {
        const year = new Date().getFullYear();
        const prefix = `VOC-${campus_id}-${year}`;

        const query = `SELECT voucher_number FROM vouchers WHERE voucher_number LIKE $1 ORDER BY created_at DESC LIMIT 1`;
        const result = await pool.query(query, [`${prefix}%`]);

        let sequence = 1;
        if (result.rows.length > 0) {
            const lastVoucher = result.rows[0].voucher_number;
            const parts = lastVoucher.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        return `${prefix}-${sequence.toString().padStart(4, '0')}`;
    }
};
