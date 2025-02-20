-- Migration: Fix typo in SIBLINGK_INTERNAL welcome message
-- Description: Corrects the typo in the welcome message from "Siblignk" to "Siblingk"

UPDATE settings
SET welcome_message = '¡Bienvenido a Siblingk! Encontramos los mejores talleres para ti.'
WHERE workshop_id = 'SIBLINGK_INTERNAL'; 