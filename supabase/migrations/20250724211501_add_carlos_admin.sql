-- Add carlos@ai.rio.br as admin user
-- This creates the user and promotes them to admin status

-- Insert carlos as admin user directly into auth.users
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
  '20000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'carlos@ai.rio.br',
  '$2a$10$UEO/rWEaFqZFRx1Pzu0jDuR8I0vFhPGCKRfZ4FVvJzz5pPOUQh9g6', -- password: 'admin123'
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
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"role": "admin"}'::jsonb,
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
) ON CONFLICT (id) DO UPDATE SET 
  raw_user_meta_data = '{"role": "admin"}'::jsonb;

-- Insert corresponding user profile in public.users table
INSERT INTO public.users (
  id,
  full_name
) VALUES (
  '20000000-0000-0000-0000-000000000000'::uuid,
  'Carlos AI Rio'
) ON CONFLICT (id) DO NOTHING;

-- Create a company profile for carlos so they can access all features
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
) VALUES (
  '20000000-0000-0000-0000-000000000000'::uuid,
  'AI Rio',
  'Rio de Janeiro, Brazil',
  '+55 21 99999-9999',
  'carlos@ai.rio.br',
  10.0,
  20.0,
  'BRL',
  'Net 30 - AI Rio admin account'
) ON CONFLICT (id) DO NOTHING;