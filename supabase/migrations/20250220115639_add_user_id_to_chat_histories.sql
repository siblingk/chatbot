-- Migración para añadir el campo user_id a la tabla n8n_chat_histories
-- Versión: 20250220115639
-- Descripción: Añade el campo user_id a la tabla n8n_chat_histories para guardar el ID del usuario autenticado

-- Añadir la columna user_id a la tabla n8n_chat_histories
ALTER TABLE public.n8n_chat_histories ADD COLUMN user_id UUID NULL;

-- Añadir un comentario a la columna
COMMENT ON COLUMN public.n8n_chat_histories.user_id IS 'ID del usuario autenticado que envió el mensaje (puede ser NULL para usuarios no autenticados)';

-- Crear un índice para mejorar las búsquedas por user_id
CREATE INDEX IF NOT EXISTS n8n_chat_histories_user_id_idx ON public.n8n_chat_histories (user_id);

-- Añadir una restricción de clave foránea a la tabla users (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.n8n_chat_histories 
        ADD CONSTRAINT n8n_chat_histories_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE SET NULL;
    END IF;
END
$$; 