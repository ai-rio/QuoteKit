-- Story 2.5: Enhanced Item Library Management
-- Add enhanced features for item organization, search, and management

-- Add enhanced columns to line_items table
ALTER TABLE public.line_items ADD COLUMN category TEXT;
ALTER TABLE public.line_items ADD COLUMN tags TEXT[];
ALTER TABLE public.line_items ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.line_items ADD COLUMN last_used_at TIMESTAMPTZ;
ALTER TABLE public.line_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create categories table for organization
CREATE TABLE public.item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for categories
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories" ON public.item_categories FOR ALL USING (auth.uid() = user_id);

-- Add search index for better performance
CREATE INDEX idx_line_items_search ON public.line_items USING gin(to_tsvector('english', name || ' ' || COALESCE(category, '')));

-- Add index for category filtering
CREATE INDEX idx_line_items_category ON public.line_items(user_id, category);

-- Add index for favorites
CREATE INDEX idx_line_items_favorites ON public.line_items(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Add index for recently used items
CREATE INDEX idx_line_items_last_used ON public.line_items(user_id, last_used_at DESC NULLS LAST);

-- Create function to update last_used_at when item is used in a quote
CREATE OR REPLACE FUNCTION update_item_last_used(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.line_items 
  SET last_used_at = NOW() 
  WHERE id = item_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at on line_items
CREATE TRIGGER update_line_items_updated_at
  BEFORE UPDATE ON public.line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update updated_at on item_categories
CREATE TRIGGER update_item_categories_updated_at
  BEFORE UPDATE ON public.item_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for new users
INSERT INTO public.item_categories (user_id, name, color) 
SELECT 
  auth.uid(),
  category_name,
  category_color
FROM (
  VALUES 
    ('Labor', '#2A3D2F'),
    ('Materials', '#F2B705'),
    ('Equipment', '#1C1C1C')
) AS default_categories(category_name, category_color)
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.item_categories WHERE user_id = auth.uid()
);