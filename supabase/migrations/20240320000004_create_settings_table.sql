-- Create enum for lead assignment mode
CREATE TYPE lead_assignment_mode AS ENUM ('automatic', 'manual');

-- Create enum for price source
CREATE TYPE price_source AS ENUM ('ai', 'dcitelly_api');

-- Create settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id VARCHAR(255) NOT NULL UNIQUE,
    workshop_name VARCHAR(255) NOT NULL,
    welcome_message TEXT NOT NULL,
    interaction_tone VARCHAR(50) NOT NULL,
    pre_quote_message TEXT NOT NULL,
    contact_required BOOLEAN NOT NULL DEFAULT false,
    lead_assignment_mode lead_assignment_mode NOT NULL,
    follow_up_enabled BOOLEAN NOT NULL DEFAULT true,
    price_source price_source NOT NULL,
    template_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO settings (
    workshop_id,
    workshop_name,
    welcome_message,
    interaction_tone,
    pre_quote_message,
    contact_required,
    lead_assignment_mode,
    follow_up_enabled,
    price_source,
    template_id
) VALUES 
    ('1001', 'AutoFix Garage', '¡Bienvenido a AutoFix Garage! Especialistas en frenos.', 'Amigable', 'Estándar', true, 'automatic', true, 'ai', null),
    ('1002', 'Speedy Motors', 'Hola, en Speedy Motors la rapidez y calidad es lo primero.', 'Directo', 'Con Garantía', false, 'manual', true, 'dcitelly_api', null),
    ('1003', 'Elite AutoCare', '¡Saludos desde Elite AutoCare! Confianza y precisión.', 'Formal', 'Con Explicación Detallada', true, 'automatic', false, 'ai', null),
    ('1004', 'Torque Masters', 'Torque Masters: tu auto es nuestra prioridad.', 'Técnico', 'Oferta Especial', true, 'automatic', true, 'dcitelly_api', null),
    ('1005', 'Express Auto Repair', '¡Bienvenido a Express Auto Repair! Servicio garantizado.', 'Amigable', 'Estándar', false, 'manual', false, 'ai', null),
    ('SIBLINGK_INTERNAL', 'SIBLINGK INTERNAL', '¡Bienvenido a Siblignk! Encontramos los mejores talleres para ti.', 'Neutral y Profesional', 'Estándar (Rango de precios basado en datos de múltiples talleres)', false, 'manual', true, 'ai', null);

-- Add RLS policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users"
    ON settings FOR SELECT
    TO authenticated
    USING (true);

-- Allow full access to admin users
CREATE POLICY "Allow full access to admin users"
    ON settings FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    ); 