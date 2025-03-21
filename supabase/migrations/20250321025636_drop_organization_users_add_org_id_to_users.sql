-- Eliminar las funciones existentes para evitar conflictos
DROP FUNCTION IF EXISTS add_user_to_organization(p_user_id UUID, p_org_id UUID, p_role TEXT);
DROP FUNCTION IF EXISTS remove_user_from_organization(p_user_id UUID, p_org_id UUID);
DROP FUNCTION IF EXISTS get_organization_users(org_id UUID);

-- Eliminar la tabla organization_users
DROP TABLE IF EXISTS organization_users CASCADE;

-- Eliminar la función RPC get_organization_users
DROP FUNCTION IF EXISTS get_organization_users(org_id UUID);

-- Eliminar la función RPC add_organization_user
DROP FUNCTION IF EXISTS add_organization_user(p_user_id UUID, p_org_id UUID, p_role TEXT);

-- Eliminar la función RPC update_organization_user_role
DROP FUNCTION IF EXISTS update_organization_user_role(p_user_id UUID, p_org_id UUID, p_role TEXT);

-- Eliminar la función RPC remove_organization_user
DROP FUNCTION IF EXISTS remove_organization_user(p_user_id UUID, p_org_id UUID);

-- Agregar columna organization_id a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Crear índice para la columna organization_id
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Crear nueva función para obtener usuarios de una organización
CREATE OR REPLACE FUNCTION get_organization_users(org_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.created_at
  FROM users u
  WHERE u.organization_id = org_id;
END;
$$;

-- Crear función para asignar un usuario a una organización
CREATE OR REPLACE FUNCTION add_user_to_organization(p_user_id UUID, p_org_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET organization_id = p_org_id, role = p_role
  WHERE id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en add_user_to_organization: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Crear función para eliminar un usuario de una organización
CREATE OR REPLACE FUNCTION remove_user_from_organization(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET organization_id = NULL
  WHERE id = p_user_id AND organization_id = p_org_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en remove_user_from_organization: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Otorgar permisos para ejecutar las nuevas funciones
GRANT EXECUTE ON FUNCTION get_organization_users TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_organization TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_from_organization TO authenticated;
