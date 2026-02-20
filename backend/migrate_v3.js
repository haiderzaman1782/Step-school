/**
 * Step School Simplification Migration Runner (V3)
 * Run with: node migrate_v3.js
 */

import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '6543'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
};

const pool = new Pool(poolConfig);

const MIGRATION_FILE = path.join(__dirname, 'database', 'migration_v3_simplification.sql');

async function run() {
    console.log('\n🗑️  Step School — System Simplification Migration (V3)');
    console.log('═══════════════════════════════════════════════\n');

    if (!process.env.DB_PASSWORD) {
        console.error('❌  Error: DB_PASSWORD is not set in .env file.');
        process.exit(1);
    }

    let client;
    try {
        client = await pool.connect();
        console.log('✅  Connected to database:', process.env.DB_NAME);
    } catch (err) {
        console.error('❌  Connection failed:', err.message);
        process.exit(1);
    }

    try {
        const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
        console.log('📄  Running migration script...');

        await client.query(sql);

        console.log('\n✨  SUCCESS! System architecture simplified.');
        console.log('  • Users/Payments tables removed after data preservation.');
        console.log('  • school_clients renamed to clients.');
        console.log('  • school_vouchers renamed to vouchers (now with embedded payment data).');
        console.log('\n⚠️   IMPORTANT: You must now use environment-based authentication.');
    } catch (err) {
        console.error('\n❌  Migration FAILED:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
