-- Fix admin users authentication by recreating them with proper auth flow
-- First delete any existing admin users
DELETE FROM public.company_settings WHERE id IN ('10000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000');
DELETE FROM public.users WHERE id IN ('10000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000');
DELETE FROM auth.users WHERE id IN ('10000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000');

-- Create a function to safely create admin users with proper bcrypt hashing
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_password TEXT,
  user_id UUID,
  full_name TEXT,
  company_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert into auth.users with proper password hashing
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
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
    deleted_at,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated', 
    user_email,
    crypt(user_password, gen_salt('bf')), -- Use proper bcrypt hashing
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "admin"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL,
    false
  );

  -- Insert into public.users
  INSERT INTO public.users (id, full_name) 
  VALUES (user_id, full_name);

  -- Insert into company_settings
  INSERT INTO public.company_settings (
    id, company_name, company_email, default_tax_rate, default_markup_rate, preferred_currency, quote_terms
  ) VALUES (
    user_id, 
    company_name, 
    user_email, 
    8.5, 
    15.0, 
    'USD', 
    'Admin account'
  );
END;
$$ LANGUAGE plpgsql;

-- Create both admin users
SELECT create_admin_user(
  'admin@quotekit.dev',
  'admin123',
  '10000000-0000-0000-0000-000000000000'::uuid,
  'Admin User',
  'QuoteKit Admin'
);

SELECT create_admin_user(
  'carlos@ai.rio.br', 
  'admin123',
  '20000000-0000-0000-0000-000000000000'::uuid,
  'Carlos AI Rio',
  'AI Rio'
);

-- Clean up the function
DROP FUNCTION create_admin_user(TEXT, TEXT, UUID, TEXT, TEXT);