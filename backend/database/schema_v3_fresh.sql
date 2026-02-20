-- ========================================================
-- STEP SCHOOL: FRESH SIMPLIFIED SCHEMA (V3)
-- This script WIPES OUT all existing tables and creates a clean structure.
-- ========================================================

-- 1. Drop EVERYTHING starting with dependent tables
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS payment_plans CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS campuses CASCADE;

-- Also drop legacy tables if they still exist
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS school_clients CASCADE;
DROP TABLE IF EXISTS school_vouchers CASCADE;

-- 2. Create Infrastructure Tables
CREATE TABLE campuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Business Tables
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    director_name VARCHAR(255),
    city VARCHAR(100),
    campus_id INT REFERENCES campuses(id) ON DELETE SET NULL,
    seat_cost DECIMAL(12,2) DEFAULT 30000,
    total_seats INT DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by_accountant_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    program_name VARCHAR(255) NOT NULL,
    seat_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_plans (
    id SERIAL PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    payment_type VARCHAR(100) NOT NULL, -- advance, pre_reg, exam, roll_slip
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- owner, accountant, client
    campus_id INT REFERENCES campuses(id), -- For accountants
    client_id UUID REFERENCES clients(id), -- For client role
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    campus_id INT REFERENCES campuses(id) ON DELETE SET NULL,
    payment_plan_id INT REFERENCES payment_plans(id) ON DELETE SET NULL,
    
    -- Financial Data
    amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, cancelled
    payment_method VARCHAR(100),
    payment_notes TEXT,
    generated_by_accountant_name VARCHAR(255),
    paid_by_accountant_name VARCHAR(255),
    
    -- Dates
    due_date DATE,
    paid_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Initial Seed Data (Campuses)
INSERT INTO campuses (name, city, location) VALUES 
('Main Campus', 'Lahore', 'Gulberg III'),
('City Campus', 'Lahore', 'Johar Town'),
('Faisalabad Campus', 'Faisalabad', 'West Canal Road');

-- 5. Helper Triggers (Optional but good for data integrity)
CREATE OR REPLACE FUNCTION update_client_totals() RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients 
    SET total_seats = (SELECT COALESCE(SUM(seat_count), 0) FROM programs WHERE client_id = NEW.client_id),
        total_amount = (SELECT COALESCE(SUM(seat_count), 0) FROM programs WHERE client_id = NEW.client_id) * seat_cost
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_client_seats
AFTER INSERT OR UPDATE OR DELETE ON programs
FOR EACH ROW EXECUTE FUNCTION update_client_totals();

-- Index for performance
CREATE INDEX idx_vouchers_client ON vouchers(client_id);
CREATE INDEX idx_vouchers_campus ON vouchers(campus_id);
CREATE INDEX idx_clients_campus ON clients(campus_id);