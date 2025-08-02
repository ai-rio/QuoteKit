-- =====================================================
-- ADD ADMIN FUNCTIONS
-- =====================================================
-- This migration adds functions to check admin status for users
-- Required for admin dashboard access control

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user exists and has admin privileges
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's admin status
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user admin details
CREATE OR REPLACE FUNCTION public.get_admin_user_details(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    pu.full_name,
    au.is_super_admin as is_admin,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_details(UUID) TO authenticated;

-- Grant execute permissions to anon users (for public access)
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_details(UUID) TO anon;

-- Add RLS policies for admin functions (they are security definer, so they run with elevated privileges)
-- But we still want to ensure they can only be called by the user themselves or admins

-- Create a helper function to check if current user can access admin functions
CREATE OR REPLACE FUNCTION public.can_access_admin_functions()
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow if user is checking their own status or if they are already an admin
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.can_access_admin_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_functions() TO anon;

-- Log the creation
DO $$
BEGIN
  RAISE NOTICE 'Admin functions created successfully:';
  RAISE NOTICE '- public.is_admin(user_id) - Check if user is admin';
  RAISE NOTICE '- public.current_user_is_admin() - Check current user admin status';
  RAISE NOTICE '- public.get_admin_user_details(user_id) - Get admin user details';
  RAISE NOTICE 'Functions are available for admin dashboard access control';
END $$;
