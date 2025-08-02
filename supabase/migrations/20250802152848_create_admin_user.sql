-- =====================================================
-- CREATE ADMIN USER MIGRATION
-- =====================================================
-- This migration creates a default admin user for development/testing
-- Email: carlos@ai.rio.br
-- Password: password123
-- Admin privileges: ENABLED

-- Create the admin user in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  phone_confirmed_at,
  last_sign_in_at
) VALUES (
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'carlos@ai.rio.br',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Carlos Admin"}'::jsonb,
  true,
  'authenticated',
  'authenticated',
  '',
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('password123', gen_salt('bf')),
  is_super_admin = true,
  email_confirmed_at = NOW(),
  updated_at = NOW();

-- Create identity record for email authentication
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  '{"sub": "0a8b8ce7-3cc3-476e-b820-2296df2119cf", "email": "carlos@ai.rio.br"}'::jsonb,
  'email',
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE SET
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Add user to public.users table
INSERT INTO public.users (
  id,
  full_name,
  created_at,
  updated_at
) VALUES (
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  'Carlos Admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = 'Carlos Admin',
  updated_at = NOW();

-- Create default company settings for the admin user
INSERT INTO public.company_settings (
  id,
  company_name,
  company_email,
  company_phone,
  default_tax_rate,
  default_markup_rate,
  preferred_currency,
  quote_terms,
  created_at,
  updated_at
) VALUES (
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  'Admin Test Company',
  'carlos@ai.rio.br',
  '+1 (555) 123-4567',
  8.25,
  15.00,
  'USD',
  'Payment is due within 30 days of quote acceptance. All work is guaranteed for 1 year.',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_name = 'Admin Test Company',
  company_email = 'carlos@ai.rio.br',
  updated_at = NOW();

-- Add some sample line items for the admin user
INSERT INTO public.line_items (
  id,
  user_id,
  name,
  unit,
  cost,
  category,
  tags,
  is_favorite,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
    'Lawn Mowing Service',
    'per visit',
    45.00,
    'Maintenance',
    ARRAY['lawn', 'mowing', 'maintenance'],
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
    'Hedge Trimming',
    'per hour',
    65.00,
    'Landscaping',
    ARRAY['hedge', 'trimming', 'pruning'],
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
    'Mulch Installation',
    'per cubic yard',
    85.00,
    'Installation',
    ARRAY['mulch', 'installation', 'landscaping'],
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
    'Fertilizer Application',
    'per application',
    55.00,
    'Treatment',
    ARRAY['fertilizer', 'treatment', 'lawn care'],
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Add a sample client for the admin user
INSERT INTO public.clients (
  id,
  user_id,
  name,
  email,
  phone,
  address,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  'Sample Client',
  'client@example.com',
  '+1 (555) 987-6543',
  '123 Main Street, Anytown, ST 12345',
  'Test client for admin user demonstrations',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create a Stripe customer record for the admin user
INSERT INTO public.customers (
  id,
  stripe_customer_id
) VALUES (
  '0a8b8ce7-3cc3-476e-b820-2296df2119cf'::uuid,
  'cus_admin_test_customer'
) ON CONFLICT (id) DO UPDATE SET
  stripe_customer_id = 'cus_admin_test_customer';

-- Log the creation
DO $$
BEGIN
  RAISE NOTICE 'Admin user created successfully:';
  RAISE NOTICE 'Email: carlos@ai.rio.br';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE 'Admin privileges: ENABLED';
  RAISE NOTICE 'Sample data: Company settings, line items, and client created';
END $$;
