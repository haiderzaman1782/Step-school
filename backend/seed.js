import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

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

async function seed() {
    console.log('🚀 Starting Seeding...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Ensure Campuses exist (IDs 1, 2, 3)
        await client.query(`
      INSERT INTO campuses (id, name, city) 
      VALUES (1, 'Main Campus', 'Lahore'), (2, 'City Campus', 'Lahore'), (3, 'FSD College', 'Faisalabad')
      ON CONFLICT (id) DO NOTHING
    `);

        // 2. Create Accountant User
        const hashedAccPass = await bcrypt.hash('pass123', 10);
        await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, campus_id)
      VALUES ('accountant@stepschool.edu', $1, 'Main Accountant', 'accountant', 1)
      ON CONFLICT (email) DO NOTHING
    `, [hashedAccPass]);

        const schools = [
            {
                name: 'Step School (Adeel)',
                director: 'Adeel',
                students: 15,
                seat_cost: 115000,
                total_amount: 1725000,
                campus_id: 1,
                received: 267000,
                milestones: [{ type: 'advance', amt: 20000 }, { type: 'pre_reg', amt: 10000 }, { type: 'exam', amt: 10000 }, { type: 'roll_slip', amt: 10000 }],
                email: 'adeel@school.edu'
            },
            {
                name: 'Step School (Jameel)',
                director: 'Jameel',
                students: 26,
                seat_cost: 115384.62,
                total_amount: 3000000,
                campus_id: 1,
                received: 918000,
                milestones: [{ type: 'advance', amt: 30000 }, { type: 'pre_reg', amt: 10000 }, { type: 'exam', amt: 10000 }, { type: 'roll_slip', amt: 10000 }],
                email: 'jameel@school.edu'
            },
            {
                name: 'Step School (Haroon)',
                director: 'Haroon',
                students: 2,
                seat_cost: 105000,
                total_amount: 210000,
                campus_id: 2,
                received: 60000,
                milestones: [{ type: 'advance', amt: 30000 }, { type: 'pre_reg', amt: 10000 }, { type: 'exam', amt: 10000 }, { type: 'roll_slip', amt: 10000 }],
                email: 'haroon@school.edu'
            },
            {
                name: 'Step School (Raffy)',
                director: 'Raffy',
                students: 16,
                seat_cost: 105000,
                total_amount: 1680000,
                campus_id: 3,
                received: 270000,
                milestones: [{ type: 'advance', amt: 30000 }, { type: 'pre_reg', amt: 10000 }, { type: 'exam', amt: 10000 }, { type: 'roll_slip', amt: 10000 }],
                email: 'raffy@school.edu'
            }
        ];

        for (const s of schools) {
            // Create Client
            const clientRes = await client.query(`
        INSERT INTO clients (name, director_name, city, campus_id, seat_cost)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [s.name, s.director, 'City Con', s.campus_id, s.seat_cost]);
            const clientId = clientRes.rows[0].id;

            // Create Programs (Generic one for all students)
            await client.query(`
        INSERT INTO programs (client_id, program_name, seat_count)
        VALUES ($1, 'General Program', $2)
      `, [clientId, s.students]);

            // Create Milestone & Voucher (Advance)
            let currentReceived = s.received;

            for (let i = 0; i < s.milestones.length; i++) {
                const m = s.milestones[i];
                const mTotalAmt = m.amt * s.students;

                const planRes = await client.query(`
          INSERT INTO payment_plans (client_id, payment_type, amount, display_order)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [clientId, m.type, mTotalAmt, i]);
                const planId = planRes.rows[0].id;

                // Generate Voucher for this milestone
                const vNo = `VOC-${s.director.toUpperCase()}-${i + 1}`;
                const payAmt = Math.min(currentReceived, mTotalAmt);
                currentReceived -= payAmt;

                await client.query(`
          INSERT INTO vouchers (
            voucher_number, client_id, campus_id, payment_plan_id, 
            amount, amount_paid, status, generated_by_accountant_name
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'System Seed')
        `, [
                    vNo, clientId, s.campus_id, planId,
                    mTotalAmt, payAmt, (payAmt >= mTotalAmt ? 'paid' : (payAmt > 0 ? 'partial' : 'pending'))
                ]);
            }

            // Create Director User
            const hashedDirPass = await bcrypt.hash('pass123', 10);
            await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, client_id)
        VALUES ($1, $2, $3, 'client', $4)
        ON CONFLICT (email) DO NOTHING
      `, [s.email, hashedDirPass, s.director, clientId]);
        }

        await client.query('COMMIT');
        console.log('✅ Seeding completed successfully!');
        console.log('\n--- LOGIN CREDENTIALS ---');
        console.log('Owner (Env): admin@stepschool.edu / admin123');
        console.log('Accountant: accountant@stepschool.edu / pass123');
        console.log('Director Adeel: adeel@school.edu / pass123');
        console.log('Director Jameel: jameel@school.edu / pass123');
        console.log('Director Haroon: haroon@school.edu / pass123');
        console.log('Director Raffy: raffy@school.edu / pass123');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();