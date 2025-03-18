-- Esta migración corrige problemas con funciones existentes para eliminar tiendas

-- Volver a crear la función para eliminar una tienda de forma segura, más robusta
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
      BEGIN
        SELECT shops INTO current_shops FROM organizations WHERE id = org_id;
        
        -- Filtrar la tienda que queremos eliminar
        IF current_shops IS NOT NULL THEN
          DECLARE
            updated_shops JSONB := '[]'::JSONB;
            shop JSONB;
          BEGIN
            FOR shop IN SELECT * FROM jsonb_array_elements(current_shops)
            LOOP
              IF shop->>'id' != shop_id_param::TEXT THEN
                updated_shops := updated_shops || shop;
              END IF;
            END LOOP;
            
            -- Actualizar la organización
            UPDATE organizations SET shops = updated_shops WHERE id = org_id;
            RAISE NOTICE 'JSONB array actualizado en organización: %', org_id;
          END;
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al actualizar JSONB en organización: %', SQLERRM;
      -- Continuamos de todos modos
    END;
    
    -- Ahora desasociamos la tienda (organization_id = null)
    BEGIN
      UPDATE shops SET organization_id = NULL WHERE id = shop_id_param;
      RAISE NOTICE 'Tienda desasociada correctamente de organización: %', org_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error al desasociar tienda: %', SQLERRM;
      -- Continuamos de todos modos
    END;
  END IF;
  
  -- Finalmente, eliminamos la tienda
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

-- Otorgar permisos para la función modificada
GRANT EXECUTE ON FUNCTION eliminar_tienda_seguro TO authenticated; 