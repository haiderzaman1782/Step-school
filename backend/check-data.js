import pool from './src/config/database.js';

async function checkData() {
    try {
        const usersResult = await pool.query("SELECT * FROM users LIMIT 1");
        if (usersResult.rows.length > 0) {
            console.log('USER ROW KEYS:', Object.keys(usersResult.rows[0]).join(', '));
        } else {
            console.log('USERS table is empty');
        }

        const paymentsResult = await pool.query("SELECT * FROM payments LIMIT 1");
        if (paymentsResult.rows.length > 0) {
            console.log('PAYMENT ROW KEYS:', Object.keys(paymentsResult.rows[0]).join(', '));
        } else {
            console.log('PAYMENTS table is empty');
        }

        pool.end();
    } catch (err) {
        console.error('Error checking data:', err);
        process.exit(1);
    }
}

checkData();
