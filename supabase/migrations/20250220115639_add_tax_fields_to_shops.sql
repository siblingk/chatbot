-- Migración para agregar campos de impuestos específicos a la tabla de tiendas
-- Versión: 20240601
-- Descripción: Agrega campos de impuestos para Labor, Parts y Misc a la tabla de tiendas

-- Agregar nuevos campos de impuestos
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS labor_tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS parts_tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS misc_tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- Actualizar los comentarios para los nuevos campos
COMMENT ON COLUMN public.shops.labor_tax_percentage IS 'Porcentaje de impuesto aplicado a mano de obra';
COMMENT ON COLUMN public.shops.parts_tax_percentage IS 'Porcentaje de impuesto aplicado a partes/refacciones';
COMMENT ON COLUMN public.shops.misc_tax_percentage IS 'Porcentaje de impuesto aplicado a misceláneos';

-- Actualizar datos existentes para usar el tax_percentage actual como valor predeterminado para todos los nuevos campos
UPDATE public.shops 
SET 
  labor_tax_percentage = tax_percentage,
  parts_tax_percentage = tax_percentage,
  misc_tax_percentage = tax_percentage;

-- Opcionalmente, podríamos eliminar la columna tax_percentage original, pero la mantendremos por compatibilidad
-- ALTER TABLE public.shops DROP COLUMN tax_percentage; 