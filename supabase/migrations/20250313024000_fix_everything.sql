-- Eliminar tablas antiguas si existen
DROP TABLE IF EXISTS management_group_users CASCADE;
DROP TABLE IF EXISTS organization_management_groups CASCADE;
DROP TABLE IF EXISTS management_groups CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Eliminar funciones antiguas
DROP FUNCTION IF EXISTS get_user_organizations(UUID);
DROP FUNCTION IF EXISTS is_admin_role(UUID);
DROP FUNCTION IF EXISTS handle_new_user_role();

-- Asegurarse de que la tabla organizations existe
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Añadir columna para almacenar los shops asociados a la organización
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS shops JSONB DEFAULT '[]'::jsonb;

-- Crear tabla de shops
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear función para obtener organizaciones del usuario
CREATE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  role TEXT,
  shops JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.slug, 'admin'::TEXT as role, o.shops
  FROM organizations o;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver organizaciones a las que pertenecen" ON organizations;
DROP POLICY IF EXISTS "Solo administradores pueden crear organizaciones" ON organizations;
DROP POLICY IF EXISTS "Solo administradores de la organización pueden actualizar" ON organizations;
DROP POLICY IF EXISTS "Solo administradores de la organización pueden eliminar" ON organizations;
DROP POLICY IF EXISTS "Usuarios pueden ver organizaciones" ON organizations;
DROP POLICY IF EXISTS "Usuarios pueden actualizar organizaciones" ON organizations;
DROP POLICY IF EXISTS "Usuarios pueden eliminar organizaciones" ON organizations;

-- Crear políticas para organizations (sin depender de user_id)
CREATE POLICY "Usuarios pueden ver todas las organizaciones"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear organizaciones"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar todas las organizaciones"
  ON organizations FOR UPDATE
  USING (true);

CREATE POLICY "Usuarios pueden eliminar todas las organizaciones"
  ON organizations FOR DELETE
  USING (true);

-- Configurar RLS para shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Crear políticas para shops (sin depender de user_id)
CREATE POLICY "Usuarios pueden ver todos los shops"
  ON shops FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear shops"
  ON shops FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar shops"
  ON shops FOR UPDATE
  USING (true);

CREATE POLICY "Usuarios pueden eliminar shops"
  ON shops FOR DELETE
  USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_shops_organization_id ON shops(organization_id); 