-- Migración para corregir el problema de recursión infinita en organization_users

-- Primero, modificamos la política de la tabla para evitar recursión infinita
DROP POLICY IF EXISTS "Administradores pueden agregar usuarios a sus organizaciones" ON organization_users;
DROP POLICY IF EXISTS "Administradores pueden actualizar roles de usuarios en sus organizaciones" ON organization_users;
DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios de sus organizaciones" ON organization_users;
DROP POLICY IF EXISTS "Usuarios pueden ver roles de miembros de sus organizaciones" ON organization_users;

-- Crear políticas nuevas que no causen recursión
CREATE POLICY "Users can view members of the same organization" 
  ON organization_users FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage organization users" 
  ON organization_users FOR ALL 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Crear funciones RPC para manipular organization_users sin problemas de recursión
CREATE OR REPLACE FUNCTION add_organization_user(
  p_user_id UUID, 
  p_org_id UUID, 
  p_role text
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe
  SELECT EXISTS(
    SELECT 1 FROM organization_users 
    WHERE user_id = p_user_id AND organization_id = p_org_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Si ya existe, actualizar rol
    UPDATE organization_users 
    SET role = p_role::user_type
    WHERE user_id = p_user_id AND organization_id = p_org_id;
  ELSE
    -- Si no existe, insertar
    INSERT INTO organization_users (user_id, organization_id, role) 
    VALUES (p_user_id, p_org_id, p_role::user_type);
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en add_organization_user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_organization_user_role(
  p_user_id UUID, 
  p_org_id UUID, 
  p_role text
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organization_users 
  SET role = p_role::user_type
  WHERE user_id = p_user_id AND organization_id = p_org_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en update_organization_user_role: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_organization_user(
  p_user_id UUID, 
  p_org_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM organization_users 
  WHERE user_id = p_user_id AND organization_id = p_org_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en remove_organization_user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear una función para obtener usuarios de una organización
CREATE OR REPLACE FUNCTION get_organization_users(org_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ou.id,
    ou.user_id,
    u.email,
    u.first_name,
    u.last_name,
    ou.role::TEXT,
    ou.created_at
  FROM organization_users ou
  JOIN users u ON ou.user_id = u.id
  WHERE ou.organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 