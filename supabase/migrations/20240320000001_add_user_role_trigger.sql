-- Migration: Add trigger to automatically create user role on signup
-- Description: Creates a trigger that automatically assigns the 'user' role to new users upon registration

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger AS $$
BEGIN
    -- Insert a new record into user_roles with the default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON public.users;
CREATE TRIGGER on_auth_user_created_set_role
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_role TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role FROM authenticated, anon, public; 