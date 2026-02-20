-- ============================================================
-- STEP SCHOOL: CLIENT-PROGRAM-PAYMENT SYSTEM MIGRATION
-- Run this file once against your PostgreSQL database.
-- It is idempotent (safe to re-run).
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. CAMPUSES TABLE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campuses (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed two default campuses (ignored if already present)
INSERT INTO campuses (id, name, city)
VALUES
  (1, 'Step School Campus A', 'Lahore'),
  (2, 'Step School Campus B', 'Karachi')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- 2. ADD campus_id TO LOGIN USERS (clients) TABLE
-- ──────────────────────────────────────────────────────────
-- The existing 'clients' table is the auth/login table.
-- Accountants need a campus assigned so it can be embedded in JWT.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS campus_id INTEGER REFERENCES campuses(id);

-- ──────────────────────────────────────────────────────────
-- 3. SCHOOL CLIENTS TABLE (business entity)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_clients (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     VARCHAR(255) NOT NULL,
  campus_id                INTEGER NOT NULL REFERENCES campuses(id),
  total_seats              INTEGER NOT NULL DEFAULT 0,
  seat_cost                DECIMAL(12,2) NOT NULL,
  total_amount             DECIMAL(14,2) NOT NULL DEFAULT 0,
  city                     VARCHAR(255),
  created_at               TIMESTAMP DEFAULT NOW(),
  updated_at               TIMESTAMP DEFAULT NOW(),
  created_by_accountant_id UUID REFERENCES clients(id)
);

-- ──────────────────────────────────────────────────────────
-- 4. PROGRAMS TABLE (one-to-many with school_clients)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES school_clients(id) ON DELETE CASCADE,
  program_name VARCHAR(255) NOT NULL,
  seat_count   INTEGER NOT NULL CHECK (seat_count > 0),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 5. PAYMENT PLANS TABLE (configurable per client)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES school_clients(id) ON DELETE CASCADE,
  payment_type  VARCHAR(60) NOT NULL CHECK (payment_type IN (
                  'advance',
                  'after_pre_registration',
                  'submitted_examination',
                  'roll_number_slip'
                )),
  amount        DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  due_date      DATE,
  display_order INTEGER NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 6. FEE PAYMENTS TABLE (actual money received)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID NOT NULL REFERENCES school_clients(id),
  voucher_id               UUID,   -- optional FK added after school_vouchers creation
  payment_plan_id          UUID NOT NULL REFERENCES payment_plans(id),
  amount_paid              DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0),
  payment_date             DATE NOT NULL,
  payment_method           VARCHAR(100),
  recorded_by_accountant_id UUID NOT NULL REFERENCES clients(id),
  notes                    TEXT,
  created_at               TIMESTAMP DEFAULT NOW(),
  updated_at               TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 7. SCHOOL VOUCHERS TABLE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_vouchers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number            VARCHAR(50) NOT NULL UNIQUE,
  client_id                 UUID NOT NULL REFERENCES school_clients(id),
  payment_plan_id           UUID NOT NULL REFERENCES payment_plans(id),
  amount                    DECIMAL(12,2) NOT NULL,
  status                    VARCHAR(20) NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','paid','cancelled')),
  generated_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_date                 DATE,
  generated_by_accountant_id UUID NOT NULL REFERENCES clients(id),
  paid_by_accountant_id     UUID REFERENCES clients(id),
  campus_id                 INTEGER NOT NULL REFERENCES campuses(id),
  created_at                TIMESTAMP DEFAULT NOW(),
  updated_at                TIMESTAMP DEFAULT NOW()
);

-- Add FK from fee_payments.voucher_id to school_vouchers.id now that table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_fee_payments_voucher'
      AND table_name = 'fee_payments'
  ) THEN
    ALTER TABLE fee_payments
      ADD CONSTRAINT fk_fee_payments_voucher
      FOREIGN KEY (voucher_id) REFERENCES school_vouchers(id) ON DELETE SET NULL;
  END IF;
END$$;

-- ──────────────────────────────────────────────────────────
-- 8. TRIGGER: Auto-recalculate total_seats & total_amount
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_client_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_client_id UUID;
BEGIN
  -- On DELETE we use OLD; on INSERT/UPDATE we use NEW
  target_client_id := COALESCE(NEW.client_id, OLD.client_id);

  UPDATE school_clients
  SET
    total_seats  = (
      SELECT COALESCE(SUM(seat_count), 0)
      FROM programs
      WHERE client_id = target_client_id
    ),
    total_amount = (
      SELECT COALESCE(SUM(seat_count), 0)
      FROM programs
      WHERE client_id = target_client_id
    ) * seat_cost,
    updated_at   = NOW()
  WHERE id = target_client_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS program_change_trigger ON programs;
CREATE TRIGGER program_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON programs
  FOR EACH ROW EXECUTE FUNCTION recalculate_client_totals();

-- ──────────────────────────────────────────────────────────
-- 9. TRIGGER: Auto-update updated_at on school_clients
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS school_clients_updated_at ON school_clients;
CREATE TRIGGER school_clients_updated_at
  BEFORE UPDATE ON school_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS fee_payments_updated_at ON fee_payments;
CREATE TRIGGER fee_payments_updated_at
  BEFORE UPDATE ON fee_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS school_vouchers_updated_at ON school_vouchers;
CREATE TRIGGER school_vouchers_updated_at
  BEFORE UPDATE ON school_vouchers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────
-- 10. PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_school_clients_campus     ON school_clients(campus_id);
CREATE INDEX IF NOT EXISTS idx_school_clients_name       ON school_clients(name);
CREATE INDEX IF NOT EXISTS idx_school_clients_city       ON school_clients(city);
CREATE INDEX IF NOT EXISTS idx_programs_client           ON programs(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_client      ON payment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_client       ON fee_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_plan         ON fee_payments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_accountant   ON fee_payments(recorded_by_accountant_id);
CREATE INDEX IF NOT EXISTS idx_school_vouchers_client    ON school_vouchers(client_id);
CREATE INDEX IF NOT EXISTS idx_school_vouchers_campus    ON school_vouchers(campus_id);
CREATE INDEX IF NOT EXISTS idx_school_vouchers_status    ON school_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_school_vouchers_number    ON school_vouchers(voucher_number);

-- ──────────────────────────────────────────────────────────
-- DONE
-- ──────────────────────────────────────────────────────────
