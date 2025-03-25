-- Crear tabla para las opciones del dashboard de chat si no existe
CREATE TABLE IF NOT EXISTS public.chat_dashboard_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    button_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear función para actualizar timestamp si no existe
CREATE OR REPLACE FUNCTION update_chat_dashboard_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar timestamp
DROP TRIGGER IF EXISTS update_chat_dashboard_options_updated_at ON chat_dashboard_options;
CREATE TRIGGER update_chat_dashboard_options_updated_at
    BEFORE UPDATE ON chat_dashboard_options
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_dashboard_options_updated_at();

-- Habilitar Row Level Security
ALTER TABLE public.chat_dashboard_options ENABLE ROW LEVEL SECURITY;

-- Crear políticas para administradores
DROP POLICY IF EXISTS "Administrators can manage chat dashboard options" ON public.chat_dashboard_options;
CREATE POLICY "Administrators can manage chat dashboard options"
    ON public.chat_dashboard_options
    USING (auth.jwt() ->> 'role' = 'admin');

-- Crear políticas para lectura de todos
DROP POLICY IF EXISTS "Everyone can view chat dashboard options" ON public.chat_dashboard_options;
CREATE POLICY "Everyone can view chat dashboard options"
    ON public.chat_dashboard_options
    FOR SELECT
    USING (true);

-- Actualizar las opciones del dashboard de chat para que coincidan con las de la imagen
-- Primero eliminar los registros existentes
DELETE FROM public.chat_dashboard_options;

-- Insertar las nuevas opciones basadas en la imagen proporcionada
INSERT INTO public.chat_dashboard_options (button_text, response_text, icon_name, order_index)
VALUES
    ('Dashboard Overview', 'Here''s a snapshot of system-wide performance. View active leads, shop engagement, and conversion metrics.', 'BarChart', 1),
    ('Manage Shops & Partnerships', 'Here you can review, approve, or manage registered shops. Need to update a partnership or remove a shop?', 'Store', 2),
    ('Find & Assign Leads', 'Locate leads and strategically assign them to the best-matching shops. How would you like to proceed?', 'Search', 3),
    ('Lead Marketplace', 'View available leads and distribute them to the right shops based on demand and performance.', 'LayoutGrid', 4),
    ('AI Optimization', 'Fine-tune automation settings to enhance lead matching and targeting. Let''s optimize the AI parameters!', 'Brain', 5),
    ('Campaign Performance', 'Track marketing effectiveness, lead conversion rates, and outreach impact. Here are your current campaign insights.', 'BarChart2', 6);

-- Otorgar permisos
GRANT SELECT ON public.chat_dashboard_options TO authenticated;
GRANT ALL ON public.chat_dashboard_options TO anon;
GRANT ALL ON public.chat_dashboard_options TO service_role;

-- Añadir comentario para explicar los cambios
COMMENT ON TABLE public.chat_dashboard_options IS 'Opciones mostradas en el dashboard de chat que reemplazan al botón "I want a quote"'; 