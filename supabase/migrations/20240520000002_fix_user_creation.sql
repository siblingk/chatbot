-- Migration: Fix user creation function
-- Description: Updates the handle_new_user function to properly handle the status field

-- Drop existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user function to set status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Check if the user already exists to avoid duplicate key errors
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (
            new.id, 
            new.email, 
            new.raw_user_meta_data->>'full_name', 
            COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
            'active'::user_status
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all users have a status
UPDATE public.users SET status = 'active'::user_status WHERE status IS NULL; 