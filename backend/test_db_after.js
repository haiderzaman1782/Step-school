import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});
async function test() {
    try {
        const res = await pool.query("SELECT current_database(), table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Connected to:', res.rows[0].current_database);
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('Connection Error:', err.message);
    } finally {
        await pool.end();
    }
}
test();
