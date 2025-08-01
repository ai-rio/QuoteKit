'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import NumberFlow from '@number-flow/react';

const PAYMENT_FREQUENCIES: ('monthly' | 'yearly')[] = ['monthly', 'yearly'];

// Clean 2-tier pricing structure
const TIERS = [
  {
    id: 'free',
    name: 'Free Plan',
    price: {
      monthly: 'Free',
      yearly: 'Free',
    },
    description: 'Perfect for getting started with basic quote management',
    features: [
      'Unlimited quotes',
      'Basic PDF generation',
      'Client management',
      'Item catalog',
      'Community support',
    ],
    cta: 'Get Started Free',
    stripePriceId: 'price_free_monthly',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: {
      monthly: 12,
      yearly: 115.20, // $12*12*0.8 = 20% discount
    },
    description: 'Advanced features for growing businesses',
    features: [
      'Everything in Free',
      'Advanced analytics',
      'Email integration',
      'Quote templates',
      'Priority support',
      'Custom branding',
    ],
    cta: 'Start Pro Plan',
    popular: true,
    stripePriceId: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_annual',
    },
  },
];

const Tab = ({
  text,
  selected,
  setSelected,
  discount = false,
}: {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
  discount?: boolean;
}) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        'text-foreground relative w-fit px-4 py-2 text-sm font-semibold capitalize transition-colors',
        discount && 'flex items-center justify-center gap-2.5',
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <div className="bg-background absolute inset-0 z-0 rounded-full shadow-sm transition-all duration-300" />
      )}
      {discount && (
        <Badge
          className={cn(
            'relative z-10 bg-gray-100 text-xs whitespace-nowrap text-black shadow-none hover:bg-gray-100',
            selected
              ? 'bg-[#F3F4F6] hover:bg-[#F3F4F6]'
              : 'bg-gray-300 hover:bg-gray-300',
          )}
        >
          Save 20%
        </Badge>
      )}
    </button>
  );
};

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.3),rgba(255,255,255,0))]" />
);

const PricingCard = ({
  tier,
  paymentFrequency,
  onSelectPlan,
}: {
  tier: (typeof TIERS)[0];
  paymentFrequency: keyof typeof tier.price;
  onSelectPlan: (stripePriceId: string, planName: string) => void;
}) => {
  const price = tier.price[paymentFrequency];
  let stripePriceId = tier.stripePriceId;
  
  // Handle Pro plan pricing logic
  if (tier.id === 'pro' && typeof stripePriceId === 'object') {
    stripePriceId = stripePriceId[paymentFrequency];
  }

  const isPopular = tier.popular;
  const isFree = tier.id === 'free';

  const handleSelectPlan = () => {
    const finalPriceId = typeof stripePriceId === 'string' ? stripePriceId : stripePriceId;
    
    console.log('💳 FreemiumPricing: Plan selection triggered:', {
      tier_name: tier.name,
      tier_id: tier.id,
      payment_frequency: paymentFrequency,
      stripe_price_id: finalPriceId,
      price: price,
      is_free: isFree
    });
    
    onSelectPlan(finalPriceId, tier.name);
  };

  // Calculate savings for annual plan
  const annualSavings = tier.id === 'pro' && paymentFrequency === 'yearly' 
    ? (12 * 12) - 115.20 // Monthly cost * 12 - Annual cost
    : 0;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-8 overflow-hidden rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow',
        'bg-background text-foreground',
        isPopular && 'ring-2 ring-green-500 ring-offset-2',
      )}
    >
      {isPopular && <PopularBackground />}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {tier.name}
        </h2>
        {isPopular && (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            Most Popular
          </Badge>
        )}
      </div>

      <div className="relative h-16">
        {typeof price === 'number' ? (
          <>
            <div className="flex items-baseline gap-1">
              <NumberFlow
                format={{
                  style: 'currency',
                  currency: 'USD',
                  trailingZeroDisplay: 'stripIfInteger',
                }}
                value={price}
                className="text-4xl font-bold"
              />
              <span className="text-sm text-muted-foreground">
                /{paymentFrequency === 'yearly' ? 'year' : 'month'}
              </span>
            </div>
            {paymentFrequency === 'yearly' && annualSavings > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Save ${annualSavings.toFixed(2)} annually
              </p>
            )}
          </>
        ) : (
          <h1 className="text-4xl font-bold">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">{tier.description}</p>
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center gap-3 text-sm"
            >
              <BadgeCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={handleSelectPlan}
        className={cn(
          'w-full',
          isPopular && 'bg-green-600 hover:bg-green-700',
        )}
        size="lg"
      >
        {tier.cta}
      </Button>
    </div>
  );
};

interface FreemiumPricingProps {
  onSelectPlan: (stripePriceId: string, planName: string) => void;
}

export default function FreemiumPricing({ onSelectPlan }: FreemiumPricingProps) {
  const [selectedPaymentFreq, setSelectedPaymentFreq] = useState<
    'monthly' | 'yearly'
  >(PAYMENT_FREQUENCIES[0]);

  return (
    <section className="flex flex-col items-center gap-10 py-16">
      <div className="space-y-6 text-center max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </div>
        
        <div className="mx-auto flex w-fit rounded-full bg-muted p-1">
          {PAYMENT_FREQUENCIES.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedPaymentFreq === freq}
              setSelected={(text) =>
                setSelectedPaymentFreq(text as 'monthly' | 'yearly')
              }
              discount={freq === 'yearly'}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
        {TIERS.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            paymentFrequency={selectedPaymentFreq}
            onSelectPlan={onSelectPlan}
          />
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required for Free plan.
        </p>
        <p className="text-xs text-muted-foreground">
          Need something custom? <a href="mailto:support@quotekit.com" className="text-primary hover:underline">Contact us</a> for enterprise pricing.
        </p>
      </div>
    </section>
  );
}