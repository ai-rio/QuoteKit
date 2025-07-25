-- Check if user exists and promote to admin
-- Run this in Supabase Studio SQL Editor

-- First, check if the user exists
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'carlos@ai.rio.br';

-- If user exists, promote to admin
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'carlos@ai.rio.br';

-- Verify the update
SELECT email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'carlos@ai.rio.br';