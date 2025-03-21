-- Agregar columna de rol a la tabla de usuarios
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'user', 'shop'));

-- Crear tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear políticas RLS para organizaciones
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver todas las organizaciones"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Administradores pueden crear organizaciones"
  ON organizations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'admin'
  );

-- Crear tabla de roles de usuario en organizaciones
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'service_advisor', 'technician', 'shop_owner', 'corporate_owner', 'lead_generation_agent', 'customer_support_agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, organization_id, role)
);

-- Crear políticas RLS para organization_users
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso a organization_users
CREATE POLICY "Usuarios pueden ver roles de miembros de sus organizaciones"
  ON organization_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Administradores pueden agregar usuarios a sus organizaciones"
  ON organization_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
    ) OR (
      -- Permitir a administradores globales agregar usuarios a cualquier organización
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

CREATE POLICY "Administradores pueden actualizar roles de usuarios en sus organizaciones"
  ON organization_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
    ) OR (
      -- Permitir a administradores globales actualizar roles en cualquier organización
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

CREATE POLICY "Administradores pueden eliminar usuarios de sus organizaciones"
  ON organization_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
    ) OR (
      -- Permitir a administradores globales eliminar usuarios de cualquier organización
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

-- Asegurar que la columna organization_id exista en la tabla shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Crear políticas RLS para shops relacionadas con organizaciones
DROP POLICY IF EXISTS "Usuarios pueden ver talleres de su organización" ON shops;
CREATE POLICY "Usuarios pueden ver talleres de su organización"
  ON shops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = shops.organization_id
      AND ou.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar talleres de su organización" ON shops;
CREATE POLICY "Usuarios pueden actualizar talleres de su organización"
  ON shops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = shops.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('admin', 'shop_owner', 'corporate_owner')
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden eliminar talleres de su organización" ON shops;
CREATE POLICY "Usuarios pueden eliminar talleres de su organización"
  ON shops FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = shops.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('admin', 'shop_owner', 'corporate_owner')
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden crear talleres en su organización" ON shops;
CREATE POLICY "Usuarios pueden crear talleres en su organización"
  ON shops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = shops.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('admin', 'shop_owner', 'corporate_owner')
    )
  );

-- Función para obtener organizaciones y roles del usuario actual
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.slug, ou.role
  FROM organizations o
  JOIN organization_users ou ON o.id = ou.organization_id
  WHERE ou.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener los talleres de una organización
CREATE OR REPLACE FUNCTION get_organization_shops(org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  location TEXT,
  rate NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verificar si el usuario tiene acceso a la organización
  IF EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT s.id, s.name, s.location, s.rate, s.status, s.created_at, s.updated_at
    FROM shops s
    WHERE s.organization_id = org_id;
  ELSE
    RAISE EXCEPTION 'No tienes permisos para ver los talleres de esta organización';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene un rol específico en una organización
CREATE OR REPLACE FUNCTION has_organization_role(user_uuid UUID, org_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = user_uuid
    AND organization_id = org_id
    AND role = role_name
  ) INTO has_role;
  
  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es administrador global
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin
  FROM users
  WHERE id = user_uuid;
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar un usuario a una organización con un rol específico
CREATE OR REPLACE FUNCTION add_user_to_organization(
  target_user_id UUID,
  target_org_id UUID,
  target_role TEXT
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Verificar si el usuario actual es administrador de la organización o administrador global
  IF (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE user_id = auth.uid()
      AND organization_id = target_org_id
      AND role = 'admin'
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  ) THEN
    INSERT INTO organization_users (user_id, organization_id, role)
    VALUES (target_user_id, target_org_id, target_role)
    RETURNING id INTO new_id;
    
    RETURN new_id;
  ELSE
    RAISE EXCEPTION 'No tienes permisos para agregar usuarios a esta organización';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para asignar un taller a una organización
CREATE OR REPLACE FUNCTION assign_shop_to_organization(
  shop_uuid UUID,
  org_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si el usuario actual tiene permiso para modificar la organización
  IF (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE user_id = auth.uid()
      AND organization_id = org_uuid
      AND role IN ('admin', 'corporate_owner')
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  ) THEN
    UPDATE shops
    SET organization_id = org_uuid
    WHERE id = shop_uuid;
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'No tienes permisos para asignar talleres a esta organización';
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_organization_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_role ON organization_users(role);
CREATE INDEX IF NOT EXISTS idx_shops_organization_id ON shops(organization_id); 