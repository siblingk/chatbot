-- Añadir campo de documentación a la tabla de agentes
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS documentation text;

-- Crear índice para búsqueda de texto completo en la documentación
CREATE INDEX IF NOT EXISTS agents_documentation_idx ON public.agents USING gin(to_tsvector('spanish', documentation));

-- Actualizar la documentación de la tabla
COMMENT ON COLUMN public.agents.documentation IS 'Documentación detallada sobre el agente, sus capacidades y casos de uso';

-- Actualizar las políticas RLS para incluir la documentación
-- No es necesario modificar las políticas existentes ya que aplican a toda la tabla 