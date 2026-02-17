import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const setupAdmin = async () => {
    try {
        console.log('Ensuring default admin user exists...');

        const email = 'admin@stepschool.com';
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        const checkRes = await pool.query('SELECT id FROM clients WHERE email = $1', [email]);

        if (checkRes.rows.length === 0) {
            console.log('Admin not found. Creating default admin...');
            await pool.query(`
                INSERT INTO clients (client_id, full_name, email, password_hash, role, status)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['ACC-ADMIN', 'System Admin', email, hash, 'accountant', 'active']);
            console.log('Default admin created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
};

setupAdmin();
