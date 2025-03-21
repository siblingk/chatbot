-- Crear tipo enum para roles de usuario
CREATE TYPE user_type AS ENUM (
  -- Vehicle Owners
  'general_lead',     -- Buscan talleres, obtienen cotizaciones, reservan citas
  'shop_lead',        -- Reciben cotización personalizada de su taller
  
  -- Workshop Users
  'shop_owner',       -- Gestionan precios, leads y equipo
  'shop_admin',       -- Administradores del taller
  'service_advisor',  -- Manejan consultas y cotizaciones
  'technician',       -- Ejecutan reparaciones y actualizan estados
  
  -- Siblignk Internal
  'lead_generation_agent',  -- Adquieren y segmentan leads
  'customer_support_agent', -- Gestionan soporte y calidad
  'admin',                  -- Administrador del sistema
  
  -- Multi-Shop Owners
  'corporate_owner'   -- Gestionan múltiples talleres y estrategias
);

-- Paso 1: Desactivar temporalmente RLS para facilitar la migración
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;

-- Paso 2: Añadir nuevas columnas con tipo enum
ALTER TABLE users ADD COLUMN role_enum user_type;
ALTER TABLE organization_users ADD COLUMN role_enum user_type;

-- Paso 3: Migrar datos existentes a las nuevas columnas
UPDATE users
SET role_enum = CASE 
  WHEN role = 'admin' THEN 'admin'::user_type
  WHEN role = 'user' THEN 'general_lead'::user_type
  WHEN role = 'shop' THEN 'shop_owner'::user_type
  ELSE 'general_lead'::user_type
END
WHERE role IS NOT NULL;

UPDATE organization_users
SET role_enum = CASE 
  WHEN role = 'admin' THEN 'admin'::user_type
  WHEN role = 'service_advisor' THEN 'service_advisor'::user_type
  WHEN role = 'technician' THEN 'technician'::user_type
  WHEN role = 'shop_owner' THEN 'shop_owner'::user_type
  WHEN role = 'corporate_owner' THEN 'corporate_owner'::user_type
  WHEN role = 'lead_generation_agent' THEN 'lead_generation_agent'::user_type
  WHEN role = 'customer_support_agent' THEN 'customer_support_agent'::user_type
  ELSE 'general_lead'::user_type
END
WHERE role IS NOT NULL;

-- Paso 4: Eliminar políticas existentes que hacen referencia a role
DROP POLICY IF EXISTS "Administradores pueden crear organizaciones" ON organizations;
DROP POLICY IF EXISTS "Administradores pueden agregar usuarios a sus organizaciones" ON organization_users;
DROP POLICY IF EXISTS "Administradores pueden actualizar roles de usuarios en sus organizaciones" ON organization_users;
DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios de sus organizaciones" ON organization_users;
DROP POLICY IF EXISTS "Usuarios pueden actualizar talleres de su organización" ON shops;
DROP POLICY IF EXISTS "Usuarios pueden eliminar talleres de su organización" ON shops;
DROP POLICY IF EXISTS "Usuarios pueden crear talleres en su organización" ON shops;

-- Eliminar funciones que usan el role
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS has_organization_role(UUID, UUID, TEXT);

-- Paso 5: Renombrar las columnas (primero renombrar la original, luego la nueva)
ALTER TABLE users 
  RENAME COLUMN role TO role_old;
ALTER TABLE users 
  RENAME COLUMN role_enum TO role;

ALTER TABLE organization_users 
  RENAME COLUMN role TO role_old;
ALTER TABLE organization_users 
  RENAME COLUMN role_enum TO role;

-- Paso 6: Recrear las políticas usando la columna renombrada
CREATE POLICY "Administradores pueden crear organizaciones"
  ON organizations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'admin'
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
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

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

-- Recrear las funciones que utilizan la columna role
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

CREATE OR REPLACE FUNCTION has_organization_role(user_uuid UUID, org_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = user_uuid
    AND organization_id = org_id
    AND role::text = role_name
  ) INTO has_role;
  
  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 7: Eliminar las columnas antiguas después de un tiempo (opcional, podría hacerse en otra migración)
-- ALTER TABLE users DROP COLUMN role_old;
-- ALTER TABLE organization_users DROP COLUMN role_old;

-- Paso 8: Restaurar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY; 