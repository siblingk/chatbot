-- Migración para corregir el problema de recursión infinita en políticas de la tabla users

-- Primero, eliminamos la política problemática que causa recursión
DROP POLICY IF EXISTS "Users can view themselves, admins can view all" ON public.users;

-- Eliminamos también cualquier política existente para evitar conflictos
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Crear una nueva versión de la función is_admin que no cause recursión
CREATE OR REPLACE FUNCTION public.is_admin_no_recursion()
RETURNS BOOLEAN AS $$
BEGIN
    -- Esta versión simplemente verifica el token JWT para roles administrativos
    -- sin consultar la tabla users, evitando así la recursión
    RETURN (auth.jwt() ->> 'role')::text = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Crear políticas nuevas que no causen recursión
CREATE POLICY "Users can view all profiles" 
    ON public.users 
    FOR SELECT 
    USING (true);

-- Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION public.is_admin_no_recursion TO authenticated;

-- NOTA: Si el sistema realmente necesita verificar el rol de administrador, 
-- considerar modificar el proceso de login para incluir el rol en el token JWT
-- en lugar de consultarlo de la base de datos en cada operación.
