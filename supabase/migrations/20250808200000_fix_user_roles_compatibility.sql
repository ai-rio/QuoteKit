-- Sprint 4: Fix User Roles Compatibility Issue
-- Migration: 20250808200000_fix_user_roles_compatibility.sql
-- Description: Fixes user_roles table references and creates compatibility layer

-- =====================================================
-- CREATE USER ROLES TABLE FOR COMPATIBILITY
-- =====================================================

-- Create user_roles table to match references in other migrations
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- RLS POLICIES FOR USER ROLES
-- =====================================================

-- Admins can view all user roles
CREATE POLICY "Admins can view all user roles" ON user_roles
  FOR SELECT USING (public.is_admin());

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Only admins can manage user roles
CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL USING (public.is_admin());

-- Service role can manage all user roles
CREATE POLICY "Service role can manage user roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- SYNC EXISTING ADMIN USERS
-- =====================================================

-- Function to sync admin users from auth.users to user_roles
CREATE OR REPLACE FUNCTION sync_admin_users_to_roles()
RETURNS VOID AS $$
BEGIN
  -- Insert admin roles for users marked as super_admin in auth.users
  INSERT INTO user_roles (user_id, role, granted_by, granted_at)
  SELECT 
    au.id,
    'admin',
    au.id, -- Self-granted for existing admins
    au.created_at
  FROM auth.users au
  WHERE au.is_super_admin = true
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = au.id AND ur.role = 'admin'
    );
    
  -- Insert user roles for non-admin users
  INSERT INTO user_roles (user_id, role, granted_at)
  SELECT 
    au.id,
    'user',
    au.created_at
  FROM auth.users au
  WHERE au.is_super_admin = false
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = au.id AND ur.role = 'user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync existing admin users
SELECT sync_admin_users_to_roles();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_admin_users_to_roles TO authenticated;

-- Log completion
DO $$
DECLARE
  admin_count INTEGER;
  user_count INTEGER;
  total_roles INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM user_roles WHERE role = 'admin' AND is_active = true;
  SELECT COUNT(*) INTO user_count FROM user_roles WHERE role = 'user' AND is_active = true;
  SELECT COUNT(*) INTO total_roles FROM user_roles WHERE is_active = true;
  
  RAISE NOTICE 'User Roles Compatibility System created successfully:';
  RAISE NOTICE '- Created user_roles table with RLS policies';
  RAISE NOTICE '- Synced existing users: % admins, % users, % total roles', admin_count, user_count, total_roles;
  RAISE NOTICE '- All Edge Functions migrations should now work correctly';
END $$;
