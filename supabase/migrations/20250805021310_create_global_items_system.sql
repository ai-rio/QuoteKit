-- =====================================================
-- CREATE GLOBAL ITEMS SYSTEM
-- =====================================================
-- This migration creates a comprehensive global items library system
-- with proper user isolation and tiered access control

-- =====================================================
-- GLOBAL CATEGORIES TABLE
-- =====================================================

CREATE TABLE public.global_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  access_tier TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'paid', 'premium')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.global_categories ENABLE ROW LEVEL SECURITY;

-- Global categories are read-only for all users
CREATE POLICY "Allow public read-only access to global categories" 
ON public.global_categories FOR SELECT USING (true);

-- Only admins can manage global categories
CREATE POLICY "Admins can manage global categories" 
ON public.global_categories FOR ALL USING (public.is_admin());

-- Indexes for performance
CREATE INDEX idx_global_categories_access_tier ON public.global_categories(access_tier);
CREATE INDEX idx_global_categories_sort_order ON public.global_categories(sort_order);
CREATE INDEX idx_global_categories_active ON public.global_categories(is_active) WHERE is_active = true;

-- =====================================================
-- GLOBAL ITEMS TABLE
-- =====================================================

CREATE TABLE public.global_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.global_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  unit TEXT,
  cost NUMERIC(10, 2), -- Suggested cost, users can override
  description TEXT,
  notes TEXT,
  access_tier TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'paid', 'premium')),
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.global_items ENABLE ROW LEVEL SECURITY;

-- Global items are read-only for all users
CREATE POLICY "Allow public read-only access to global items" 
ON public.global_items FOR SELECT USING (true);

-- Only admins can manage global items
CREATE POLICY "Admins can manage global items" 
ON public.global_items FOR ALL USING (public.is_admin());

-- Indexes for performance
CREATE INDEX idx_global_items_category_id ON public.global_items(category_id);
CREATE INDEX idx_global_items_access_tier ON public.global_items(access_tier);
CREATE INDEX idx_global_items_sort_order ON public.global_items(sort_order);
CREATE INDEX idx_global_items_active ON public.global_items(is_active) WHERE is_active = true;
CREATE INDEX idx_global_items_search ON public.global_items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(subcategory, '')));

-- =====================================================
-- USER GLOBAL ITEM USAGE TABLE
-- =====================================================

CREATE TABLE public.user_global_item_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  global_item_id UUID NOT NULL REFERENCES public.global_items(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, global_item_id)
);

-- Enable RLS
ALTER TABLE public.user_global_item_usage ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own usage data
CREATE POLICY "Users can manage their own global item usage" 
ON public.user_global_item_usage FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_global_item_usage_user_id ON public.user_global_item_usage(user_id);
CREATE INDEX idx_user_global_item_usage_global_item_id ON public.user_global_item_usage(global_item_id);
CREATE INDEX idx_user_global_item_usage_favorites ON public.user_global_item_usage(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_user_global_item_usage_last_used ON public.user_global_item_usage(user_id, last_used_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's subscription tier for access control
CREATE OR REPLACE FUNCTION public.get_user_tier(user_id UUID DEFAULT auth.uid()) 
RETURNS TEXT AS $$
BEGIN
  -- Return 'free' if no user_id provided
  IF user_id IS NULL THEN
    RETURN 'free';
  END IF;

  -- Check user's subscription status
  RETURN CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s 
      JOIN public.prices p ON s.price_id = p.id 
      WHERE s.user_id = get_user_tier.user_id 
      AND s.status = 'active' 
      AND p.id = 'price_premium_plan'
    ) THEN 'premium'
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s 
      JOIN public.prices p ON s.price_id = p.id 
      WHERE s.user_id = get_user_tier.user_id 
      AND s.status = 'active' 
      AND p.id != 'price_free_plan'
    ) THEN 'paid'
    ELSE 'free'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier(UUID) TO anon;

