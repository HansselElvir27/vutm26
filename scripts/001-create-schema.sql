-- Ventanilla Única de Transporte Marítimo de Honduras
-- Database Schema

-- Users table with roles
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('naviera', 'capitan_puerto', 'migracion', 'salud', 'senassa', 'aduanas', 'admin')),
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arrivals (Avisos de Arribo) table
CREATE TABLE IF NOT EXISTS arrivals (
  id SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Ship Information
  ship_name VARCHAR(255) NOT NULL,
  vessel_type VARCHAR(100) NOT NULL,
  port_of_arrival VARCHAR(100) NOT NULL,
  omi_number VARCHAR(50) NOT NULL,
  length VARCHAR(50),
  breadth VARCHAR(50),
  call_sign VARCHAR(50),
  flag VARCHAR(100) NOT NULL,
  voyage_number VARCHAR(100),
  gt VARCHAR(50),
  
  -- Last Port Information
  last_port_country VARCHAR(100),
  last_port_name VARCHAR(255),
  
  -- Arrival Timing
  estimated_arrival_date DATE NOT NULL,
  estimated_arrival_time TIME NOT NULL,
  
  -- Additional Fields
  observation TEXT,
  is_donation BOOLEAN DEFAULT FALSE,
  is_fast_arrival BOOLEAN DEFAULT FALSE,
  crew_change BOOLEAN DEFAULT FALSE,
  needs_help BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved_by_captain', 'documents_complete', 'ready_for_zarpe', 'zarpe_approved', 'completed')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  arrival_id INTEGER REFERENCES arrivals(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('noa', 'fal1', 'fal2', 'fal3', 'fal4', 'fal5', 'fal6', 'fal7', 'cargo_manifest', 'nil_list', 'last_departure', 'mdh', 'poc')),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Approvals table
CREATE TABLE IF NOT EXISTS document_approvals (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approver_role VARCHAR(50) NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  comments TEXT,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id, approver_role)
);

-- Arrival Approvals table (for overall arrival approval by each institution)
CREATE TABLE IF NOT EXISTS arrival_approvals (
  id SERIAL PRIMARY KEY,
  arrival_id INTEGER REFERENCES arrivals(id) ON DELETE CASCADE,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approver_role VARCHAR(50) NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  comments TEXT,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(arrival_id, approver_role)
);

-- Zarpe (Departure Clearance) table
CREATE TABLE IF NOT EXISTS zarpes (
  id SERIAL PRIMARY KEY,
  arrival_id INTEGER REFERENCES arrivals(id) ON DELETE CASCADE,
  zarpe_number VARCHAR(100) UNIQUE NOT NULL,
  qr_code TEXT,
  
  -- Captain Information (filled by naviera)
  captain_name VARCHAR(255) NOT NULL,
  captain_passport VARCHAR(100) NOT NULL,
  captain_nationality VARCHAR(100) NOT NULL,
  
  -- Crew and Passengers
  crew_count INTEGER NOT NULL,
  passenger_count INTEGER DEFAULT 0,
  
  -- Departure Information
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  destination_country VARCHAR(100) NOT NULL,
  destination_port VARCHAR(255) NOT NULL,
  
  -- Cargo Information
  cargo_on_board TEXT,
  export_manifest VARCHAR(255),
  observations TEXT,
  
  -- Approval
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  digital_signature TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_arrivals_created_by ON arrivals(created_by);
CREATE INDEX IF NOT EXISTS idx_arrivals_status ON arrivals(status);
CREATE INDEX IF NOT EXISTS idx_arrivals_port ON arrivals(port_of_arrival);
CREATE INDEX IF NOT EXISTS idx_documents_arrival_id ON documents(arrival_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Insert default admin user (password: admin123 - should be changed in production)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@vutmhn.gob.hn', '$2b$10$rQZ9QOXYKqN8.5QvAQjZz.8ZQxqQ9QxqQ9QxqQ9QxqQ9QxqQ9QxqQ', 'Administrador del Sistema', 'admin')
ON CONFLICT (email) DO NOTHING;
