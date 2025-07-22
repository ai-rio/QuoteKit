# Database Schema

## Overview

The database schema supports all user stories with proper security through Row Level Security (RLS) policies.

## Migration File

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_app_tables.sql

-- Company Settings Table (Story 1.2)
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  logo_url TEXT,
  default_tax_rate NUMERIC(5, 2) DEFAULT 0.00,
  default_markup_rate NUMERIC(5, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own company settings" 
  ON public.company_settings FOR ALL USING (auth.uid() = id);

-- Line Items Table (Story 1.3)
CREATE TABLE public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  cost NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own line items" 
  ON public.line_items FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_line_items_user_id ON public.line_items(user_id);

-- Quotes Table (Stories 1.4 & 1.5)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_contact TEXT,
  quote_data JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_rate NUMERIC(5, 2) NOT NULL,
  markup_rate NUMERIC(5, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own quotes" 
  ON public.quotes FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
```

## Security Model

- **Row Level Security (RLS)** is enabled on all tables
- Each table has policies ensuring users can only access their own data
- All tables cascade delete when a user is removed
- Indexes are created for efficient queries by user_id

## Key Design Decisions

- **JSONB for quote_data**: Flexible storage of quote line items
- **NUMERIC types**: Precise decimal handling for financial calculations  
- **UUID primary keys**: Distributed-system friendly identifiers
- **Timestamps**: Automatic tracking of creation/update times

---

## Epic 2 Database Schema Enhancements

### Epic 2 Migration Files

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_epic_2_enhancements.sql

-- Quote Status Enum (Stories 2.3 & 2.6)
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted');

-- Enhanced Company Settings (Story 2.4)
ALTER TABLE public.company_settings ADD COLUMN company_email TEXT;
ALTER TABLE public.company_settings ADD COLUMN logo_file_name TEXT;
ALTER TABLE public.company_settings ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
ALTER TABLE public.company_settings ADD COLUMN quote_terms TEXT;

-- Enhanced Line Items (Story 2.5)
ALTER TABLE public.line_items ADD COLUMN category TEXT;
ALTER TABLE public.line_items ADD COLUMN tags TEXT[];
ALTER TABLE public.line_items ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.line_items ADD COLUMN last_used_at TIMESTAMPTZ;
ALTER TABLE public.line_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Item Categories Table (Story 2.5)
CREATE TABLE public.item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories" 
  ON public.item_categories FOR ALL USING (auth.uid() = user_id);

-- Enhanced Quotes Table (Stories 2.3 & 2.6)
ALTER TABLE public.quotes ADD COLUMN status quote_status DEFAULT 'draft';
ALTER TABLE public.quotes ADD COLUMN quote_number TEXT;
ALTER TABLE public.quotes ADD COLUMN sent_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN expires_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN follow_up_date TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN notes TEXT;
ALTER TABLE public.quotes ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quotes ADD COLUMN template_name TEXT;
ALTER TABLE public.quotes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Quote Number Sequence
CREATE SEQUENCE quote_number_seq START 1000;

-- Clients Table (Story 2.6)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clients" 
  ON public.clients FOR ALL USING (auth.uid() = user_id);

-- Performance Indexes for Epic 2
CREATE INDEX idx_line_items_search ON public.line_items 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(category, '')));
CREATE INDEX idx_line_items_category ON public.line_items(category);
CREATE INDEX idx_line_items_favorite ON public.line_items(is_favorite) WHERE is_favorite = true;

CREATE INDEX idx_quotes_search ON public.quotes 
  USING gin(to_tsvector('english', client_name || ' ' || COALESCE(notes, '')));
CREATE INDEX idx_quotes_status_date ON public.quotes(status, created_at);
CREATE INDEX idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX idx_quotes_templates ON public.quotes(is_template) WHERE is_template = true;

CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Logo Storage Setup (Story 2.4)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- Storage Policies for Logo Uploads
CREATE POLICY "Users can upload their own logos" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own logos" ON storage.objects 
  FOR SELECT USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logos" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logos" ON storage.objects 
  FOR DELETE USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Epic 2 Functions and Triggers

```sql
-- Auto-generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'Q' || LPAD(nextval('quote_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_number();

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_items_updated_at
  BEFORE UPDATE ON public.line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update last_used_at when items are used in quotes
CREATE OR REPLACE FUNCTION update_item_usage()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Extract item IDs from quote_data JSONB
  FOR item_record IN 
    SELECT DISTINCT (item->>'id')::UUID as item_id
    FROM jsonb_array_elements(NEW.quote_data) as item
    WHERE item->>'id' IS NOT NULL
  LOOP
    UPDATE public.line_items 
    SET last_used_at = NOW()
    WHERE id = item_record.item_id AND user_id = NEW.user_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_item_usage
  AFTER INSERT OR UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_item_usage();
```

## Epic 2 Security Enhancements

### Enhanced RLS Policies

```sql
-- Template access (quotes marked as templates can be viewed by creator)
CREATE POLICY "Users can view quote templates" 
  ON public.quotes FOR SELECT 
  USING (auth.uid() = user_id AND is_template = true);

-- Category management
CREATE POLICY "Users can manage their categories" 
  ON public.item_categories FOR ALL 
  USING (auth.uid() = user_id);

-- Client data protection
CREATE POLICY "Users can manage their clients" 
  ON public.clients FOR ALL 
  USING (auth.uid() = user_id);
```

### Storage Security

- **Logo Upload Restrictions**: Users can only upload to their own folder
- **File Size Limits**: Enforced at application level (max 5MB)
- **File Type Validation**: Only image files (jpg, png, svg) allowed
- **Automatic Cleanup**: Orphaned files cleaned up when settings are deleted

## Epic 2 Performance Optimizations

### Indexing Strategy

- **Full-text search** indexes for quotes and items
- **Composite indexes** for common filter combinations (status + date)
- **Partial indexes** for templates and favorites (space-efficient)
- **GIN indexes** for JSONB and array columns

### Query Optimization

- **Materialized views** for dashboard statistics (future enhancement)
- **Connection pooling** for high-traffic scenarios
- **Query result caching** for frequently accessed data
- **Pagination** for large result sets

## Migration Strategy

1. **Phase 1**: Add new columns with default values (no downtime)
2. **Phase 2**: Create new tables and indexes (minimal impact)  
3. **Phase 3**: Add triggers and functions (brief lock periods)
4. **Phase 4**: Populate existing data with new default values
5. **Phase 5**: Enable new features in application code

All Epic 2 database changes are designed to maintain backward compatibility with Epic 1 functionality.