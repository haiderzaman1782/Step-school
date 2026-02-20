import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

async function setup() {
    console.log('🛡️  Setting up Owner Account...');
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // We ensure both .edu and .com exist for convenience if requested
        const emails = ['admin@stepschool.edu', 'admin@stepschool.com'];

        for (const email of emails) {
            await pool.query(`
                INSERT INTO users (email, password_hash, full_name, role, status)
                VALUES ($1, $2, 'System Administrator', 'owner', 'active')
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = EXCLUDED.password_hash, role = 'owner'
            `, [email, hashedPassword]);
            console.log(`✅  User ${email} is ready.`);
        }

        console.log('\n🚀  Owner accounts initialized successfully!');
    } catch (err) {
        console.error('❌  Setup failed:', err.message);
    } finally {
        await pool.end();
    }
}

setup();
