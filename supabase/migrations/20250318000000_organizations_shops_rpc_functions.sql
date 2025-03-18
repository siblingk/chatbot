-- Esta migración agrega funciones RPC para manejar correctamente la desasociación
-- de tiendas de organizaciones, evitando problemas con los campos JSONB

-- Función para desasociar una tienda de una organización sin activar los triggers
CREATE OR REPLACE FUNCTION desasociar_tienda(shop_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Actualización directa para evitar el trigger
  EXECUTE format('UPDATE shops SET organization_id = NULL WHERE id = %L', shop_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para ejecutar SQL dinámico (uso con precaución)
CREATE OR REPLACE FUNCTION ejecutar_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar manualmente el array JSONB de shops en una organización
CREATE OR REPLACE FUNCTION actualizar_shops_organization(org_id_param UUID)
RETURNS VOID AS $$
DECLARE
  shop_records RECORD;
  shop_array JSONB := '[]'::JSONB;
BEGIN
  -- Construir el array JSONB con todas las tiendas asociadas a la organización
  FOR shop_records IN
    SELECT id, name 
    FROM shops 
    WHERE organization_id = org_id_param
  LOOP
    shop_array := shop_array || jsonb_build_object('id', shop_records.id, 'name', shop_records.name);
  END LOOP;
  
  -- Actualizar el campo shops en la organización
  UPDATE organizations
  SET shops = shop_array
  WHERE id = org_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para eliminar una tienda de forma segura
CREATE OR REPLACE FUNCTION eliminar_tienda_seguro(shop_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Primero obtenemos el organization_id
  SELECT organization_id INTO org_id FROM shops WHERE id = shop_id_param;
  
  -- Si la tienda pertenece a una organización, la desasociamos primero
  IF org_id IS NOT NULL THEN
    -- Actualizar manualmente el array JSONB en la organización
    PERFORM actualizar_shops_organization(org_id);
    
    -- Desasociar la tienda
    PERFORM desasociar_tienda(shop_id_param);
  END IF;
  
  -- Finalmente, eliminar la tienda
  DELETE FROM shops WHERE id = shop_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error eliminando tienda: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para asignar una tienda a una organización de forma segura
CREATE OR REPLACE FUNCTION asignar_tienda_organizacion(shop_id_param UUID, org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  shop_name TEXT;
  current_shops JSONB;
BEGIN
  -- Obtener el nombre de la tienda
  SELECT name INTO shop_name FROM shops WHERE id = shop_id_param;
  
  -- Actualizar la tienda con el nuevo organization_id
  UPDATE shops SET organization_id = org_id_param WHERE id = shop_id_param;
  
  -- Obtener el array actual de shops
  SELECT shops INTO current_shops FROM organizations WHERE id = org_id_param;
  
  -- Si el array es NULL, inicializarlo
  IF current_shops IS NULL THEN
    current_shops := '[]'::JSONB;
  END IF;
  
  -- Verificar si la tienda ya está en el array
  IF NOT current_shops @> jsonb_build_array(jsonb_build_object('id', shop_id_param)) THEN
    -- Agregar la tienda al array
    current_shops := current_shops || jsonb_build_object('id', shop_id_param, 'name', shop_name);
    
    -- Actualizar la organización
    UPDATE organizations SET shops = current_shops WHERE id = org_id_param;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error asignando tienda: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar estas funciones
GRANT EXECUTE ON FUNCTION desasociar_tienda TO authenticated;
GRANT EXECUTE ON FUNCTION ejecutar_sql TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_shops_organization TO authenticated;
GRANT EXECUTE ON FUNCTION eliminar_tienda_seguro TO authenticated;
GRANT EXECUTE ON FUNCTION asignar_tienda_organizacion TO authenticated; 