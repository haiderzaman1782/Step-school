-- ============================================
-- MIGRATION: Add 'active' status to calls table
-- ============================================
-- This migration updates the calls table to allow 'active' as a valid status
-- Run this if your database was created before the schema update

-- Drop the existing constraint (if it exists)
-- Note: You may need to find the actual constraint name first
-- Query to find constraint name:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'calls'::regclass AND contype = 'c';

ALTER TABLE calls 
DROP CONSTRAINT IF EXISTS calls_status_check;

-- Alternative: If the above doesn't work, find the constraint name manually:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'calls'::regclass 
-- AND pg_get_constraintdef(oid) LIKE '%status%';
-- Then use: ALTER TABLE calls DROP CONSTRAINT <constraint_name>;

-- Add the new constraint with 'active' status included
ALTER TABLE calls 
ADD CONSTRAINT calls_status_check 
CHECK (status IN ('completed', 'missed', 'bounced', 'active'));

