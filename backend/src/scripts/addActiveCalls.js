import pool from '../config/database.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel',
  'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Amy', 'Mark', 'Angela'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
];

const callTypes = ['incoming', 'outgoing'];
const purposes = [
  'Consultation inquiry', 'Follow-up call', 'Emergency',
  'General inquiry', 'Payment inquiry', 'Service request', 'Complaint',
  'Feedback', 'Rescheduling'
];

const addActiveCalls = async () => {
  try {
    // Get existing users
    const users = await User.findAll({ limit: 1000 });
    if (users.length === 0) {
      process.exit(1);
    }

    // Determine number of active calls (3 or 4)
    const activeCallsCount = Math.random() > 0.5 ? 4 : 3;

    // Get the highest existing call ID to generate new unique IDs
    const maxIdResult = await pool.query(
      "SELECT id FROM calls WHERE id LIKE 'CALL%' ORDER BY CAST(SUBSTRING(id FROM 5) AS INTEGER) DESC LIMIT 1"
    );

    let nextCallNumber = 1;
    if (maxIdResult.rows.length > 0) {
      const maxId = maxIdResult.rows[0].id;
      const numberPart = parseInt(maxId.replace('CALL', ''));
      nextCallNumber = numberPart + 1;
    }

    const calls = [];

    for (let i = 0; i < activeCallsCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const callerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const phoneNumber = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
      const callType = callTypes[Math.floor(Math.random() * callTypes.length)];
      const purpose = purposes[Math.floor(Math.random() * purposes.length)];
      const id = `CALL${String(nextCallNumber + i).padStart(4, '0')}`;
      const timestamp = new Date().toISOString();
      const notes = `Call in progress regarding ${purpose.toLowerCase()}.`;

      try {
        const result = await pool.query(
          `INSERT INTO calls 
           (id, callerName, phoneNumber, callType, status, duration, timestamp, purpose, notes, user_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
           RETURNING *`,
          [id, callerName, phoneNumber, callType, 'active', null, timestamp, purpose, notes, user.id]
        );

        calls.push(result.rows[0]);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          // Call already exists, skipping
        } else {
          // Error creating call
        }
      }
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

addActiveCalls();

