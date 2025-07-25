-- Create initial admin user for development
-- This creates a user with admin privileges for testing the admin panel

-- Insert a test admin user directly into auth.users
-- Note: In production, this should be done through proper user registration flow
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
  '10000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'admin@quotekit.dev',
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
);

-- Insert corresponding user profile in public.users table
INSERT INTO public.users (
  id,
  full_name
) VALUES (
  '10000000-0000-0000-0000-000000000000'::uuid,
  'Admin User'
) ON CONFLICT (id) DO NOTHING;

-- Create a company profile for the admin user so they can access all features
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
  '10000000-0000-0000-0000-000000000000'::uuid,
  'QuoteKit Admin',
  '123 Admin Street, Admin City, CA 90210',
  '555-0123',
  'admin@quotekit.dev',
  8.5,
  15.0,
  'USD',
  'Net 30 - Administrative account for QuoteKit'
) ON CONFLICT (id) DO NOTHING;