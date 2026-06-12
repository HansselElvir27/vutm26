-- Add port column to users table for authority users
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_port VARCHAR(50);

-- Create index for port-based queries
CREATE INDEX IF NOT EXISTS idx_users_assigned_port ON users(assigned_port);

-- Update the port_of_arrival values to match the new port list
-- This ensures consistency between user ports and arrival ports
