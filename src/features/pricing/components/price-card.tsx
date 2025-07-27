'use client';

import { useMemo, useState } from 'react';
import { IoCheckmark } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PriceCardVariant, productMetadataSchema } from '../models/product-metadata';
import { BillingInterval, Price, ProductWithPrices } from '../types';

const WithSexyBorder = ({ children, variant, className }: { children: React.ReactNode; variant: PriceCardVariant; className?: string }) => {
  return <div className={className}>{children}</div>;
};

export function PricingCard({
  product,
  price,
  createCheckoutAction,
}: {
  product: ProductWithPrices;
  price?: Price;
  createCheckoutAction?: ({ price }: { price: Price }) => void;
}) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    price ? (price.interval as BillingInterval) : 'month'
  );

  // Determine the price to render
  const currentPrice = useMemo(() => {
    // If price is passed in we use that one. This is used on the account page when showing the user their current subscription.
    if (price) return price;

    // Safety check: ensure prices array exists and is valid
    const pricesArray = product.prices || [];

    // If no price provided we need to find the right one to render for the product.
    // First check if the product has a price - in the case of our enterprise product, no price is included.
    // We'll return null and handle that case when rendering.
    if (pricesArray.length === 0) return null;

    // For freemium: Include free prices regardless of active status, filter paid prices by active status
    const availablePrices = pricesArray.filter(price => 
      price.unit_amount === 0 || price.active !== false
    );
    
    if (availablePrices.length === 0) {
      console.warn(`No available prices found for product ${product.name}`, { 
        productId: product.stripe_product_id,
        totalPrices: pricesArray.length,
        freePrices: pricesArray.filter(p => p.unit_amount === 0).length,
        inactivePaidPrices: pricesArray.filter(p => p.unit_amount > 0 && p.active === false).map(p => p.stripe_price_id)
      });
      return null;
    }

    // Next determine if the product is a one time purchase - in these cases it will only have a single price.
    if (availablePrices.length === 1) return availablePrices[0];

    // Lastly we can assume the product is a subscription one with a month and year price, so we get the price according to the select billingInterval
    const selectedPrice = availablePrices.find((price) => price.interval === billingInterval);
    
    if (!selectedPrice) {
      console.warn(`No available price found for interval ${billingInterval} on product ${product.name}`);
      // Fallback to first available price if selected interval not available
      return availablePrices[0];
    }
    
    return selectedPrice;
  }, [billingInterval, price, product.prices]);

  const pricesArray = product.prices || [];
  // Use available prices (free + active paid) for month/year calculations
  const availablePrices = pricesArray.filter(price => 
    price.unit_amount === 0 || price.active !== false
  );
  const monthPrice = availablePrices.find((price) => price.interval === 'month')?.unit_amount;
  const yearPrice = availablePrices.find((price) => price.interval === 'year')?.unit_amount;
  const isBillingIntervalYearly = billingInterval === 'year';
  // Handle missing or invalid metadata with safe parsing and defaults
  // Note: stripe_products table doesn't have metadata field, so we use fallback defaults
  const metadataResult = productMetadataSchema.safeParse({});
  const metadata = metadataResult.success 
    ? metadataResult.data 
    : {
        priceCardVariant: 'basic' as const,
        generatedImages: 'enterprise' as const,
        imageEditor: 'basic' as const,
        supportLevel: 'email' as const
      };

  function handleBillingIntervalChange(billingInterval: BillingInterval) {
    setBillingInterval(billingInterval);
  }

  const isPopular = metadata.priceCardVariant === 'pro';

  return (
    <Card className={`relative w-full bg-paper-white border-stone-gray ${isPopular ? 'ring-2 ring-forest-green' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-forest-green text-paper-white px-3 py-1 text-sm font-medium rounded-full">
            Most Popular
          </span>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold text-charcoal">{product.name}</CardTitle>
        {product.description && (
          <CardDescription className="text-charcoal/70">{product.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="text-center pb-6">
        {/* Price Display */}
        {currentPrice ? (
          <div className="mb-6">
            <div className="text-4xl font-bold text-charcoal">
              ${((currentPrice.unit_amount || 0) / 100).toFixed(0)}
              <span className="text-base font-normal text-charcoal/60">
                /{currentPrice.interval === 'year' ? 'year' : 'month'}
              </span>
            </div>
            {isBillingIntervalYearly && monthPrice && (
              <div className="text-sm text-charcoal/60 mt-1">
                ${(((monthPrice || 0) * 12 - (currentPrice.unit_amount || 0)) / 100).toFixed(0)} saved annually
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <div className="text-4xl font-bold text-charcoal">Contact Us</div>
            <div className="text-sm text-charcoal/60 mt-1">Custom pricing available</div>
          </div>
        )}

        {/* Billing Interval Toggle - Only show if both monthly and yearly prices exist and no specific price is provided */}
        {!price && monthPrice && yearPrice && (
          <div className="mb-6">
            <Tabs value={billingInterval} onValueChange={(value) => handleBillingIntervalChange(value as BillingInterval)}>
              <TabsList className="grid grid-cols-2 bg-light-concrete w-full">
                <TabsTrigger 
                  value="month" 
                  className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/70"
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/70"
                >
                  Yearly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Features List - Currently disabled, add features to productMetadataSchema if needed */}
      </CardContent>

      <CardFooter className="pt-0">
        {currentPrice && createCheckoutAction ? (
          <Button
            className={`w-full h-12 font-semibold ${
              isPopular 
                ? 'bg-forest-green text-paper-white hover:bg-forest-green/90' 
                : 'bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90'
            }`}
            onClick={() => createCheckoutAction({ price: currentPrice })}
          >
            {currentPrice.unit_amount === 0 ? 'Start Free Trial' : 'Get Started'}
          </Button>
        ) : currentPrice ? (
          <Button
            className={`w-full h-12 font-semibold ${
              isPopular 
                ? 'bg-forest-green text-paper-white hover:bg-forest-green/90' 
                : 'bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90'
            }`}
            asChild
          >
            <a href={`/pricing?price=${currentPrice.stripe_price_id}`}>Get Started</a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 font-semibold border-stone-gray text-charcoal hover:bg-light-concrete"
          >
            Contact Sales
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}