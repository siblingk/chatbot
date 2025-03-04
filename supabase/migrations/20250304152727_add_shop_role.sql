-- Migration: Add shop role to user_role enum
-- Description: Adds a new 'shop' role to the user_role enum type and updates related functions

-- Modify the user_role enum to add 'shop' role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'shop';

-- Create a function to check if a user has the shop role
CREATE OR REPLACE FUNCTION public.is_shop()
RETURNS boolean AS $$
DECLARE
    user_role_val public.user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.users
    WHERE id = auth.uid();
    RETURN user_role_val = 'shop'::user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_shop TO authenticated;

-- Update handle_new_user function to support the new role
-- (This is just a reference, the function already exists and handles roles generically)
-- The function will continue to set 'user' as the default role

-- Create RLS policies for shop-specific resources if needed
-- Example:
-- CREATE POLICY "Shop users can view shop-specific resources" 
--     ON public.some_shop_table 
--     FOR SELECT 
--     USING (public.is_shop());

COMMENT ON FUNCTION public.is_shop IS 'Checks if the current user has the shop role'; 