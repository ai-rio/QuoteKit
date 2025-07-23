-- Add admin role system to the application

-- Add role column to auth.users metadata
-- Note: We use auth.users metadata rather than creating a new table to keep it simple
-- This allows us to use the existing RLS policies and just check the role

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE((raw_user_meta_data->>'role')::text = 'admin', false)
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin actions audit table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Admin actions can only be viewed by admins
CREATE POLICY "Admin actions viewable by admins only" ON public.admin_actions
  FOR SELECT USING (public.is_admin());

-- Admin actions can only be inserted by admins
CREATE POLICY "Admin actions insertable by admins only" ON public.admin_actions
  FOR INSERT WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON public.admin_actions(action);

-- Create a function to grant admin role (can only be called by existing admins or via service role)
CREATE OR REPLACE FUNCTION public.grant_admin_role(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Only allow if current user is admin or if called via service role
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Only admins can grant admin roles';
  END IF;
  
  -- Update user metadata to include admin role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_actions (admin_id, action, target_user_id, metadata)
  VALUES (
    auth.uid(), 
    'grant_admin_role', 
    target_user_id,
    '{"granted_at": "'||now()||'"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to revoke admin role
CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Only allow if current user is admin or if called via service role
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Only admins can revoke admin roles';
  END IF;
  
  -- Don't allow revoking your own admin role
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;
  
  -- Update user metadata to remove admin role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_actions (admin_id, action, target_user_id, metadata)
  VALUES (
    auth.uid(), 
    'revoke_admin_role', 
    target_user_id,
    '{"revoked_at": "'||now()||'"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
) AS $$
BEGIN
  -- Only allow if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view user roles';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE((u.raw_user_meta_data->>'role')::text, 'user') as role,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;