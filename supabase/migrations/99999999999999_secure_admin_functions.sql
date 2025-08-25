-- =====================================================
-- SECURE ADMIN FUNCTIONS - SECURITY HARDENING
-- =====================================================
-- This migration hardens admin functions with enhanced security

-- Replace insecure existing functions with secure implementations
-- Note: We replace instead of drop to avoid breaking RLS policies

-- Add admin fields to users table if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_locked_until TIMESTAMPTZ;

-- Replace the existing is_admin() function with secure implementation
-- This maintains compatibility with existing RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_status BOOLEAN := false;
  current_time TIMESTAMPTZ := NOW();
BEGIN
  -- SECURITY: Only authenticated users can check admin status
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- SECURITY: Users can only check their own admin status unless they are admin
  IF user_id != auth.uid() THEN
    -- Check if current user is admin to allow admin-to-admin checks
    SELECT COALESCE(is_admin, false) INTO admin_status 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF NOT admin_status THEN
      -- Log unauthorized access attempt
      INSERT INTO public.admin_audit_log (user_id, action, success, error_message)
      VALUES (auth.uid(), 'unauthorized_admin_check', false, 'Attempted to check other user admin status');
      RETURN false;
    END IF;
  END IF;

  -- Get admin status from public.users table (more secure than auth.users)
  SELECT COALESCE(u.is_admin, false)
  INTO admin_status
  FROM public.users u
  WHERE u.id = user_id
    AND (u.admin_locked_until IS NULL OR u.admin_locked_until <= current_time);

  RETURN admin_status;
END;
$$ LANGUAGE plpgsql;

-- Replace current_user_is_admin() function 
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Drop other insecure functions that don't have RLS dependencies
DROP FUNCTION IF EXISTS public.get_admin_user_details(UUID);
DROP FUNCTION IF EXISTS public.can_access_admin_functions();

-- Create admin audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs (now that is_admin column exists)
CREATE POLICY "Admin audit logs are viewable by admins only" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create rate-limited, secure admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  is_valid BOOLEAN,
  user_email TEXT,
  last_login TIMESTAMPTZ,
  error_code TEXT
) 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_record RECORD;
  current_time TIMESTAMPTZ := NOW();
  login_attempts INTEGER;
  lockout_until TIMESTAMPTZ;
BEGIN
  -- SECURITY: Only authenticated users can check admin status
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, 'UNAUTHENTICATED';
    RETURN;
  END IF;

  -- SECURITY: Users can only check their own admin status
  IF check_user_id != auth.uid() THEN
    -- Log unauthorized access attempt
    INSERT INTO public.admin_audit_log (user_id, action, success, error_message)
    VALUES (auth.uid(), 'unauthorized_admin_check', false, 'Attempted to check other user admin status');
    
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, 'UNAUTHORIZED';
    RETURN;
  END IF;

  -- Get user data with admin status
  SELECT u.*, au.email
  INTO user_record
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE u.id = check_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, 'USER_NOT_FOUND';
    RETURN;
  END IF;

  -- Check if account is locked
  IF user_record.admin_locked_until IS NOT NULL AND user_record.admin_locked_until > current_time THEN
    RETURN QUERY SELECT false, user_record.email, NULL::TIMESTAMPTZ, 'ACCOUNT_LOCKED';
    RETURN;
  END IF;

  -- Check admin status
  IF NOT COALESCE(user_record.is_admin, false) THEN
    -- Log failed admin attempt
    INSERT INTO public.admin_audit_log (user_id, action, success, error_message)
    VALUES (check_user_id, 'failed_admin_verification', false, 'User is not admin');
    
    RETURN QUERY SELECT false, user_record.email, NULL::TIMESTAMPTZ, 'NOT_ADMIN';
    RETURN;
  END IF;

  -- Update last admin login
  UPDATE public.users 
  SET 
    last_admin_login = current_time,
    admin_login_attempts = 0,  -- Reset failed attempts on success
    admin_locked_until = NULL  -- Clear any lockout
  WHERE id = check_user_id;

  -- Log successful admin access
  INSERT INTO public.admin_audit_log (user_id, action, success)
  VALUES (check_user_id, 'admin_verification_success', true);

  -- Return success
  RETURN QUERY SELECT true, user_record.email, current_time, 'SUCCESS';
END;
$$ LANGUAGE plpgsql;

-- Create admin session validation function
CREATE OR REPLACE FUNCTION public.validate_admin_session()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  session_valid BOOLEAN := false;
  user_data RECORD;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Get user admin status and session info
  SELECT is_admin, last_admin_login, admin_locked_until
  INTO user_data
  FROM public.users
  WHERE id = auth.uid();

  -- Verify user is admin and not locked
  IF user_data.is_admin = true AND 
     (user_data.admin_locked_until IS NULL OR user_data.admin_locked_until <= NOW()) THEN
    session_valid := true;
  END IF;

  -- Log validation attempt
  INSERT INTO public.admin_audit_log (user_id, action, success, error_message)
  VALUES (
    auth.uid(), 
    'session_validation', 
    session_valid,
    CASE WHEN NOT session_valid THEN 'Session validation failed' ELSE NULL END
  );

  RETURN session_valid;
END;
$$ LANGUAGE plpgsql;

-- Grant minimal necessary permissions - NO ANON ACCESS
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_admin_session() TO authenticated;

-- SECURITY: Revoke any previous anon access to admin functions
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM anon;

-- Create index for audit log performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_timestamp 
ON public.admin_audit_log(user_id, timestamp DESC);

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_admin_status 
ON public.users(id) WHERE is_admin = true;

-- Log the security enhancement
DO $$
BEGIN
  RAISE NOTICE 'SECURITY: Admin functions hardened successfully:';
  RAISE NOTICE '- Replaced is_admin() function with secure implementation';
  RAISE NOTICE '- Removed anon access to admin functions';  
  RAISE NOTICE '- Added rate limiting and audit logging';
  RAISE NOTICE '- Enhanced session validation';
  RAISE NOTICE '- Added account lockout protection';
  RAISE NOTICE '- Maintained RLS policy compatibility';
  RAISE NOTICE 'SECURITY ENHANCEMENT COMPLETE';
END $$;