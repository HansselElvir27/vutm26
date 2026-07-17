-- Campos adicionales según el tipo de buque

-- Para buques tipo Contenedor
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS container_total     INTEGER;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS container_loaded    INTEGER;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS container_empty     INTEGER;

-- Para buques tipo Crucero
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS passenger_total     INTEGER;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS passenger_disembark INTEGER;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS passenger_onboard   INTEGER;
