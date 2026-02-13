import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateActiveStatus = async () => {
  try {
    // First, find the constraint name
    const findConstraintQuery = `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'calls'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
    `;
    
    const constraintResult = await pool.query(findConstraintQuery);
    
    if (constraintResult.rows.length > 0) {
      const constraintName = constraintResult.rows[0].conname;
      
      // Drop the existing constraint
      await pool.query(`ALTER TABLE calls DROP CONSTRAINT ${constraintName}`);
    } else {
      // Try common constraint names
      try {
        await pool.query('ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_status_check');
      } catch (err) {
        // No existing constraint found or already dropped
      }
    }
    
    // Add the new constraint with 'active' status
    await pool.query(`
      ALTER TABLE calls 
      ADD CONSTRAINT calls_status_check 
      CHECK (status IN ('completed', 'missed', 'bounced', 'active'))
    `);
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

migrateActiveStatus();

