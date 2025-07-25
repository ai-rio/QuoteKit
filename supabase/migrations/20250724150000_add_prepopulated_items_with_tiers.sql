-- Story: Prepopulated Items Library with Tiered Access
-- Add global prepopulated categories and items with tier-based access control

-- Create enum for access tiers
CREATE TYPE item_access_tier AS ENUM ('free', 'paid', 'premium');

-- Create global categories table (system-wide categories)
CREATE TABLE public.global_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  access_tier item_access_tier DEFAULT 'free',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create global items table (prepopulated items)
CREATE TABLE public.global_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.global_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  unit TEXT,
  cost NUMERIC(10, 2),
  description TEXT,
  notes TEXT,
  access_tier item_access_tier DEFAULT 'free',
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table to track user access to global items (for analytics and customization)
CREATE TABLE public.user_global_item_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  global_item_id UUID NOT NULL REFERENCES public.global_items(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, global_item_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.global_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_global_item_usage ENABLE ROW LEVEL SECURITY;

-- Create function to check user's subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(user_id UUID DEFAULT auth.uid())
RETURNS item_access_tier AS $$
DECLARE
  user_tier item_access_tier := 'free';
  active_subscription RECORD;
BEGIN
  -- Check if user has an active subscription
  SELECT * INTO active_subscription
  FROM public.subscriptions s
  JOIN public.prices p ON s.price_id = p.id
  JOIN public.products pr ON p.product_id = pr.id
  WHERE s.user_id = get_user_tier.user_id 
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > NOW()
  ORDER BY s.created DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Determine tier based on product metadata or name
    -- This can be customized based on your Stripe product setup
    IF active_subscription.metadata->>'tier' = 'premium' OR active_subscription.name ILIKE '%premium%' THEN
      user_tier := 'premium';
    ELSE
      user_tier := 'paid';
    END IF;
  END IF;
  
  RETURN user_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access an item tier
CREATE OR REPLACE FUNCTION public.can_access_tier(
  required_tier item_access_tier,
  user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier item_access_tier;
BEGIN
  user_tier := public.get_user_tier(user_id);
  
  -- Free tier can only access free items
  -- Paid tier can access free and paid items
  -- Premium tier can access all items
  RETURN CASE
    WHEN user_tier = 'free' THEN required_tier = 'free'
    WHEN user_tier = 'paid' THEN required_tier IN ('free', 'paid')
    WHEN user_tier = 'premium' THEN TRUE
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for global_categories
CREATE POLICY "Global categories visible to all authenticated users" 
ON public.global_categories 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND is_active = TRUE 
  AND public.can_access_tier(access_tier)
);

CREATE POLICY "Admin users can manage global categories" 
ON public.global_categories 
FOR ALL 
USING (public.is_admin());

-- RLS Policies for global_items
CREATE POLICY "Global items visible based on user tier" 
ON public.global_items 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND is_active = TRUE 
  AND public.can_access_tier(access_tier)
);

CREATE POLICY "Admin users can manage global items" 
ON public.global_items 
FOR ALL 
USING (public.is_admin());

-- RLS Policies for user_global_item_usage
CREATE POLICY "Users can manage their own global item usage" 
ON public.user_global_item_usage 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_global_categories_access_tier ON public.global_categories(access_tier);
CREATE INDEX idx_global_categories_active ON public.global_categories(is_active);
CREATE INDEX idx_global_categories_sort ON public.global_categories(sort_order);

CREATE INDEX idx_global_items_category ON public.global_items(category_id);
CREATE INDEX idx_global_items_access_tier ON public.global_items(access_tier);
CREATE INDEX idx_global_items_active ON public.global_items(is_active);
CREATE INDEX idx_global_items_sort ON public.global_items(sort_order);
CREATE INDEX idx_global_items_search ON public.global_items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, '')));

