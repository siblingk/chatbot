-- Crear tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear tabla de grupos de gestión
CREATE TABLE IF NOT EXISTS management_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear tabla de relación entre organizaciones y grupos de gestión
CREATE TABLE IF NOT EXISTS organization_management_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  management_group_id UUID NOT NULL REFERENCES management_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(organization_id, management_group_id)
);

-- Crear tabla de roles de usuario en organizaciones
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, organization_id)
);

-- Crear tabla de roles de usuario en grupos de gestión
CREATE TABLE IF NOT EXISTS management_group_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  management_group_id UUID NOT NULL REFERENCES management_groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, management_group_id)
);

-- Crear políticas RLS para organizaciones
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver organizaciones a las que pertenecen"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.organization_id = organizations.id
      AND organization_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Solo administradores pueden crear organizaciones"
  ON organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Solo administradores de la organización pueden actualizar"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.organization_id = organizations.id
      AND organization_users.user_id = auth.uid()
      AND organization_users.role = 'admin'
    )
  );

CREATE POLICY "Solo administradores de la organización pueden eliminar"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.organization_id = organizations.id
      AND organization_users.user_id = auth.uid()
      AND organization_users.role = 'admin'
    )
  );

-- Crear políticas RLS para organization_users
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver miembros de sus organizaciones"
  ON organization_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Solo administradores pueden agregar usuarios a organizaciones"
  ON organization_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
    ) OR (
      -- Permitir a administradores globales agregar usuarios a cualquier organización
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

CREATE POLICY "Solo administradores pueden actualizar roles de usuarios"
  ON organization_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

CREATE POLICY "Solo administradores pueden eliminar usuarios de organizaciones"
  ON organization_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

-- Crear políticas RLS para management_groups
ALTER TABLE management_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver grupos de gestión a los que pertenecen"
  ON management_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM management_group_users
      WHERE management_group_users.management_group_id = management_groups.id
      AND management_group_users.user_id = auth.uid()
    ) OR (
      -- O si pertenecen a una organización que tiene este grupo de gestión
      EXISTS (
        SELECT 1 FROM organization_users ou
        JOIN organization_management_groups omg ON ou.organization_id = omg.organization_id
        WHERE omg.management_group_id = management_groups.id
        AND ou.user_id = auth.uid()
      )
    )
  );

-- Crear funciones para obtener organizaciones del usuario
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
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
  WHERE ou.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para verificar si un usuario es administrador de una organización
CREATE OR REPLACE FUNCTION is_organization_admin(user_uuid UUID, org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = user_uuid
    AND organization_id = org_id
    AND role = 'admin'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_organization_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_management_group_users_user_id ON management_group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_management_group_users_management_group_id ON management_group_users(management_group_id);
CREATE INDEX IF NOT EXISTS idx_organization_management_groups_organization_id ON organization_management_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_management_groups_management_group_id ON organization_management_groups(management_group_id); 