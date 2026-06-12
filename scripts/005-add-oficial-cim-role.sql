-- Add oficial_cim role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'naviera', 'capitan_puerto', 'aduanas', 'migracion', 'salud', 'senassa', 'oficial_cim'));

-- Add cim_approved field to zarpes table for the CIM approval step
ALTER TABLE zarpes ADD COLUMN IF NOT EXISTS cim_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE zarpes ADD COLUMN IF NOT EXISTS cim_approved_by INTEGER REFERENCES users(id);
ALTER TABLE zarpes ADD COLUMN IF NOT EXISTS cim_approved_at TIMESTAMP;
ALTER TABLE zarpes ADD COLUMN IF NOT EXISTS cim_comments TEXT;

-- Add oficial_cim to assigned_port constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_assigned_port_check;
ALTER TABLE users ADD CONSTRAINT users_assigned_port_check 
  CHECK (assigned_port IN ('puerto_cortes', 'puerto_roatan', 'puerto_san_lorenzo', 'puerto_castilla', 'puerto_tela', 'puerto_ceiba', 'puerto_omoa'));
