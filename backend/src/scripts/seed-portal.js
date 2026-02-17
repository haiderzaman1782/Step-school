import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const seedPortal = async () => {
    try {
        console.log('Seeding portal data...');

        // 1. Create Accountant
        const accountantPass = await bcrypt.hash('admin123', 10);
        const accountant = await pool.query(`
      INSERT INTO clients (client_id, full_name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['ACC-001', 'Admin Accountant', 'admin@stepschool.com', accountantPass, 'accountant', 'active']);

        // 2. Create Clients
        const clientPass = await bcrypt.hash('client123', 10);
        const clients = [
            ['CL-001', 'John Doe', 'john@example.com'],
            ['CL-002', 'Jane Smith', 'jane@example.com'],
            ['CL-003', 'Robert Wilson', 'robert@example.com']
        ];

        const clientIds = [];
        for (const [cid, name, email] of clients) {
            const res = await pool.query(`
        INSERT INTO clients (client_id, full_name, email, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id
      `, [cid, name, email, clientPass, 'client', 'active']);
            clientIds.push(res.rows[0].id);
        }

        // 3. Get Payment Types
        const ptRes = await pool.query('SELECT id, type_name FROM payment_types');
        const paymentTypes = ptRes.rows;

        // 4. Create Vouchers
        const vouchers = [
            { num: 'VCH-001', cid: clientIds[0], ptid: paymentTypes[0].id, amt: 500, status: 'paid', date: '2026-02-10' },
            { num: 'VCH-002', cid: clientIds[0], ptid: paymentTypes[2].id, amt: 200, status: 'pending', date: '2026-03-01' },
            { num: 'VCH-003', cid: clientIds[1], ptid: paymentTypes[1].id, amt: 1200, status: 'paid', date: '2026-01-15' },
            { num: 'VCH-004', cid: clientIds[2], ptid: paymentTypes[3].id, amt: 3000, status: 'pending', date: '2026-04-01' }
        ];

        for (const v of vouchers) {
            await pool.query(`
        INSERT INTO vouchers (voucher_number, client_id, payment_type_id, amount, due_date, status, payment_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (voucher_number) DO NOTHING
      `, [v.num, v.cid, v.ptid, v.amt, v.date, v.status, v.status === 'paid' ? v.date : null]);
        }

        console.log('Portal seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedPortal();
