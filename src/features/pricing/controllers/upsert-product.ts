import Stripe from 'stripe';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';

type StripeProduct = Database['public']['Tables']['stripe_products']['Row'];

export async function upsertProduct(product: Stripe.Product) {
  const productData = {
    id: product.id, // Use Stripe product ID as the database ID
    stripe_product_id: product.id,
    name: product.name,
    description: product.description ?? null,
    active: product.active,
  };

  const { error } = await supabaseAdminClient.from('stripe_products').upsert([productData], {
    onConflict: 'stripe_product_id'
  });

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
}
