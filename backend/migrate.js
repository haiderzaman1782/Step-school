/**
 * Database Migration Runner
 * Run with:  node migrate.js
 * from the /backend directory (requires .env to be present)
 */

import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
});

const MIGRATION_FILE = path.join(__dirname, 'database', 'migration_client_program_payment.sql');

async function run() {
    console.log('\n🚀  Step School — Client-Program-Payment Migration');
    console.log('═══════════════════════════════════════════════\n');

    // Verify connection
    let client;
    try {
        client = await pool.connect();
        console.log('✅  Connected to database:', process.env.DB_NAME, 'on', process.env.DB_HOST);
    } catch (err) {
        console.error('❌  Could not connect to database:', err.message);
        process.exit(1);
    }

    // Read SQL file
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    console.log('📄  Migration file loaded:', MIGRATION_FILE);

    // Execute
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('\n✅  Migration completed successfully!\n');
        console.log('Tables created / updated:');
        console.log('  • campuses');
        console.log('  • school_clients  (with auto-calc trigger)');
        console.log('  • programs        (triggers update parent)');
        console.log('  • payment_plans');
        console.log('  • fee_payments');
        console.log('  • school_vouchers');
        console.log('\n⚠️   Reminder: assign campus_id to each accountant in the clients table.');
        console.log('    Example: UPDATE clients SET campus_id = 1 WHERE role = \'accountant\';\n');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌  Migration FAILED — rolled back.\n');
        console.error(err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
