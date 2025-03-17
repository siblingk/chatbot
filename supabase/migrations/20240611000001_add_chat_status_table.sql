-- Create enum for chat status
CREATE TYPE chat_status AS ENUM ('initial', 'prequote', 'appointment', 'quote', 'invoice');

-- Create chat_leads table to track lead status and information
CREATE TABLE chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status chat_status NOT NULL DEFAULT 'initial',
    
    -- PreQuote information
    prequote_data JSONB,
    prequote_date TIMESTAMP WITH TIME ZONE,
    
    -- Appointment information
    appointment_data JSONB,
    appointment_date TIMESTAMP WITH TIME ZONE,
    
    -- Quote information
    quote_data JSONB,
    quote_count INTEGER DEFAULT 0,
    last_quote_date TIMESTAMP WITH TIME ZONE,
    
    -- Invoice information
    invoice_data JSONB,
    invoice_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure each session_id is unique within this table
    CONSTRAINT chat_leads_session_id_key UNIQUE (session_id)
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_chat_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_chat_leads_updated_at
    BEFORE UPDATE ON chat_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_leads_updated_at();

-- Enable Row Level Security
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chat leads"
    ON public.chat_leads
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat leads"
    ON public.chat_leads
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat leads"
    ON public.chat_leads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat leads"
    ON public.chat_leads
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX chat_leads_session_id_idx ON public.chat_leads(session_id);
CREATE INDEX chat_leads_user_id_idx ON public.chat_leads(user_id);
CREATE INDEX chat_leads_status_idx ON public.chat_leads(status);

-- Grant access to authenticated users
GRANT ALL ON public.chat_leads TO authenticated; 