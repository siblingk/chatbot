-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    model text NOT NULL CHECK (model IN ('quote-builder-ai', 'omni-ai')),
    visibility text NOT NULL CHECK (visibility IN ('private', 'public')),
    personality_tone text NOT NULL CHECK (personality_tone IN ('Formal', 'Friendly', 'Sales-Driven', 'Sales-Focused')),
    lead_strategy text NOT NULL CHECK (lead_strategy IN ('Strict-Filtering', 'Smart-Targeting')),
    welcome_message text NOT NULL,
    pre_quote_message text NOT NULL,
    pre_quote_type text NOT NULL CHECK (pre_quote_type IN ('Standard', 'With Warranty', 'Detailed Explanation', 'Special Offer', 'Custom')),
    expiration_time text NOT NULL CHECK (expiration_time IN ('24 Hours', '3 Hours', '7 Days', 'Custom')),
    system_instructions text,
    auto_assign_leads boolean NOT NULL DEFAULT false,
    auto_respond boolean NOT NULL DEFAULT false,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create updated_at function if not exists
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER set_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Grant access to authenticated users
GRANT ALL ON public.agents TO authenticated;

-- RLS policies
CREATE POLICY "Users can view their own agents and public agents"
    ON public.agents
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        visibility = 'public'
    );

CREATE POLICY "Users can insert their own agents"
    ON public.agents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
    ON public.agents
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
    ON public.agents
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX agents_user_id_idx ON public.agents(user_id);
CREATE INDEX agents_visibility_idx ON public.agents(visibility);
CREATE INDEX agents_model_idx ON public.agents(model); 