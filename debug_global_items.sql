-- Debug script to check global items loading
-- Run this to see what's in the database

-- Check if we have any global categories
SELECT 'Global Categories Count:' as info, COUNT(*) as count FROM public.global_categories;
SELECT 'Active Global Categories:' as info, COUNT(*) as count FROM public.global_categories WHERE is_active = TRUE;

-- Check if we have any global items
SELECT 'Global Items Count:' as info, COUNT(*) as count FROM public.global_items;
SELECT 'Active Global Items:' as info, COUNT(*) as count FROM public.global_items WHERE is_active = TRUE;

-- Check user tier function
SELECT 'Current User:' as info, auth.uid() as user_id;
SELECT 'User Tier:' as info, public.get_user_tier() as tier;
SELECT 'Is Admin:' as info, public.is_admin() as admin_status;

-- Check if user can access 'free' tier items
SELECT 'Can Access Free Tier:' as info, public.can_access_tier('free') as can_access;

-- Check some sample data with access control
SELECT 
  'Sample Categories with Access:' as info,
  name, 
  access_tier,
  public.can_access_tier(access_tier) as can_access
FROM public.global_categories 
WHERE is_active = TRUE 
LIMIT 5;

-- Check some sample items with access control
SELECT 
  'Sample Items with Access:' as info,
  name, 
  access_tier,
  public.can_access_tier(access_tier) as can_access
FROM public.global_items 
WHERE is_active = TRUE 
LIMIT 5;