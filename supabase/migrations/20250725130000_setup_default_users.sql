-- Setup default admin and test users for QuoteKit
-- This migration uses UPSERT to avoid conflicts and ensure consistent user setup

-- Function to create or update a user in auth.users table
CREATE OR REPLACE FUNCTION create_or_update_auth_user(
  p_id uuid,
  p_email text,
  p_encrypted_password text,
  p_role text DEFAULT 'user'
) RETURNS void AS $$
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    p_encrypted_password,
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    null,
    '',
    '',
    null,
    NOW(),
    ('{"provider": "email", "providers": ["email"]}')::jsonb,
    ('{"role": "' || p_role || '"}')::jsonb,
    false,
    NOW(),
    NOW(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 1. Carlos as admin (carlos@ai.rio.br with password 'admin123')
SELECT create_or_update_auth_user(
  '20000000-0000-0000-0000-000000000000'::uuid,
  'carlos@ai.rio.br',
  '$2a$10$UEO/rWEaFqZFRx1Pzu0jDuR8I0vFhPGCKRfZ4FVvJzz5pPOUQh9g6', -- password: 'admin123'
  'admin'
);

-- 2. Test user for development (test@example.com with password 'password123')
SELECT create_or_update_auth_user(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'test@example.com',
  '$2a$10$UEO/rWEaFqZFRx1Pzu0jDuR8I0vFhPGCKRfZ4FVvJzz5pPOUQh9g6', -- password: 'password123'
  'user'
);

-- 3. Demo admin user (admin@quotekit.dev with password 'admin123')
SELECT create_or_update_auth_user(
  '10000000-0000-0000-0000-000000000000'::uuid,
  'admin@quotekit.dev',
  '$2a$10$UEO/rWEaFqZFRx1Pzu0jDuR8I0vFhPGCKRfZ4FVvJzz5pPOUQh9g6', -- password: 'admin123'
  'admin'
);

-- Create or update user profiles in public.users table
INSERT INTO public.users (id, full_name) 
VALUES 
  ('20000000-0000-0000-0000-000000000000'::uuid, 'Carlos AI Rio'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test User'),
  ('10000000-0000-0000-0000-000000000000'::uuid, 'Admin User')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name;

-- Create or update company settings for all users
INSERT INTO public.company_settings (
  id,
  company_name,
  company_address,
  company_phone,
  company_email,
  default_tax_rate,
  default_markup_rate,
  preferred_currency,
  quote_terms
) VALUES 
  -- Carlos AI Rio (admin)
  (
    '20000000-0000-0000-0000-000000000000'::uuid,
    'AI Rio Landscaping',
    'Rio de Janeiro, Brazil',
    '+55 21 99999-9999',
    'carlos@ai.rio.br',
    10.0,
    20.0,
    'BRL',
    'Net 30 - AI Rio admin account'
  ),
  -- Test User
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Test Landscaping Co.',
    '123 Test Street, Test City, TC 12345',
    '555-0123',
    'test@example.com',
    8.5,
    15.0,
    'USD',
    'Net 30 - Test account for development'
  ),
  -- QuoteKit Admin
  (
    '10000000-0000-0000-0000-000000000000'::uuid,
    'QuoteKit Admin',
    '123 Admin Street, Admin City, CA 90210',
    '555-0123',
    'admin@quotekit.dev',
    8.5,
    15.0,
    'USD',
    'Net 30 - Administrative account for QuoteKit'
  )
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  company_address = EXCLUDED.company_address,
  company_phone = EXCLUDED.company_phone,
  company_email = EXCLUDED.company_email,
  default_tax_rate = EXCLUDED.default_tax_rate,
  default_markup_rate = EXCLUDED.default_markup_rate,
  preferred_currency = EXCLUDED.preferred_currency,
  quote_terms = EXCLUDED.quote_terms;

-- Create sample clients for the test user to demonstrate client management
INSERT INTO public.clients (
  user_id,
  name,
  email,
  phone,
  address,
  notes
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'John Smith',
    'john.smith@email.com',
    '555-0001',
    '456 Oak Street, Anytown, AT 54321',
    'Regular customer, prefers morning appointments'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Sarah Johnson',
    'sarah.j@email.com',
    '555-0002',
    '789 Pine Avenue, Somewhere, SW 67890',
    'Large property, needs quarterly maintenance'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Mike Wilson',
    'mike.wilson@email.com',
    '555-0003',
    '321 Elm Drive, Elsewhere, EW 13579',
    'New client, interested in landscaping services'
  ),
  (
    '20000000-0000-0000-0000-000000000000'::uuid,
    'Brazilian Client',
    'cliente@brasil.com.br',
    '+55 11 98765-4321',
    'São Paulo, SP, Brazil',
    'Cliente brasileiro para demonstração'
  )
ON CONFLICT DO NOTHING;

-- Clean up the helper function
DROP FUNCTION create_or_update_auth_user(uuid, text, text, text);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.company_settings IS 'Company/business settings for each user';
COMMENT ON TABLE public.clients IS 'Client records for each user/business';

-- Summary of created users:
-- 1. carlos@ai.rio.br (password: admin123) - Admin user
-- 2. test@example.com (password: password123) - Test user with sample data
-- 3. admin@quotekit.dev (password: admin123) - Demo admin user