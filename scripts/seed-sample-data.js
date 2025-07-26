const { createClient } = require('@supabase/supabase-js');

// Use local Supabase configuration
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function seedSampleData() {
  console.log('🌱 Seeding sample Stripe products and prices...\n');

  try {
    // Insert sample products
    const products = [
      {
        stripe_product_id: 'prod_sample_basic',
        name: 'Basic Plan',
        description: 'Perfect for small businesses starting out',
        active: true
      },
      {
        stripe_product_id: 'prod_sample_professional',
        name: 'Professional Plan', 
        description: 'For growing businesses with advanced needs',
        active: true
      },
      {
        stripe_product_id: 'prod_sample_enterprise',
        name: 'Enterprise Plan',
        description: 'Custom solutions for large organizations',
        active: true
      }
    ];

    console.log('Inserting products...');
    const { error: productsError } = await supabase
      .from('stripe_products')
      .upsert(products, { onConflict: 'stripe_product_id' });

    if (productsError) {
      throw productsError;
    }

    // Insert sample prices
    const prices = [
      // Basic Plan
      { stripe_price_id: 'price_sample_basic_monthly', stripe_product_id: 'prod_sample_basic', unit_amount: 999, currency: 'usd', recurring_interval: 'month', active: true },
      { stripe_price_id: 'price_sample_basic_annual', stripe_product_id: 'prod_sample_basic', unit_amount: 9999, currency: 'usd', recurring_interval: 'year', active: true },
      
      // Professional Plan
      { stripe_price_id: 'price_sample_pro_monthly', stripe_product_id: 'prod_sample_professional', unit_amount: 2999, currency: 'usd', recurring_interval: 'month', active: true },
      { stripe_price_id: 'price_sample_pro_annual', stripe_product_id: 'prod_sample_professional', unit_amount: 29999, currency: 'usd', recurring_interval: 'year', active: true },
      
      // Enterprise Plan
      { stripe_price_id: 'price_sample_enterprise_monthly', stripe_product_id: 'prod_sample_enterprise', unit_amount: 9999, currency: 'usd', recurring_interval: 'month', active: true },
      { stripe_price_id: 'price_sample_enterprise_annual', stripe_product_id: 'prod_sample_enterprise', unit_amount: 99999, currency: 'usd', recurring_interval: 'year', active: true }
    ];

    console.log('Inserting prices...');
    const { error: pricesError } = await supabase
      .from('stripe_prices')
      .upsert(prices, { onConflict: 'stripe_price_id' });

    if (pricesError) {
      throw pricesError;
    }

    // Verify data was inserted
    console.log('\nVerifying inserted data...');
    const { data: products_data, error: queryError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('active', true);
      
    if (queryError) {
      throw queryError;
    }

    const { data: prices_data, error: pricesQueryError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('active', true);

    if (pricesQueryError) {
      throw pricesQueryError;
    }

    console.log('\n✅ Sample data inserted successfully!');
    console.log(`📊 Products: ${products_data.length}`);
    console.log(`💰 Total prices: ${prices_data.length}`);
    
    console.log('\n📦 Sample Products:');
    products_data.forEach(product => {
      const productPrices = prices_data.filter(p => p.stripe_product_id === product.stripe_product_id);
      console.log(`  • ${product.name} (${productPrices.length} prices)`);
    });

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    process.exit(1);
  }
}

seedSampleData();