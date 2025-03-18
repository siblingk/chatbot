-- Optimizar la función actualizar_shops_organization para manejar correctamente el campo JSONB
DROP FUNCTION IF EXISTS actualizar_shops_organization;
CREATE OR REPLACE FUNCTION actualizar_shops_organization(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    shop_record RECORD;
    shop_array JSONB := '[]'::JSONB;
BEGIN
    -- Regenerar el array JSONB desde cero
    FOR shop_record IN (
        SELECT id, name
        FROM shops
        WHERE organization_id = org_id_param
    ) LOOP
        shop_array := shop_array || jsonb_build_object('id', shop_record.id, 'name', shop_record.name);
    END LOOP;

    -- Actualizar el campo shops en la organización
    UPDATE organizations SET shops = shop_array WHERE id = org_id_param;
    RAISE NOTICE 'Shops array actualizado para organización %, ahora tiene % elementos',
                  org_id_param, jsonb_array_length(shop_array);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Permitir que usuarios autenticados ejecuten esta función
GRANT EXECUTE ON FUNCTION actualizar_shops_organization TO authenticated;

-- Agregar una nueva función para desasociar tiendas de organizaciones (más segura)
CREATE OR REPLACE FUNCTION desasociar_tienda_organizacion(shop_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    org_id UUID;
    shop_name TEXT;
    current_shops JSONB;
    filtered_shops JSONB := '[]'::JSONB;
    shop_obj JSONB;
BEGIN
    -- Obtener el ID de la organización y el nombre de la tienda
    SELECT organization_id, name INTO org_id, shop_name FROM shops WHERE id = shop_id_param;
    
    IF org_id IS NULL THEN
        RAISE NOTICE 'La tienda % no está asociada a ninguna organización', shop_id_param;
        RETURN TRUE; -- No hay nada que hacer
    END IF;
    
    RAISE NOTICE 'Desasociando tienda % (%) de organización %', shop_name, shop_id_param, org_id;
    
    -- 1. Actualizar el JSONB de la organización para quitar esta tienda
    SELECT shops INTO current_shops FROM organizations WHERE id = org_id;
    
    IF current_shops IS NOT NULL AND jsonb_array_length(current_shops) > 0 THEN
        -- Filtrar el array para quitar la tienda actual
        FOR shop_obj IN SELECT * FROM jsonb_array_elements(current_shops)
        LOOP
            IF shop_obj->>'id' <> shop_id_param::TEXT THEN
                filtered_shops := filtered_shops || shop_obj;
            END IF;
        END LOOP;
        
        -- Actualizar la organización con el array filtrado
        UPDATE organizations SET shops = filtered_shops WHERE id = org_id;
        RAISE NOTICE 'Array JSONB actualizado, ahora tiene % elementos', jsonb_array_length(filtered_shops);
    END IF;
    
    -- 2. Desasociar la tienda
    UPDATE shops SET organization_id = NULL WHERE id = shop_id_param;
    RAISE NOTICE 'Tienda desasociada correctamente';
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al desasociar tienda: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Permitir que usuarios autenticados ejecuten esta función
GRANT EXECUTE ON FUNCTION desasociar_tienda_organizacion TO authenticated; 