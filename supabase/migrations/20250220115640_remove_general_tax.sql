-- Migración para eliminar el campo de impuesto general de la tabla de tiendas
-- Versión: 20240602
-- Descripción: Elimina el campo tax_percentage general, ya que ahora usamos campos específicos para cada tipo de impuesto

-- Eliminar el campo tax_percentage
ALTER TABLE public.shops 
DROP COLUMN IF EXISTS tax_percentage;

-- Actualizar comentarios
COMMENT ON TABLE public.shops IS 'Tabla para almacenar información de talleres/tiendas con impuestos específicos para Labor, Parts y Misc'; 