-- Agregar columna organization_id a la tabla shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Crear políticas simples para organizations sin depender de user_id
DROP POLICY IF EXISTS "Usuarios pueden ver sus organizaciones" ON organizations;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus organizaciones" ON organizations;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus organizaciones" ON organizations;

CREATE POLICY "Usuarios pueden ver todas las organizaciones"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden actualizar todas las organizaciones"
  ON organizations FOR UPDATE
  USING (true);

CREATE POLICY "Usuarios pueden eliminar todas las organizaciones"
  ON organizations FOR DELETE
  USING (true); 