CREATE INDEX idx_user_global_item_usage_user ON public.user_global_item_usage(user_id);
CREATE INDEX idx_user_global_item_usage_item ON public.user_global_item_usage(global_item_id);
CREATE INDEX idx_user_global_item_usage_favorites ON public.user_global_item_usage(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_user_global_item_usage_last_used ON public.user_global_item_usage(user_id, last_used_at DESC);

-- Add triggers for updated_at columns
CREATE TRIGGER update_global_categories_updated_at
  BEFORE UPDATE ON public.global_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_items_updated_at
  BEFORE UPDATE ON public.global_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_global_item_usage_updated_at
  BEFORE UPDATE ON public.user_global_item_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to copy global item to user's personal library
CREATE OR REPLACE FUNCTION public.copy_global_item_to_personal(
  global_item_id UUID,
  custom_cost NUMERIC(10, 2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_global_item RECORD;
  v_personal_item_id UUID;
  v_input_global_item_id UUID := global_item_id;
  v_input_custom_cost NUMERIC(10, 2) := custom_cost;
BEGIN
  -- Check if user can access this item
  SELECT * INTO v_global_item
  FROM public.global_items gi
  WHERE gi.id = v_input_global_item_id
    AND gi.is_active = TRUE
    AND public.can_access_tier(gi.access_tier);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Global item not found or access denied';
  END IF;
  
  -- Insert into user's personal items
  INSERT INTO public.line_items (
    user_id,
    name,
    unit,
    cost,
    category,
    tags
  ) VALUES (
    auth.uid(),
    v_global_item.name,
    v_global_item.unit,
    COALESCE(v_input_custom_cost, v_global_item.cost),
    COALESCE(v_global_item.subcategory, (SELECT name FROM public.global_categories WHERE id = v_global_item.category_id)),
    v_global_item.tags
  ) RETURNING id INTO v_personal_item_id;
  
  -- Track usage - use separate INSERT without ON CONFLICT to avoid ambiguity
  BEGIN
    INSERT INTO public.user_global_item_usage (user_id, global_item_id, last_used_at, usage_count)
    VALUES (auth.uid(), v_input_global_item_id, NOW(), 1);
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.user_global_item_usage 
    SET last_used_at = NOW(),
        usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE user_id = auth.uid() 
      AND global_item_id = v_input_global_item_id;
  END;
  
  RETURN v_personal_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark global item as favorite
CREATE OR REPLACE FUNCTION public.toggle_global_item_favorite(
  global_item_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_favorite BOOLEAN := FALSE;
BEGIN
  -- Check if user can access this item
  IF NOT EXISTS (
    SELECT 1 FROM public.global_items
    WHERE id = toggle_global_item_favorite.global_item_id
      AND is_active = TRUE
      AND public.can_access_tier(access_tier)
  ) THEN
    RAISE EXCEPTION 'Global item not found or access denied';
  END IF;
  
  -- Get current favorite status
  SELECT is_favorite INTO current_favorite
  FROM public.user_global_item_usage
  WHERE user_id = auth.uid() AND global_item_id = toggle_global_item_favorite.global_item_id;
  
  -- Toggle favorite status
  INSERT INTO public.user_global_item_usage (user_id, global_item_id, is_favorite, last_used_at)
  VALUES (auth.uid(), toggle_global_item_favorite.global_item_id, NOT COALESCE(current_favorite, FALSE), NOW())
  ON CONFLICT (user_id, global_item_id) 
  DO UPDATE SET 
    is_favorite = NOT COALESCE(user_global_item_usage.is_favorite, FALSE),
    updated_at = NOW();
  
  RETURN NOT COALESCE(current_favorite, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.global_categories TO authenticated;
GRANT SELECT ON public.global_items TO authenticated;
GRANT ALL ON public.user_global_item_usage TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_tier(item_access_tier, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.copy_global_item_to_personal(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_global_item_favorite(UUID) TO authenticated;

-- Comment the tables for documentation
COMMENT ON TABLE public.global_categories IS 'System-wide categories for prepopulated items with tier-based access';
COMMENT ON TABLE public.global_items IS 'Prepopulated items library with tier-based access control';
COMMENT ON TABLE public.user_global_item_usage IS 'Tracks user interaction with global items (favorites, usage analytics)';