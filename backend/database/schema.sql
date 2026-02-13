-- ============================================
-- BOOKING DASHBOARD DATABASE SCHEMA
-- Clean, professional schema matching frontend tables
-- ============================================

-- Users table - matches frontend Users component
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'agent', 'customer')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  totalAppointments INTEGER DEFAULT 0,
  totalPayments INTEGER DEFAULT 0,
  totalCalls INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastActivity TIMESTAMP,
  avatar TEXT,
  failedCalls INTEGER DEFAULT 0,
  failedPayments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table - matches frontend AppointmentsTable component
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(50) PRIMARY KEY,
  patientName VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  service VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  assignedAgent VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  paymentStatus VARCHAR(50) DEFAULT 'pending',
  createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table - matches frontend Payments component
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  transactionId VARCHAR(255) UNIQUE NOT NULL,
  customerName VARCHAR(255),
  appointmentId VARCHAR(50),
  paymentMethod VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
  date DATE,
  timestamp TIMESTAMP,
  refundStatus VARCHAR(50),
  service VARCHAR(255),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  appointment_id VARCHAR(50) REFERENCES appointments(id) ON DELETE SET NULL,
  invoiceNumber VARCHAR(100),
  callReference VARCHAR(50),
  failureReason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calls table - matches frontend CallsLog component
CREATE TABLE IF NOT EXISTS calls (
  id VARCHAR(50) PRIMARY KEY,
  callerName VARCHAR(255),
  phoneNumber VARCHAR(50),
  callType VARCHAR(50) CHECK (callType IN ('incoming', 'outgoing')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'missed', 'bounced', 'active')),
  duration VARCHAR(20),
  timestamp TIMESTAMP NOT NULL,
  purpose TEXT,
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recordingUrl TEXT,
  callStartTime TIMESTAMP,
  callEndTime TIMESTAMP,
  callDurationSeconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_name ON appointments(patientName);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transactionId);
CREATE INDEX IF NOT EXISTS idx_payments_customer_name ON payments(customerName);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_caller_name ON calls(callerName);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(fullName);

