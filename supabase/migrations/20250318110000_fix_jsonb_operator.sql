-- Esta migración corrige el error de operador "jsonb - jsonb" en las funciones de gestión de tiendas

-- Reemplazamos la función eliminar_tienda_seguro para evitar el error con operadores JSONB
DROP FUNCTION IF EXISTS eliminar_tienda_seguro;
CREATE OR REPLACE FUNCTION eliminar_tienda_seguro(shop_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org_id UUID;
  shop_name TEXT;
BEGIN
  -- Primero obtenemos la información de la tienda
  SELECT organization_id, name INTO org_id, shop_name FROM shops WHERE id = shop_id_param;
  
  IF shop_name IS NULL THEN
    RAISE NOTICE 'Tienda con ID % no encontrada', shop_id_param;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE 'Intentando eliminar tienda: % (ID: %) de organización: %', shop_name, shop_id_param, org_id;
  
  -- Si la tienda pertenece a una organización, actualizamos el array JSONB primero
  IF org_id IS NOT NULL THEN
    BEGIN
      -- Obtener el array actual de shops
      DECLARE
        current_shops JSONB;
        filtered_shops JSONB := '[]'::JSONB;
        shop_obj JSONB;
      BEGIN
        SELECT shops INTO current_shops FROM organizations WHERE id = org_id;
        
        -- Si el array existe, filtramos la tienda que queremos eliminar manualmente
        IF current_shops IS NOT NULL AND jsonb_array_length(current_shops) > 0 THEN
          -- Iteramos manualmente para construir un nuevo array sin la tienda a eliminar
          FOR shop_obj IN SELECT * FROM jsonb_array_elements(current_shops)
          LOOP
            IF (shop_obj->>'id')::UUID != shop_id_param THEN
              filtered_shops := filtered_shops || shop_obj;
            END IF;
          END LOOP;
          
          -- Actualizar la organización con el array filtrado
          UPDATE organizations SET shops = filtered_shops WHERE id = org_id;
          RAISE NOTICE 'JSONB array actualizado en organización, ahora tiene % elementos', jsonb_array_length(filtered_shops);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error al procesar JSONB en organización: %', SQLERRM;
        -- Continuamos de todos modos
      END;
    END;
    
    -- Ahora desasociamos la tienda primero (organization_id = null)
    BEGIN
      UPDATE shops SET organization_id = NULL WHERE id = shop_id_param;
      RAISE NOTICE 'Tienda desasociada correctamente de organización';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al desasociar tienda: %', SQLERRM;
      -- Continuamos de todos modos
    END;
  END IF;
  
  -- Finalmente, intentamos eliminar la tienda
  BEGIN
    DELETE FROM shops WHERE id = shop_id_param;
    RAISE NOTICE 'Tienda eliminada correctamente: % (ID: %)', shop_name, shop_id_param;
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al eliminar tienda: %', SQLERRM;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- También corregimos la función actualizar_shops_organization
DROP FUNCTION IF EXISTS actualizar_shops_organization;
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
    -- Añadimos cada tienda como un objeto independiente
    shop_array := shop_array || jsonb_build_object('id', shop_records.id, 'name', shop_records.name);
  END LOOP;
  
  -- Actualizar el campo shops en la organización
  UPDATE organizations SET shops = shop_array WHERE id = org_id_param;
  RAISE NOTICE 'Shops array actualizado para organización %, ahora tiene % elementos', 
               org_id_param, jsonb_array_length(shop_array);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para las funciones modificadas
GRANT EXECUTE ON FUNCTION eliminar_tienda_seguro TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_shops_organization TO authenticated; 