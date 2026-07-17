-- Agregar campo de terminal al arribo
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS terminal VARCHAR(100);
