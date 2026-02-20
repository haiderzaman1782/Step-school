/**
 * Step School Fresh Deployment Runner (V3)
 * Run with: node deploy_fresh.js
 * WARNING: This script WIPES OUT the entire database schema and starts fresh.
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

const SCHEMA_FILE = path.join(__dirname, 'database', 'schema_v3_fresh.sql');

async function run() {
    console.log('\n🔥  Step School — Fresh Database Deployment (V3)');
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
        const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
        console.log('🗑️   Wiping existing tables and applying fresh schema...');

        await client.query(sql);

        console.log('\n✨  SUCCESS! Fresh simplified architecture deployed.');
        console.log('  • All legacy tables dropped.');
        console.log('  • Campuses, Clients, Programs, Payment Plans, and Vouchers tables created.');
        console.log('  • Initial campuses (Lahore Main, City, Faisalabad) seeded.');
        console.log('\n🚀  System is ready for new client registrations.');
    } catch (err) {
        console.error('\n❌  Deployment FAILED:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
