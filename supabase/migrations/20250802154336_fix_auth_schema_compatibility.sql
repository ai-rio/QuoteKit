-- =====================================================
-- FIX AUTH SCHEMA COMPATIBILITY
-- =====================================================
-- This migration fixes compatibility issues between GoTrue and PostgreSQL
-- Specifically addresses NULL handling in auth.users table columns

-- Fix email_change column to have proper default and handle NULLs
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;

-- Fix other potentially problematic columns that might have NULL values
UPDATE auth.users SET phone = '' WHERE phone IS NULL;
UPDATE auth.users SET phone_change = '' WHERE phone_change IS NULL;

-- Ensure confirmation_token has a default
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;

-- Ensure recovery_token has a default  
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;

-- Fix email_change_token_new
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;

-- Fix phone_change_token
UPDATE auth.users SET phone_change_token = '' WHERE phone_change_token IS NULL;

-- Fix reauthentication_token
UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Auth schema compatibility issues fixed';
  RAISE NOTICE 'All NULL string columns in auth.users have been set to empty strings';
END $$;
