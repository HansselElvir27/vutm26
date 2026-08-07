-- Seguridad de inicio de sesión: bloqueo por intentos fallidos
-- Agrega campos para rastrear intentos fallidos y bloqueo temporal de cuenta

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP DEFAULT NULL;

-- Índice para consultas rápidas de cuentas bloqueadas
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;
