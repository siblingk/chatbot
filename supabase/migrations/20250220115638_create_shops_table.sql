-- Migración para crear la tabla de tiendas (shops)
-- Versión: 20240501
-- Descripción: Crea la tabla de tiendas con sus índices, triggers y datos iniciales

-- Crear la tabla de tiendas (shops)
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar comentarios a la tabla y columnas
COMMENT ON TABLE public.shops IS 'Tabla para almacenar información de talleres/tiendas';
COMMENT ON COLUMN public.shops.id IS 'Identificador único de la tienda';
COMMENT ON COLUMN public.shops.name IS 'Nombre de la tienda';
COMMENT ON COLUMN public.shops.location IS 'Ubicación de la tienda';
COMMENT ON COLUMN public.shops.rating IS 'Calificación de la tienda (0-5)';
COMMENT ON COLUMN public.shops.status IS 'Estado de la tienda (active/inactive)';
COMMENT ON COLUMN public.shops.rate IS 'Tarifa base de la tienda';
COMMENT ON COLUMN public.shops.tax_percentage IS 'Porcentaje de impuesto aplicado';
COMMENT ON COLUMN public.shops.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.shops.updated_at IS 'Fecha de última actualización del registro';

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS shops_name_idx ON public.shops (name);
CREATE INDEX IF NOT EXISTS shops_status_idx ON public.shops (status);

-- Crear función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el campo updated_at
DROP TRIGGER IF EXISTS update_shops_updated_at ON public.shops;
CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO public.shops (name, location, rating, status, rate, tax_percentage)
VALUES 
    ('AutoFix Garage', 'Los Angeles, CA', 4, 'active', 120.00, 7.8),
    ('Speedy Motors', 'Houston, TX', 4, 'inactive', 150.00, 7.8); 