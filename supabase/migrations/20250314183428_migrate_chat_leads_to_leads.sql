-- Migración para mover datos de chat_leads a leads
-- Primero, añadir las columnas necesarias a la tabla leads

-- Verificar si la columna session_id ya existe en leads
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'session_id') THEN
        ALTER TABLE leads ADD COLUMN session_id TEXT UNIQUE;
    END IF;
END $$;

-- Verificar si la columna user_id ya existe en leads
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'user_id') THEN
        ALTER TABLE leads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Añadir columna status usando el tipo chat_status existente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
        ALTER TABLE leads ADD COLUMN status chat_status NOT NULL DEFAULT 'initial';
    END IF;
END $$;

-- Añadir columnas de información de prequote
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'prequote_data') THEN
        ALTER TABLE leads ADD COLUMN prequote_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'prequote_date') THEN
        ALTER TABLE leads ADD COLUMN prequote_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Añadir columnas de información de appointment
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'appointment_data') THEN
        ALTER TABLE leads ADD COLUMN appointment_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'appointment_date') THEN
        ALTER TABLE leads ADD COLUMN appointment_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Añadir columnas de información de quote
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'quote_data') THEN
        ALTER TABLE leads ADD COLUMN quote_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'quote_count') THEN
        ALTER TABLE leads ADD COLUMN quote_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_quote_date') THEN
        ALTER TABLE leads ADD COLUMN last_quote_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Añadir columnas de información de invoice
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'invoice_data') THEN
        ALTER TABLE leads ADD COLUMN invoice_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'invoice_date') THEN
        ALTER TABLE leads ADD COLUMN invoice_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Añadir columna updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updated_at') THEN
        ALTER TABLE leads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Crear función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar el timestamp
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_updated_at') THEN
        CREATE TRIGGER update_leads_updated_at
            BEFORE UPDATE ON leads
            FOR EACH ROW
            EXECUTE FUNCTION update_leads_updated_at();
    END IF;
END $$;

-- Migrar datos de chat_leads a leads
INSERT INTO leads (
    session_id, 
    user_id, 
    status, 
    prequote_data, 
    prequote_date, 
    appointment_data, 
    appointment_date, 
    quote_data, 
    quote_count, 
    last_quote_date, 
    invoice_data, 
    invoice_date, 
    created_at, 
    updated_at
)
SELECT 
    cl.session_id, 
    cl.user_id, 
    cl.status, 
    cl.prequote_data, 
    cl.prequote_date, 
    cl.appointment_data, 
    cl.appointment_date, 
    cl.quote_data, 
    cl.quote_count, 
    cl.last_quote_date, 
    cl.invoice_data, 
    cl.invoice_date, 
    cl.created_at, 
    cl.updated_at
FROM chat_leads cl
ON CONFLICT (session_id) DO NOTHING;

-- Crear índices para consultas más rápidas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'leads_session_id_idx') THEN
        CREATE INDEX leads_session_id_idx ON public.leads(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'leads_user_id_idx') THEN
        CREATE INDEX leads_user_id_idx ON public.leads(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'leads_status_idx') THEN
        CREATE INDEX leads_status_idx ON public.leads(status);
    END IF;
END $$;

-- Configurar Row Level Security para la tabla leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can view their own leads') THEN
        CREATE POLICY "Users can view their own leads"
            ON public.leads
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can update their own leads') THEN
        CREATE POLICY "Users can update their own leads"
            ON public.leads
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can insert their own leads') THEN
        CREATE POLICY "Users can insert their own leads"
            ON public.leads
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can delete their own leads') THEN
        CREATE POLICY "Users can delete their own leads"
            ON public.leads
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Otorgar permisos a usuarios autenticados
GRANT ALL ON public.leads TO authenticated;

-- Eliminar la tabla chat_leads después de migrar los datos
DROP TABLE IF EXISTS chat_leads; 