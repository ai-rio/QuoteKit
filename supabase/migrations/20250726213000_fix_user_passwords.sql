-- Fix user passwords with proper bcrypt hashes
-- This ensures test users always work after database reset

-- Update password for test@example.com (password: 'password123')
UPDATE auth.users 
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'test@example.com';

-- Update password for carlos@ai.rio.br (password: 'admin123')  
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'carlos@ai.rio.br';

-- Update password for admin@quotekit.dev (password: 'admin123')
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@quotekit.dev';

-- Verify all users have different password hashes now
-- (This is just for logging/verification, not for production use)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT email, left(encrypted_password, 15) as hash_preview 
        FROM auth.users 
        WHERE email IN ('test@example.com', 'admin@quotekit.dev', 'carlos@ai.rio.br')
        ORDER BY email
    LOOP
        RAISE NOTICE 'User: % | Hash: %', user_record.email, user_record.hash_preview;
    END LOOP;
END $$;

-- Summary of test credentials:
-- 1. test@example.com / password123 (regular user)
-- 2. admin@quotekit.dev / admin123 (admin user)  
-- 3. carlos@ai.rio.br / admin123 (admin user)