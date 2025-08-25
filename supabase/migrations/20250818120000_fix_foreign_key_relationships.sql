-- Fix foreign key relationships between subscriptions and stripe_prices tables
-- This migration ensures all foreign key constraints are properly established

-- First, verify the current state and fix any inconsistencies
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if the correct foreign key constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'subscriptions' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'stripe_price_id'
        AND ccu.table_name = 'stripe_prices'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE 'Foreign key constraint subscriptions.stripe_price_id -> stripe_prices.id is missing, will create it';
        
        -- Drop any existing incorrect constraints
        ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_price_id_fkey;
        ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_price_id_fkey;
        
        -- Add the correct foreign key constraint
        ALTER TABLE public.subscriptions 
        ADD CONSTRAINT subscriptions_stripe_price_id_fkey 
        FOREIGN KEY (stripe_price_id) REFERENCES public.stripe_prices(id);
        
        RAISE NOTICE 'Added foreign key constraint: subscriptions.stripe_price_id -> stripe_prices.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists correctly';
    END IF;
END $$;

-- Also verify and fix the stripe_prices -> stripe_products foreign key
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if the correct foreign key constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'stripe_prices' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'stripe_product_id'
        AND ccu.table_name = 'stripe_products'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE NOTICE 'Foreign key constraint stripe_prices.stripe_product_id -> stripe_products.id is missing, will create it';
        
        -- Drop any existing incorrect constraints
        ALTER TABLE public.stripe_prices DROP CONSTRAINT IF EXISTS prices_product_id_fkey;
        ALTER TABLE public.stripe_prices DROP CONSTRAINT IF EXISTS stripe_prices_product_id_fkey;
        ALTER TABLE public.stripe_prices DROP CONSTRAINT IF EXISTS stripe_prices_stripe_product_id_fkey;
        
        -- Add the correct foreign key constraint
        ALTER TABLE public.stripe_prices 
        ADD CONSTRAINT stripe_prices_stripe_product_id_fkey 
        FOREIGN KEY (stripe_product_id) REFERENCES public.stripe_products(id);
        
        RAISE NOTICE 'Added foreign key constraint: stripe_prices.stripe_product_id -> stripe_products.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists correctly';
    END IF;
END $$;

-- Update any functions that still reference old table names
-- Fix the get_user_tier function to use correct table names
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
      JOIN public.stripe_prices p ON s.stripe_price_id = p.id 
      WHERE s.user_id = get_user_tier.user_id 
      AND s.status = 'active' 
      AND p.id = 'price_premium_plan'
    ) THEN 'premium'
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s 
      JOIN public.stripe_prices p ON s.stripe_price_id = p.id 
      WHERE s.user_id = get_user_tier.user_id 
      AND s.status = 'active' 
      AND p.id != 'price_free_plan'
    ) THEN 'paid'
    ELSE 'free'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the schema is consistent
DO $$
DECLARE
    subscriptions_count INTEGER;
    stripe_prices_count INTEGER;
    stripe_products_count INTEGER;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO subscriptions_count FROM public.subscriptions;
    SELECT COUNT(*) INTO stripe_prices_count FROM public.stripe_prices;  
    SELECT COUNT(*) INTO stripe_products_count FROM public.stripe_products;
    
    RAISE NOTICE 'Schema verification completed:';
    RAISE NOTICE '- Subscriptions: % records', subscriptions_count;
    RAISE NOTICE '- Stripe prices: % records', stripe_prices_count;
    RAISE NOTICE '- Stripe products: % records', stripe_products_count;
    
    -- Check for any orphaned subscriptions
    IF EXISTS (
        SELECT 1 FROM public.subscriptions s 
        LEFT JOIN public.stripe_prices p ON s.stripe_price_id = p.id 
        WHERE p.id IS NULL AND s.stripe_price_id IS NOT NULL
    ) THEN
        RAISE WARNING 'Found orphaned subscriptions with invalid stripe_price_id references';
    ELSE
        RAISE NOTICE '✅ All subscription price references are valid';
    END IF;
    
    -- Check for any orphaned prices
    IF EXISTS (
        SELECT 1 FROM public.stripe_prices p 
        LEFT JOIN public.stripe_products pr ON p.stripe_product_id = pr.id 
        WHERE pr.id IS NULL AND p.stripe_product_id IS NOT NULL
    ) THEN
        RAISE WARNING 'Found orphaned prices with invalid stripe_product_id references';
    ELSE
        RAISE NOTICE '✅ All price product references are valid';
    END IF;
END $$;

-- Update RLS policies to ensure they work with the correct table names
DROP POLICY IF EXISTS "Allow public read-only access." ON public.stripe_products;
CREATE POLICY "Allow public read-only access." ON public.stripe_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access." ON public.stripe_prices;  
CREATE POLICY "Allow public read-only access." ON public.stripe_prices FOR SELECT USING (true);

-- Update realtime publication to ensure it includes the correct tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.stripe_products, public.stripe_prices;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Foreign key relationships fix completed successfully';
END $$;