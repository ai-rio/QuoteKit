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

    // If no price provided we need to find the right one to render for the product.
    // First check if the product has a price - in the case of our enterprise product, no price is included.
    // We'll return null and handle that case when rendering.
    if (product.prices.length === 0) return null;

    // Next determine if the product is a one time purchase - in these cases it will only have a single price.
    if (product.prices.length === 1) return product.prices[0];

    // Lastly we can assume the product is a subscription one with a month and year price, so we get the price according to the select billingInterval
    return product.prices.find((price) => price.interval === billingInterval);
  }, [billingInterval, price, product.prices]);

  const monthPrice = product.prices.find((price) => price.interval === 'month')?.unit_amount;
  const yearPrice = product.prices.find((price) => price.interval === 'year')?.unit_amount;
  const isBillingIntervalYearly = billingInterval === 'year';
  const metadata = productMetadataSchema.parse(product.metadata);

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
              ${(currentPrice.unit_amount / 100).toFixed(0)}
              <span className="text-base font-normal text-charcoal/60">
                /{currentPrice.interval === 'year' ? 'year' : 'month'}
              </span>
            </div>
            {isBillingIntervalYearly && monthPrice && (
              <div className="text-sm text-charcoal/60 mt-1">
                ${((monthPrice * 12 - currentPrice.unit_amount) / 100).toFixed(0)} saved annually
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

        {/* Features List */}
        {metadata.features && metadata.features.length > 0 && (
          <div className="space-y-3 mb-6 text-left">
            {metadata.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-forest-green rounded-full flex items-center justify-center mt-0.5">
                  <IoCheckmark className="w-3 h-3 text-paper-white" />
                </div>
                <span className="text-sm text-charcoal">{feature}</span>
              </div>
            ))}
          </div>
        )}
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
            Get Started
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
            <a href={`/pricing?price=${currentPrice.id}`}>Get Started</a>
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