-- Function to copy global item to personal library
CREATE OR REPLACE FUNCTION public.copy_global_item_to_personal(
  global_item_id UUID,
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
  WHERE gi.id = global_item_id AND gi.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Global item not found or inactive';
  END IF;

  -- Get category name
  SELECT gc.name INTO category_name
  FROM public.global_categories gc
  WHERE gc.id = global_item.category_id;

  -- Check if user has access to this tier
  IF NOT (
    global_item.access_tier = 'free' OR
    (global_item.access_tier = 'paid' AND public.get_user_tier() IN ('paid', 'premium')) OR
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
  INSERT INTO public.user_global_item_usage (
    user_id, 
    global_item_id, 
    usage_count, 
    last_used_at,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(), 
    global_item_id, 
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.copy_global_item_to_personal(UUID, NUMERIC) TO authenticated;

-- Function to toggle global item favorite status
CREATE OR REPLACE FUNCTION public.toggle_global_item_favorite(
  global_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  new_favorite_status BOOLEAN;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Insert or update usage record and toggle favorite
  INSERT INTO public.user_global_item_usage (
    user_id, 
    global_item_id, 
    is_favorite,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(), 
    global_item_id, 
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, global_item_id) 
  DO UPDATE SET 
    is_favorite = NOT user_global_item_usage.is_favorite,
    updated_at = NOW()
  RETURNING is_favorite INTO new_favorite_status;
  
  RETURN new_favorite_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.toggle_global_item_favorite(UUID) TO authenticated;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_global_categories_updated_at 
  BEFORE UPDATE ON public.global_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_items_updated_at 
  BEFORE UPDATE ON public.global_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_global_item_usage_updated_at 
  BEFORE UPDATE ON public.user_global_item_usage 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - GLOBAL CATEGORIES
-- =====================================================

INSERT INTO public.global_categories (name, description, color, access_tier, sort_order) VALUES
('Lawn Care', 'Basic lawn maintenance and care services', '#22c55e', 'free', 1),
('Landscaping', 'Design, installation, and maintenance of outdoor spaces', '#3b82f6', 'free', 2),
('Tree Services', 'Tree care, pruning, and removal services', '#059669', 'paid', 3),
('Irrigation', 'Sprinkler systems and watering solutions', '#0ea5e9', 'paid', 4),
('Hardscaping', 'Patios, walkways, retaining walls, and stone work', '#6366f1', 'premium', 5),
('Seasonal Services', 'Spring cleanup, fall cleanup, and seasonal maintenance', '#f59e0b', 'free', 6),
('Pest Control', 'Lawn and garden pest management', '#ef4444', 'paid', 7),
('Fertilization', 'Soil treatment and plant nutrition', '#84cc16', 'free', 8),
('Snow Services', 'Snow removal and winter maintenance', '#64748b', 'paid', 9),
('Specialty Services', 'Unique and specialized landscaping services', '#8b5cf6', 'premium', 10);

-- =====================================================
-- SEED DATA - GLOBAL ITEMS
-- =====================================================

-- Lawn Care Items (Free Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Lawn Mowing', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per visit', 45.00, 'free', ARRAY['mowing', 'maintenance', 'weekly'], 1, 'Standard lawn mowing service including grass cutting and basic cleanup'),
('Edging', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per visit', 25.00, 'free', ARRAY['edging', 'trimming', 'cleanup'], 2, 'Precise edging along walkways, driveways, and garden beds'),
('String Trimming', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per visit', 20.00, 'free', ARRAY['trimming', 'weed eating', 'detail work'], 3, 'Detailed trimming around obstacles and tight spaces'),
('Leaf Blowing', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per visit', 30.00, 'free', ARRAY['cleanup', 'blowing', 'maintenance'], 4, 'Clearing leaves and debris from lawn and hardscapes'),
('Basic Weeding', (SELECT id FROM public.global_categories WHERE name = 'Lawn Care'), 'per hour', 35.00, 'free', ARRAY['weeding', 'hand pulling', 'maintenance'], 5, 'Manual removal of weeds from garden beds and lawn areas');

-- Landscaping Items (Free Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Hedge Trimming', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per hour', 65.00, 'free', ARRAY['trimming', 'pruning', 'shaping'], 1, 'Professional hedge trimming and shaping services'),
('Mulch Installation', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per cubic yard', 85.00, 'free', ARRAY['mulch', 'installation', 'beds'], 2, 'Installation of organic or decorative mulch in garden beds'),
('Flower Bed Maintenance', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per hour', 55.00, 'free', ARRAY['flowers', 'beds', 'maintenance'], 3, 'Weeding, deadheading, and general flower bed care'),
('Shrub Pruning', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per shrub', 25.00, 'free', ARRAY['pruning', 'shrubs', 'trimming'], 4, 'Selective pruning of shrubs for health and appearance'),
('Basic Planting', (SELECT id FROM public.global_categories WHERE name = 'Landscaping'), 'per plant', 15.00, 'free', ARRAY['planting', 'installation', 'flowers'], 5, 'Planting of small plants, flowers, and shrubs');

-- Tree Services (Paid Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Tree Pruning', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per hour', 85.00, 'paid', ARRAY['pruning', 'tree care', 'safety'], 1, 'Professional tree pruning for health, safety, and aesthetics'),
('Tree Removal', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per tree', 500.00, 'paid', ARRAY['removal', 'cutting', 'cleanup'], 2, 'Complete tree removal including stump grinding'),
('Stump Grinding', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per stump', 150.00, 'paid', ARRAY['stump', 'grinding', 'removal'], 3, 'Professional stump grinding and cleanup'),
('Tree Health Assessment', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per assessment', 125.00, 'paid', ARRAY['assessment', 'health', 'diagnosis'], 4, 'Professional evaluation of tree health and recommendations'),
('Emergency Tree Service', (SELECT id FROM public.global_categories WHERE name = 'Tree Services'), 'per hour', 150.00, 'paid', ARRAY['emergency', 'storm damage', 'urgent'], 5, '24/7 emergency tree removal and storm damage cleanup');

-- Irrigation (Paid Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Sprinkler Installation', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per zone', 150.00, 'paid', ARRAY['irrigation', 'installation', 'sprinklers'], 1, 'Installation of automatic sprinkler system zones'),
('Drip Irrigation Setup', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per linear foot', 8.00, 'paid', ARRAY['drip', 'irrigation', 'water saving'], 2, 'Water-efficient drip irrigation system installation'),
('Irrigation Repair', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per hour', 75.00, 'paid', ARRAY['repair', 'maintenance', 'troubleshooting'], 3, 'Diagnosis and repair of irrigation system issues'),
('Sprinkler Winterization', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per system', 85.00, 'paid', ARRAY['winterization', 'blowout', 'seasonal'], 4, 'Seasonal winterization and system blowout service'),
('Smart Controller Installation', (SELECT id FROM public.global_categories WHERE name = 'Irrigation'), 'per controller', 200.00, 'paid', ARRAY['smart', 'controller', 'automation'], 5, 'Installation and setup of smart irrigation controllers');

-- Hardscaping (Premium Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Patio Installation', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per sq ft', 12.00, 'premium', ARRAY['patio', 'hardscape', 'installation'], 1, 'Professional patio installation with pavers or stone'),
('Retaining Wall', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per linear foot', 35.00, 'premium', ARRAY['retaining wall', 'structural', 'stone'], 2, 'Construction of decorative and functional retaining walls'),
('Walkway Installation', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per linear foot', 18.00, 'premium', ARRAY['walkway', 'path', 'pavers'], 3, 'Installation of decorative walkways and pathways'),
('Fire Pit Installation', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per installation', 800.00, 'premium', ARRAY['fire pit', 'outdoor living', 'stone'], 4, 'Custom fire pit design and installation'),
('Outdoor Kitchen', (SELECT id FROM public.global_categories WHERE name = 'Hardscaping'), 'per sq ft', 45.00, 'premium', ARRAY['outdoor kitchen', 'cooking', 'entertainment'], 5, 'Complete outdoor kitchen design and construction');

-- Seasonal Services (Free Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Spring Cleanup', (SELECT id FROM public.global_categories WHERE name = 'Seasonal Services'), 'per visit', 120.00, 'free', ARRAY['spring', 'cleanup', 'seasonal'], 1, 'Comprehensive spring property cleanup and preparation'),
('Fall Cleanup', (SELECT id FROM public.global_categories WHERE name = 'Seasonal Services'), 'per visit', 150.00, 'free', ARRAY['fall', 'leaves', 'cleanup'], 2, 'Fall leaf removal and winter preparation services'),
('Leaf Removal', (SELECT id FROM public.global_categories WHERE name = 'Seasonal Services'), 'per bag', 8.00, 'free', ARRAY['leaves', 'removal', 'bagging'], 3, 'Collection and removal of fallen leaves'),
('Gutter Cleaning', (SELECT id FROM public.global_categories WHERE name = 'Seasonal Services'), 'per linear foot', 3.50, 'free', ARRAY['gutters', 'cleaning', 'maintenance'], 4, 'Professional gutter cleaning and debris removal'),
('Holiday Lighting', (SELECT id FROM public.global_categories WHERE name = 'Seasonal Services'), 'per linear foot', 5.00, 'free', ARRAY['holiday', 'lighting', 'decoration'], 5, 'Installation and removal of holiday lighting displays');

-- Fertilization (Free Tier)
INSERT INTO public.global_items (name, category_id, unit, cost, access_tier, tags, sort_order, description) VALUES
('Lawn Fertilization', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per application', 55.00, 'free', ARRAY['fertilizer', 'lawn', 'nutrition'], 1, 'Professional lawn fertilization with quality nutrients'),
('Organic Fertilization', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per application', 75.00, 'free', ARRAY['organic', 'fertilizer', 'eco-friendly'], 2, 'Organic and environmentally friendly fertilization'),
('Soil Testing', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per test', 45.00, 'free', ARRAY['soil', 'testing', 'analysis'], 3, 'Professional soil analysis and pH testing'),
('Lime Application', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per application', 65.00, 'free', ARRAY['lime', 'pH', 'soil treatment'], 4, 'Lime application for soil pH adjustment'),
('Compost Application', (SELECT id FROM public.global_categories WHERE name = 'Fertilization'), 'per cubic yard', 45.00, 'free', ARRAY['compost', 'organic', 'soil improvement'], 5, 'Application of quality compost for soil enhancement');

-- =====================================================
-- ANALYTICS VIEW
-- =====================================================

CREATE VIEW public.global_items_analytics AS
SELECT 
  gi.id,
  gi.name,
  gc.name as category_name,
  gi.access_tier,
  COUNT(ugiu.id) as total_users,
  COUNT(ugiu.id) FILTER (WHERE ugiu.is_favorite = true) as favorite_count,
  AVG(ugiu.usage_count) as avg_usage_count,
  MAX(ugiu.last_used_at) as last_used,
  gi.created_at
FROM public.global_items gi
LEFT JOIN public.global_categories gc ON gi.category_id = gc.id
LEFT JOIN public.user_global_item_usage ugiu ON gi.id = ugiu.global_item_id
WHERE gi.is_active = true
GROUP BY gi.id, gi.name, gc.name, gi.access_tier, gi.created_at;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.global_categories IS 'Shared categories for the global items library with tiered access';
COMMENT ON TABLE public.global_items IS 'Shared catalog of landscaping items and services with suggested pricing';
COMMENT ON TABLE public.user_global_item_usage IS 'User-specific interactions with global items (favorites, usage tracking)';
COMMENT ON FUNCTION public.get_user_tier IS 'Determines user subscription tier for access control';
COMMENT ON FUNCTION public.copy_global_item_to_personal IS 'Copies a global item to user personal library with optional custom pricing';
COMMENT ON FUNCTION public.toggle_global_item_favorite IS 'Toggles favorite status for a global item for the current user';
COMMENT ON VIEW public.global_items_analytics IS 'Analytics view showing usage statistics for global items';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Global Items System created successfully:';
  RAISE NOTICE '- Global categories and items tables with RLS';
  RAISE NOTICE '- User usage tracking with favorites';
  RAISE NOTICE '- Tiered access control (free/paid/premium)';
  RAISE NOTICE '- Helper functions for copying and favorites';
  RAISE NOTICE '- Comprehensive seed data with % categories and % items', 
    (SELECT COUNT(*) FROM public.global_categories),
    (SELECT COUNT(*) FROM public.global_items);
END $$;
