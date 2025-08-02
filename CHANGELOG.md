# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-08-02

### 🔧 Fixed

#### Database Schema Compatibility Issue
- **Fixed "Product ID is required" error** that occurred when applying premium tier features
- **Root Cause**: Mismatch between API code expectations and actual database schema
  - API expected `stripe_products.stripe_product_id` column, but table has `id` column
  - API expected `stripe_prices.stripe_price_id` column, but table has `id` column
- **Solution**: Updated API endpoints to use correct column names with compatibility mapping

#### Products API (`/api/admin/stripe-config/products/route.ts`)
- Fixed GET method to map `product.id` as `stripe_product_id` for frontend compatibility
- Fixed POST method to insert into `id` column instead of non-existent `stripe_product_id`
- Fixed PUT method WHERE clause to use `.eq('id', stripe_product_id)`
- Added response field mapping for backward compatibility

#### Prices API (`/api/admin/stripe-config/prices/route.ts`)
- Fixed POST method to insert into `id` column instead of non-existent `stripe_price_id`
- Fixed PUT method WHERE clause to use `.eq('id', stripe_price_id)`
- Added response field mapping for backward compatibility

### 🎯 Impact
- Premium tier features can now be applied without errors
- Database-only mode works correctly for local development
- Pricing management interface functions properly
- No breaking changes to existing functionality

### 🧪 Testing
- All API endpoints return proper responses (401 for unauthorized, not 500 errors)
- Database operations use correct column names
- Field mapping maintains compatibility with frontend code
- Existing products and prices remain intact

---

## Database Schema Reference

### Current Schema (Correct)
```sql
-- Products table
CREATE TABLE stripe_products (
  id TEXT PRIMARY KEY,           -- Stripe product ID
  name TEXT,
  description TEXT,
  active BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Prices table
CREATE TABLE stripe_prices (
  id TEXT PRIMARY KEY,           -- Stripe price ID
  stripe_product_id TEXT,        -- References stripe_products.id
  unit_amount BIGINT,
  currency TEXT,
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### API Compatibility Layer
The API now provides a compatibility layer that maps:
- `stripe_products.id` → `stripe_product_id` in responses
- `stripe_prices.id` → `stripe_price_id` in responses

This ensures the frontend code continues to work without modifications while using the correct database schema.
