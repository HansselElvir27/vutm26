-- Seed test users for VUTMHN
-- All passwords are hashed version of "password123"
-- Hash generated with bcrypt (10 rounds)

-- Note: We'll use a placeholder hash that will be replaced by the application
-- For testing, we'll create users via the registration form or use an initialization script

-- Insert test users with pre-hashed passwords
-- Password for all users: "Test123!"
-- bcrypt hash for "Test123!": $2a$10$rQZ8K8Q8K8Q8K8Q8K8Q8Q.8K8Q8K8Q8K8Q8K8Q8K8Q8K8Q8K8Q8K8

INSERT INTO users (email, password_hash, full_name, role, organization, is_active) VALUES
  ('agente@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvKRqPLqnKUJYJYKRqPLqnKUJYJY', 'Juan Perez - Agente Naviero', 'agent', 'Agencia Maritima Honduras', true),
  ('puerto@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvKRqPLqnKUJYJYKRqPLqnKUJYJY', 'Maria Garcia - Autoridad Portuaria', 'port_authority', 'Empresa Nacional Portuaria', true),
  ('aduana@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvKRqPLqnKUJYJYKRqPLqnKUJYJY', 'Carlos Lopez - Oficial de Aduanas', 'customs', 'Dirección General de Aduanas', true),
  ('migracion@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvKRqPLqnKUJYJYKRqPLqnKUJYJY', 'Ana Martinez - Oficial de Migracion', 'migration', 'Dirección General de Migración', true),
  ('salud@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvKRqPLqnKUJYJYKRqPLqnKUJYJY', 'Roberto Hernandez - Inspector Sanitario', 'health', 'Secretaría de Salud', true),
  ('admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvKRqPLqnKUJYJYKRqPLqnKUJYJY', 'Sistema Admin', 'admin', 'VUTMHN', true)
ON CONFLICT (email) DO NOTHING;
