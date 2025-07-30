# QuoteKit Database Schema Analysis & Migration Strategy

## Current Database Schema (After migration 20250728000000)

### Current Stripe Tables Structure

#### 🎯 `customers` table
```sql
- id (uuid, PK, references auth.users)
- stripe_customer_id (text, nullable)
```

#### 🎯 `subscriptions` table  
```sql
- id (text, nullable - used for stripe_subscription_id)
- user_id (uuid, NOT NULL, FK to auth.users)
- status (subscription_status enum)
- metadata (jsonb)
- price_id (text, FK to stripe_prices.stripe_price_id)
- quantity (integer)
- cancel_at_period_end (boolean)
- created (timestamp, NOT NULL, default now())
- current_period_start (timestamp, NOT NULL)
- current_period_end (timestamp, NOT NULL)
- ended_at (timestamp)
- cancel_at (timestamp)
- canceled_at (timestamp)
- trial_start (timestamp)
- trial_end (timestamp)
- updated_at (timestamp, NOT NULL)
- stripe_subscription_id (text, unique when not null)
- stripe_customer_id (text)
- internal_id (uuid, PK, auto-generated)
```

#### 🎯 `stripe_products` table
```sql
- id (uuid, PK, auto-generated)
- stripe_product_id (text, NOT NULL, unique)
- name (text, NOT NULL)
- description (text)
- active (boolean, default true)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

#### 🎯 `stripe_prices` table
```sql
- id (uuid, PK, auto-generated)
- stripe_price_id (text, NOT NULL, unique)
- stripe_product_id (text, NOT NULL, FK)
- unit_amount (integer, NOT NULL)
- currency (text, NOT NULL)
- recurring_interval (text, nullable)
- active (boolean, default true)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

### ⚠️ Schema Issues Identified

1. **Complex subscription table**: Mixed Stripe and internal IDs causing confusion
2. **Missing payment_methods table**: No way to store payment method info for account page
3. **Inconsistent field names**: Some use `created`, others use `created_at`
4. **Missing fields in current tables**: No `recurring_interval_count`, `metadata` not in all tables
5. **Overly complex constraints**: Multiple ID fields causing migration issues

## 🎯 Target Schema (Simplified & Clean)

### 📋 Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   auth.users    │──────▶│ stripe_customers │──────▶│ subscriptions   │
│                 │ 1:1   │                  │ 1:n   │                 │
│ - id (uuid)     │       │ - user_id        │       │ - id            │
│                 │       │ - stripe_cust_id │       │ - user_id       │
└─────────────────┘       │ - email          │       │ - stripe_sub_id │
                          └──────────────────┘       │ - status        │
                                     │                │ - current_period│
                                     │ 1:n            └─────────────────┘
                                     ▼                         │
                          ┌──────────────────┐                │ n:1
                          │ payment_methods  │                ▼
                          │                  │       ┌─────────────────┐
                          │ - id (pm_xxx)    │       │ stripe_prices   │
                          │ - user_id        │       │                 │
                          │ - stripe_cust_id │       │ - stripe_price_id│
                          │ - card_data      │       │ - stripe_prod_id │
                          │ - is_default     │       │ - unit_amount   │
                          └──────────────────┘       └─────────────────┘
                                                              ▲
                                                              │ n:1
                                                              │
                                                    ┌─────────────────┐
                                                    │ stripe_products │
                                                    │                 │
                                                    │ - stripe_prod_id │
                                                    │ - name          │
                                                    │ - description   │
                                                    └─────────────────┘
```

## 🚀 Clean Migration Strategy (No More Guesswork!)

### Phase 1: Add Missing Payment Methods Table (Simple & Safe)
- Add `payment_methods` table without touching existing tables
- This solves the immediate account page issue

### Phase 2: Data Validation & Cleanup (Later)
- Clean up subscription data inconsistencies
- Optionally consolidate tables for better performance

## ✅ Immediate Solution: Just Add Payment Methods

Since the current schema is working (we have subscriptions and pricing), let's just add the missing piece:

```sql
-- Simple addition - no complex migration needed
CREATE TABLE payment_methods (
    id text PRIMARY KEY, -- Stripe payment method ID (pm_...)
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id text REFERENCES customers(stripe_customer_id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'card',
    card_data jsonb,
    is_default boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
```

This approach:
- ✅ No data migration complexity
- ✅ No breaking existing functionality  
- ✅ Solves the immediate payment methods display issue
- ✅ Can be implemented safely in 5 minutes

## 🔄 Migration Plan: Minimal & Safe

1. **Remove the problematic clean migration** (20250729000000)
2. **Add simple payment_methods table migration**
3. **Update webhook handlers** (already done)
4. **Test payment flow**

This gets us working immediately without risking data loss or complex schema changes.