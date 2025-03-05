-- Agregar campos para activar/desactivar agentes y configurar enrutamiento
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS target_role text CHECK (target_role IN ('user', 'shop', 'both')) NOT NULL DEFAULT 'both';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS target_agent_id uuid REFERENCES public.agents(id) NULL;

-- Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS agents_is_active_idx ON public.agents(is_active);
CREATE INDEX IF NOT EXISTS agents_target_role_idx ON public.agents(target_role);
CREATE INDEX IF NOT EXISTS agents_target_agent_id_idx ON public.agents(target_agent_id);

-- Actualizar la documentación de la tabla
COMMENT ON COLUMN public.agents.is_active IS 'Indica si el agente está activo y disponible para uso';
COMMENT ON COLUMN public.agents.target_role IS 'Indica qué tipo de usuarios pueden usar este agente: usuarios normales, tiendas o ambos';
COMMENT ON COLUMN public.agents.target_agent_id IS 'ID del agente al que se redirigen las conversaciones (opcional)'; 