import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

async function verify() {
    console.log('🔍 Verifying Owner Records...');
    try {
        const result = await pool.query("SELECT email, role, status FROM users WHERE role = 'owner'");
        console.log('Owner Users in DB:', result.rows);

        if (result.rows.length === 0) {
            console.log('⚠️ No owners found in database!');
        }
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    } finally {
        await pool.end();
    }
}

verify();
