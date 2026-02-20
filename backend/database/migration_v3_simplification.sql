-- ========================================================
-- STEP SCHOOL: SYSTEM SIMPLIFICATION MIGRATION (V3)
-- Consolidation of payments and users into a Voucher-Centric Model
-- ========================================================

BEGIN;

-- 1. Create temporary backup for accountant names before dropping the login table
-- In this system, 'clients' table currently stores login users (accountants/admins)
CREATE TEMP TABLE accountant_backup AS
SELECT 
  id as user_id,
  full_name as accountant_name,
  campus_id
FROM clients;

-- 2. Add new columns to school_vouchers to handle embedded payment data
ALTER TABLE school_vouchers ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE school_vouchers ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE school_vouchers ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE school_vouchers ADD COLUMN IF NOT EXISTS generated_by_accountant_name VARCHAR(255);
ALTER TABLE school_vouchers ADD COLUMN IF NOT EXISTS paid_by_accountant_name VARCHAR(255);

-- 3. Populate accountant names in vouchers from the backup
UPDATE school_vouchers sv
SET generated_by_accountant_name = (
  SELECT accountant_name FROM accountant_backup WHERE user_id = sv.generated_by_accountant_id
);

-- 4. Consolidate fee_payments into school_vouchers
-- For each voucher, sum up all payments recorded against it
UPDATE school_vouchers sv
SET 
  amount_paid = COALESCE((
    SELECT SUM(amount_paid) FROM fee_payments WHERE voucher_id = sv.id
  ), 0),
  payment_method = (
    SELECT payment_method FROM fee_payments WHERE voucher_id = sv.id ORDER BY payment_date DESC LIMIT 1
  ),
  payment_notes = (
    SELECT STRING_AGG(notes, ' | ') FROM fee_payments WHERE voucher_id = sv.id
  ),
  paid_date = (
    SELECT MAX(payment_date) FROM fee_payments WHERE voucher_id = sv.id
  ),
  paid_by_accountant_name = (
    SELECT ab.accountant_name 
    FROM accountant_backup ab 
    INNER JOIN fee_payments fp ON fp.recorded_by_accountant_id = ab.user_id
    WHERE fp.voucher_id = sv.id
    ORDER BY fp.payment_date DESC LIMIT 1
  );

-- 5. Set Voucher Status based on payments
UPDATE school_vouchers
SET status = CASE 
    WHEN amount_paid >= amount THEN 'paid'
    WHEN amount_paid > 0 THEN 'partial'
    ELSE 'pending'
END;

-- 6. Add Computed Balance Column (Virtual-like using a generated column)
-- First drop existing balance if any, then add as generated
ALTER TABLE school_vouchers ADD COLUMN balance DECIMAL(12,2) GENERATED ALWAYS AS (amount - amount_paid) STORED;

-- 7. Add generated_by_accountant_name to school_clients (for history tracking)
ALTER TABLE school_clients ADD COLUMN IF NOT EXISTS created_by_accountant_name VARCHAR(255);
UPDATE school_clients sc
SET created_by_accountant_name = (
  SELECT accountant_name FROM accountant_backup WHERE user_id = sc.created_by_accountant_id
);

-- 8. Clean up constraints and drop old tables
-- We drop 'users', 'clients' (login), 'payments' (legacy), 'fee_payments'
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- 9. Rename modern school tables to cleaner names
ALTER TABLE school_clients RENAME TO clients;
ALTER TABLE school_vouchers RENAME TO vouchers;

-- 10. Update foreign keys on child tables to point to renamed 'clients' table
-- (Postgres handles rename automatically if constraints exist, but we ensure cleanliness)
-- programs -> clients (formerly school_clients)
-- vouchers -> clients
-- payment_plans -> clients

-- 11. Add a check constraint to balance (optional but safe)
ALTER TABLE vouchers ADD CONSTRAINT chk_amount_paid_limit CHECK (amount_paid >= 0);

COMMIT;

-- Clean up
DROP TABLE IF EXISTS accountant_backup;
