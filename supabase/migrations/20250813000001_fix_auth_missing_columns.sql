-- =====================================================
-- FIX MISSING AUTH COLUMNS
-- =====================================================
-- This migration adds specific missing columns that GoTrue is trying to query
-- Based on error: "column users.banned_until does not exist"

-- Add missing columns to auth.users table
DO $$
BEGIN
    -- Add banned_until column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'banned_until') THEN
        ALTER TABLE auth.users ADD COLUMN banned_until timestamp with time zone;
        RAISE NOTICE 'Added banned_until column to auth.users';
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE auth.users ADD COLUMN phone text;
        RAISE NOTICE 'Added phone column to auth.users';
    END IF;

    -- Add phone_confirmed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_confirmed_at') THEN
        ALTER TABLE auth.users ADD COLUMN phone_confirmed_at timestamp with time zone;
        RAISE NOTICE 'Added phone_confirmed_at column to auth.users';
    END IF;

    -- Add phone_change column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change') THEN
        ALTER TABLE auth.users ADD COLUMN phone_change text DEFAULT '';
        RAISE NOTICE 'Added phone_change column to auth.users';
    END IF;

    -- Add phone_change_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_token') THEN
        ALTER TABLE auth.users ADD COLUMN phone_change_token character varying(255) DEFAULT '';
        RAISE NOTICE 'Added phone_change_token column to auth.users';
    END IF;

    -- Add phone_change_sent_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_sent_at') THEN
        ALTER TABLE auth.users ADD COLUMN phone_change_sent_at timestamp with time zone;
        RAISE NOTICE 'Added phone_change_sent_at column to auth.users';
    END IF;

    -- Add email_change_token_new column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_new') THEN
        ALTER TABLE auth.users ADD COLUMN email_change_token_new character varying(255) DEFAULT '';
        RAISE NOTICE 'Added email_change_token_new column to auth.users';
    END IF;

    -- Add email_change_confirm_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_confirm_status') THEN
        ALTER TABLE auth.users ADD COLUMN email_change_confirm_status smallint DEFAULT 0;
        RAISE NOTICE 'Added email_change_confirm_status column to auth.users';
    END IF;

    -- Add reauthentication_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_token') THEN
        ALTER TABLE auth.users ADD COLUMN reauthentication_token character varying(255) DEFAULT '';
        RAISE NOTICE 'Added reauthentication_token column to auth.users';
    END IF;

    -- Add reauthentication_sent_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_sent_at') THEN
        ALTER TABLE auth.users ADD COLUMN reauthentication_sent_at timestamp with time zone;
        RAISE NOTICE 'Added reauthentication_sent_at column to auth.users';
    END IF;

    -- Add is_sso_user column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_sso_user') THEN
        ALTER TABLE auth.users ADD COLUMN is_sso_user boolean NOT NULL DEFAULT false;
        RAISE NOTICE 'Added is_sso_user column to auth.users';
    END IF;

    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE auth.users ADD COLUMN deleted_at timestamp with time zone;
        RAISE NOTICE 'Added deleted_at column to auth.users';
    END IF;

    -- Add is_anonymous column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous') THEN
        ALTER TABLE auth.users ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;
        RAISE NOTICE 'Added is_anonymous column to auth.users';
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Auth missing columns fix completed successfully';
  RAISE NOTICE 'GoTrue should now be able to query auth.users without column errors';
END $$;