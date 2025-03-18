-- Actualizar la estructura de la tabla shops para asegurar consistencia con los tipos
-- y mejorar la relación con organizations

-- Asegurarse de que la tabla shops tiene todas las columnas necesarias
ALTER TABLE shops ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS user_id UUID NULL;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Default Location';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS rate DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS labor_tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS parts_tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS misc_tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- Eliminar columna tax_percentage si existe (reemplazada por las columnas específicas)
ALTER TABLE shops DROP COLUMN IF EXISTS tax_percentage;

-- Asegurarse de que la tabla organizations tiene la columna shops como JSONB
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS shops JSONB DEFAULT '[]'::jsonb;

-- Crear la función del trigger si no existe
CREATE OR REPLACE FUNCTION update_organization_shops()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  shop_data JSONB;
  current_shops JSONB;
BEGIN
  -- Para inserciones y actualizaciones
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    org_id := NEW.organization_id;
    shop_data := jsonb_build_object('id', NEW.id, 'name', NEW.name);
    
    -- Obtener la lista actual de shops
    SELECT shops INTO current_shops FROM organizations WHERE id = org_id;
    
    -- Si es una actualización, eliminar la versión anterior del shop
    IF (TG_OP = 'UPDATE' AND OLD.organization_id = NEW.organization_id) THEN
      current_shops := current_shops - jsonb_build_object('id', OLD.id, 'name', OLD.name);
    END IF;
    
    -- Añadir el nuevo shop
    current_shops := current_shops || shop_data;
    
    -- Actualizar la organización
    UPDATE organizations SET shops = current_shops WHERE id = org_id;
  END IF;
  
  -- Para eliminaciones
  IF (TG_OP = 'DELETE') THEN
    org_id := OLD.organization_id;
    
    -- Obtener la lista actual de shops
    SELECT shops INTO current_shops FROM organizations WHERE id = org_id;
    
    -- Filtrar para eliminar el shop borrado
    current_shops := current_shops - jsonb_build_object('id', OLD.id, 'name', OLD.name);
    
    -- Actualizar la organización
    UPDATE organizations SET shops = current_shops WHERE id = org_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Verificar si el trigger existe y crearlo si no
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_organization_shops_trigger'
  ) THEN
    -- Crear el trigger
    EXECUTE 'CREATE TRIGGER update_organization_shops_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_organization_shops()';
  END IF;
END;
$$;

-- Crear índice para mejorar el rendimiento si no existe
CREATE INDEX IF NOT EXISTS idx_shops_organization_id ON shops(organization_id);

-- Actualizar la lista de shops en todas las organizaciones
DO $$
DECLARE
  org RECORD;
  org_shops JSONB;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    org_shops := '[]'::jsonb;
    
    -- Construir el array de shops para esta organización
    SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name))
    INTO org_shops
    FROM shops
    WHERE organization_id = org.id;
    
    -- Si no hay shops, usar array vacío
    IF org_shops IS NULL THEN
      org_shops := '[]'::jsonb;
    END IF;
    
    -- Actualizar la organización
    UPDATE organizations SET shops = org_shops WHERE id = org.id;
  END LOOP;
END;
$$; 