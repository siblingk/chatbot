-- Migración simplificada para crear solo la tabla de prequotes
-- Primero, eliminar la migración anterior si se ha aplicado

-- Eliminar las vistas si existen
DROP VIEW IF EXISTS invoice_details;
DROP VIEW IF EXISTS quote_details;
DROP VIEW IF EXISTS lead_summary;

-- Eliminar las tablas en orden inverso para evitar problemas de dependencia
-- Usar CASCADE para forzar la eliminación de dependencias
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quote_items CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;

-- Eliminar la referencia a vehicles en leads antes de eliminar la tabla
ALTER TABLE IF EXISTS leads DROP CONSTRAINT IF EXISTS leads_vehicle_id_fkey;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Asegurarse de que el tipo chat_status existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_status') THEN
        CREATE TYPE chat_status AS ENUM ('initial', 'prequote', 'appointment', 'quote', 'invoice');
    END IF;
END $$;

-- Crear función para actualizar timestamp si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Modificar la tabla leads para mantener las columnas originales
-- Asegurarse de que las columnas existan
ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS prequote_data JSONB,
    ADD COLUMN IF NOT EXISTS prequote_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS appointment_data JSONB,
    ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS quote_data JSONB,
    ADD COLUMN IF NOT EXISTS quote_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_quote_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS invoice_data JSONB,
    ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP WITH TIME ZONE;

-- Eliminar la columna vehicle_id si existe
ALTER TABLE leads DROP COLUMN IF EXISTS vehicle_id;

-- Crear tabla para pre-cotizaciones
CREATE TABLE IF NOT EXISTS prequotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    estimated_min_cost DECIMAL(10, 2),
    estimated_max_cost DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    parts_needed JSONB,
    labor_hours DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear trigger para actualizar timestamp en prequotes
DROP TRIGGER IF EXISTS update_prequotes_updated_at ON prequotes;
CREATE TRIGGER update_prequotes_updated_at
    BEFORE UPDATE ON prequotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar Row Level Security para la tabla prequotes
ALTER TABLE prequotes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own prequotes" ON prequotes;
DROP POLICY IF EXISTS "Users can update their own prequotes" ON prequotes;
DROP POLICY IF EXISTS "Users can insert their own prequotes" ON prequotes;
DROP POLICY IF EXISTS "Users can delete their own prequotes" ON prequotes;

-- Crear políticas de seguridad para prequotes
CREATE POLICY "Users can view their own prequotes"
    ON prequotes
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = prequotes.lead_id
        AND leads.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own prequotes"
    ON prequotes
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = prequotes.lead_id
        AND leads.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own prequotes"
    ON prequotes
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = prequotes.lead_id
        AND leads.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own prequotes"
    ON prequotes
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = prequotes.lead_id
        AND leads.user_id = auth.uid()
    ));

-- Otorgar permisos a usuarios autenticados
GRANT ALL ON prequotes TO authenticated;

-- Crear índice para mejorar el rendimiento
DROP INDEX IF EXISTS idx_prequotes_lead_id;
CREATE INDEX idx_prequotes_lead_id ON prequotes(lead_id);

-- Migrar datos de prequote_data a la tabla prequotes
DO $$
DECLARE
    lead_record RECORD;
BEGIN
    FOR lead_record IN SELECT id, prequote_data FROM leads 
                      WHERE prequote_data IS NOT NULL AND prequote_data != 'null'::jsonb LOOP
        -- Intentar extraer datos del JSONB
        BEGIN
            INSERT INTO prequotes (
                lead_id, 
                service_type,
                estimated_min_cost,
                estimated_max_cost,
                currency,
                parts_needed,
                labor_hours,
                notes
            )
            VALUES (
                lead_record.id,
                COALESCE((lead_record.prequote_data->>'service_type'), 'Servicio no especificado'),
                NULLIF((lead_record.prequote_data->'estimated_cost'->>'min'), '')::DECIMAL,
                NULLIF((lead_record.prequote_data->'estimated_cost'->>'max'), '')::DECIMAL,
                COALESCE((lead_record.prequote_data->'estimated_cost'->>'currency'), 'USD'),
                COALESCE((lead_record.prequote_data->'parts_needed'), '[]'::jsonb),
                NULLIF((lead_record.prequote_data->>'labor_hours'), '')::DECIMAL,
                (lead_record.prequote_data->>'notes')
            );
        EXCEPTION WHEN OTHERS THEN
            -- Si hay error, insertar con valores por defecto
            INSERT INTO prequotes (lead_id, service_type)
            VALUES (lead_record.id, 'Migrado desde datos anteriores');
        END;
    END LOOP;
END $$; 