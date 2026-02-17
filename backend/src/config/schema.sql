-- Drop existing tables to start fresh as requested
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS payment_types CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Clients table
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'client',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment types table
CREATE TABLE payment_types (
  id SERIAL PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table
CREATE TABLE vouchers (
  id SERIAL PRIMARY KEY,
  voucher_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  payment_type_id INTEGER REFERENCES payment_types(id),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  description TEXT,
  attachment_url TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial payment types
INSERT INTO payment_types (type_name, description) VALUES
  ('Re-enrollment', 'Payment for re-enrolling clients'),
  ('After Enrollment', 'Post-enrollment service fees'),
  ('Installment', 'Recurring installment payments'),
  ('Full Payment', 'One-time complete payment'),
  ('Late Fee', 'Penalty for overdue payments'),
  ('Custom', 'Accountant-defined payment type');
