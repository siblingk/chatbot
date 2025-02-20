-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role public.app_role;
BEGIN
    -- Get role from JWT claim
    SELECT (auth.jwt() ->> 'user_role')::public.app_role INTO user_role;
    RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_role(
    target_user_id UUID,
    new_role public.app_role
)
RETURNS void AS $$
BEGIN
    -- Check if the executing user is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can assign roles';
    END IF;

    -- Delete any existing role for the user (since we want only one role per user)
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Insert the new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to see all users with their roles
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    COALESCE(ur.role, 'user'::public.app_role) as role,
    u.created_at,
    u.updated_at
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users_with_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Add RLS policies
CREATE POLICY "Allow admins to manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view themselves, admins can view all" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM public.user_roles WHERE user_id = auth.uid()),
        'user'::public.app_role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(requested_permission public.app_permission)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        WHERE rp.role = public.get_my_role()
        AND rp.permission = requested_permission
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER; 