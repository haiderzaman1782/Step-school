import pool from './src/config/database.js';

async function checkSchema() {
    try {
        const usersResult = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log('USERS COLUMNS:', usersResult.rows.map(r => r.column_name).join(', '));

        const paymentsResult = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'");
        console.log('PAYMENTS COLUMNS:', paymentsResult.rows.map(r => r.column_name).join(', '));

        pool.end();
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
