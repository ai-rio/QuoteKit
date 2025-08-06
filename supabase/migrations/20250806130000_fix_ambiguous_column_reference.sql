-- Fix ambiguous column reference in copy_global_item_to_personal function
-- The issue is in the ON CONFLICT clause where global_item_id could refer to 
-- either the function parameter or the table column

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.copy_global_item_to_personal(UUID, NUMERIC);

-- Recreate with renamed parameter to avoid ambiguity
CREATE OR REPLACE FUNCTION public.copy_global_item_to_personal(
  p_global_item_id UUID,
  custom_cost NUMERIC DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_item_id UUID;
  global_item RECORD;
  category_name TEXT;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get global item details
  SELECT gi.* INTO global_item
  FROM public.global_items gi
  WHERE gi.id = p_global_item_id AND gi.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Global item not found or inactive';
  END IF;

  -- Get category name
  SELECT gc.name INTO category_name
  FROM public.global_categories gc
  WHERE gc.id = global_item.category_id;

  -- Check if user has access to this tier (simplified to two tiers)
  IF NOT (
    global_item.access_tier = 'free' OR
    (global_item.access_tier = 'premium' AND public.get_user_tier() = 'premium')
  ) THEN
    RAISE EXCEPTION 'User does not have access to this item tier: %', global_item.access_tier;
  END IF;
  
  -- Insert into personal library
  INSERT INTO public.line_items (
    user_id, 
    name, 
    unit, 
    cost, 
    category, 
    tags,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(),
    global_item.name,
    global_item.unit,
    COALESCE(custom_cost, global_item.cost),
    category_name,
    global_item.tags,
    NOW(),
    NOW()
  ) RETURNING id INTO new_item_id;
  
  -- Update usage tracking
  -- Fixed: Renamed parameter to p_global_item_id to avoid ambiguous column reference
  INSERT INTO public.user_global_item_usage (
    user_id, 
    global_item_id, 
    usage_count, 
    last_used_at,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(), 
    p_global_item_id, 
    1, 
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, global_item_id) 
  DO UPDATE SET 
    usage_count = user_global_item_usage.usage_count + 1, 
    last_used_at = NOW(),
    updated_at = NOW();
  
  RETURN new_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.copy_global_item_to_personal(UUID, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.copy_global_item_to_personal IS 'Copies a global item to user personal library - fixed ambiguous column reference by renaming parameter';
