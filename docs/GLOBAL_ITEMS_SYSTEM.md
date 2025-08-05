# Global Items System Implementation

## Overview

The Global Items System provides a comprehensive shared catalog of landscaping services and materials that users can browse, favorite, and copy to their personal libraries. This system maintains perfect user isolation while providing a rich, pre-populated database of industry-standard items.

## Architecture

### Database Tables

#### 1. `global_categories`
- **Purpose**: Shared categories for organizing global items
- **Access Control**: Tiered access (free/paid/premium)
- **RLS**: Read-only for all users, admin-only management

```sql
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
```

#### 2. `global_items`
- **Purpose**: Shared catalog of landscaping items with suggested pricing
- **Features**: Categorized, tagged, tiered access, searchable
- **RLS**: Read-only for all users, admin-only management

```sql
CREATE TABLE public.global_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.global_categories(id),
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
```

#### 3. `user_global_item_usage`
- **Purpose**: Track user interactions with global items (favorites, usage)
- **Isolation**: Perfect per-user isolation via RLS
- **Features**: Favorites, usage counting, last used tracking

```sql
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
```

## User Isolation Strategy

### Perfect Data Isolation
1. **Personal Items**: `line_items` table completely isolated per user via RLS
2. **Global Items**: Read-only shared catalog, no user data mixing
3. **User Interactions**: `user_global_item_usage` tracks per-user favorites/usage
4. **RLS Policies**: Enforce user-level access control at database level

### Access Control
```sql
-- Personal items - complete isolation
CREATE POLICY "Users can manage their own line items" 
ON public.line_items FOR ALL USING (auth.uid() = user_id);

-- Global items - read-only shared access
CREATE POLICY "Allow public read-only access to global items" 
ON public.global_items FOR SELECT USING (true);

-- User interactions - isolated per user
CREATE POLICY "Users can manage their own global item usage" 
ON public.user_global_item_usage FOR ALL USING (auth.uid() = user_id);
```

## Key Functions

### 1. `get_user_tier(user_id UUID)`
- Determines user's subscription tier for access control
- Returns: 'free', 'paid', or 'premium'
- Used to filter available global items

### 2. `copy_global_item_to_personal(global_item_id UUID, custom_cost NUMERIC)`
- Copies a global item to user's personal library
- Allows custom pricing override
- Updates usage tracking automatically
- Enforces tier-based access control

### 3. `toggle_global_item_favorite(global_item_id UUID)`
- Toggles favorite status for a global item
- Creates usage record if doesn't exist
- Returns new favorite status

## Seeded Data

### Categories (10 total)
1. **Lawn Care** (Free) - Basic maintenance services
2. **Landscaping** (Free) - Design and installation
3. **Tree Services** (Paid) - Professional tree care
4. **Irrigation** (Paid) - Sprinkler systems
5. **Hardscaping** (Premium) - Patios, walkways
6. **Seasonal Services** (Free) - Cleanup services
7. **Pest Control** (Paid) - Pest management
8. **Fertilization** (Free) - Soil treatment
9. **Snow Services** (Paid) - Winter maintenance
10. **Specialty Services** (Premium) - Unique services

### Items (35+ total)
- **Free Tier**: 20+ basic services (mowing, edging, basic planting)
- **Paid Tier**: 10+ professional services (tree work, irrigation)
- **Premium Tier**: 5+ specialty services (hardscaping, outdoor kitchens)

## Benefits

### For Users
✅ **Quick Setup**: Pre-populated catalog reduces initial setup time
✅ **Industry Standards**: Professional pricing and service descriptions
✅ **Customization**: Copy and modify items to personal needs
✅ **Organization**: Well-categorized and tagged items
✅ **Favorites**: Save frequently used items for quick access

### For Business
✅ **Monetization**: Tiered access encourages subscription upgrades
✅ **User Engagement**: Rich catalog improves user experience
✅ **Analytics**: Track popular items and usage patterns
✅ **Scalability**: Centralized catalog with distributed customization

### Technical
✅ **Perfect Isolation**: No risk of user data mixing
✅ **Performance**: Optimized indexes and queries
✅ **Security**: Row Level Security at database level
✅ **Maintainability**: Centralized catalog management

## Usage Examples

### Frontend Integration
```typescript
// Get global categories
const { data: categories } = await getGlobalCategories();

// Get global items with filtering
const { data: items } = await getGlobalItems({
  category_id: 'category-uuid',
  search: 'lawn mowing'
});

// Copy item to personal library
const newItemId = await copyGlobalItemToPersonal(
  'global-item-uuid',
  50.00 // custom cost
);

// Toggle favorite
const isFavorite = await toggleGlobalItemFavorite('global-item-uuid');
```

### Database Queries
```sql
-- Get user's accessible items
SELECT gi.*, gc.name as category_name
FROM global_items gi
JOIN global_categories gc ON gi.category_id = gc.id
WHERE gi.access_tier = 'free' 
   OR (gi.access_tier = 'paid' AND get_user_tier() IN ('paid', 'premium'))
   OR (gi.access_tier = 'premium' AND get_user_tier() = 'premium');

-- Get user's favorite items
SELECT gi.*, ugiu.usage_count, ugiu.last_used_at
FROM global_items gi
JOIN user_global_item_usage ugiu ON gi.id = ugiu.global_item_id
WHERE ugiu.user_id = auth.uid() AND ugiu.is_favorite = true;
```

## Analytics

### Global Items Analytics View
```sql
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
```

## Future Enhancements

1. **Regional Pricing**: Location-based cost suggestions
2. **User Contributions**: Allow users to suggest new global items
3. **Seasonal Items**: Time-based item availability
4. **Bulk Operations**: Copy multiple items at once
5. **Item Reviews**: User ratings and reviews for global items
6. **Advanced Search**: Full-text search with filters
7. **Import/Export**: Bulk data management tools

## Migration

The system is implemented in migration `20250805021310_create_global_items_system.sql` and includes:
- Table creation with proper indexes
- RLS policies for security
- Helper functions for operations
- Comprehensive seed data
- Analytics views

## Testing

To test the system:
1. Run the migration: `npx supabase db reset`
2. Start the development server: `npm run dev`
3. Navigate to the items library in the UI
4. Test browsing, favoriting, and copying global items
5. Verify user isolation by creating multiple test users

## Conclusion

The Global Items System provides a robust, scalable solution for populating the QuoteKit items library while maintaining perfect user data isolation. The tiered access system creates monetization opportunities, and the comprehensive seed data provides immediate value to new users.
