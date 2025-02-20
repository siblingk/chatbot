-- Migration: Change SIBLINGK_INTERNAL workshop_id to 0000
-- Description: Updates the workshop_id of the internal Siblingk settings to use 0000 as identifier

UPDATE settings
SET workshop_id = '0000'
WHERE workshop_id = 'SIBLINGK_INTERNAL'; 