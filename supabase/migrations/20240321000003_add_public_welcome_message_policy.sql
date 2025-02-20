-- Migration: Add public access to welcome_message
-- Description: Allows public access to the welcome_message column in settings table

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public access to welcome_message" ON settings;

-- Create policy to allow public access to welcome_message
CREATE POLICY "Allow public access to welcome_message"
    ON settings
    FOR SELECT
    TO public
    USING (true)
    WITH CHECK (false);

-- Ensure RLS is enabled
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to public role
GRANT SELECT (workshop_id, welcome_message) ON settings TO anon;
GRANT SELECT (workshop_id, welcome_message) ON settings TO public; 