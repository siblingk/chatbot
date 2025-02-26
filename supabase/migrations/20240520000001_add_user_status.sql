-- Migration: Add status field to users table
-- Description: Adds a status field to users table to allow deactivating users instead of deleting them

-- Create user_status type if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE public.user_status AS ENUM ('active', 'inactive');
  END IF;
END $$;

-- Add status column to users table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN status user_status DEFAULT 'active'::user_status;
  END IF;
END $$;

-- Update handle_new_user function to set status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, status)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user'::user_role, 'active'::user_status);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have active status
UPDATE public.users SET status = 'active'::user_status WHERE status IS NULL;

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION public.is_active()
RETURNS boolean AS $$
DECLARE
    user_status_val public.user_status;
BEGIN
    SELECT status INTO user_status_val
    FROM public.users
    WHERE id = auth.uid();
    RETURN user_status_val = 'active'::user_status;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Update RLS policies to check for active status
CREATE POLICY "Only active users can access the system" 
    ON public.users 
    FOR ALL 
    TO authenticated
    USING (status = 'active'::user_status); 