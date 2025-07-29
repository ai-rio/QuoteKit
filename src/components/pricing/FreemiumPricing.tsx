'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import NumberFlow from '@number-flow/react';

const PAYMENT_FREQUENCIES: ('monthly' | 'yearly')[] = ['monthly', 'yearly'];

// Our freemium pricing tiers
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 'Free',
      yearly: 'Free',
    },
    description: 'Perfect for trying QuoteKit',
    features: [
      'Up to 5 quotes per month',
      'Basic quote templates',
      'Email delivery',
      'Community support',
      'Basic analytics',
    ],
    cta: 'Get Started Free',
    stripePriceId: 'price_free',
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    price: {
      monthly: 12,
      yearly: 12, // Will be overridden for yearly
    },
    description: 'For growing businesses',
    features: [
      'Unlimited quotes',
      'Premium templates',
      'Advanced customization',
      'Priority support',
      'Detailed analytics',
      'Custom branding',
    ],
    cta: 'Start Pro Plan',
    popular: true,
    stripePriceId: {
      monthly: 'price_monthly_1200',
      yearly: 'price_annual_14400',
    },
  },
];

// Calculate yearly price with 20% discount
const getYearlyPrice = (monthlyPrice: number) => {
  return Math.round(monthlyPrice * 12 * 0.8); // 20% discount
};

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
  let price = tier.price[paymentFrequency];
  let stripePriceId = tier.stripePriceId;
  
  // Handle Pro plan pricing logic
  if (tier.id === 'pro-monthly') {
    if (paymentFrequency === 'yearly') {
      price = getYearlyPrice(12);
      stripePriceId = (tier.stripePriceId as any).yearly;
    } else {
      stripePriceId = (tier.stripePriceId as any).monthly;
    }
  }

  const isPopular = tier.popular;

  const handleSelectPlan = () => {
    onSelectPlan(
      typeof stripePriceId === 'string' ? stripePriceId : stripePriceId[paymentFrequency],
      tier.name
    );
  };

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
        <h2 className="text-xl font-semibold capitalize">
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
            {paymentFrequency === 'yearly' && (
              <p className="text-xs text-green-600 font-medium">
                Save $28.80 annually
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
        {TIERS.map((tier, i) => (
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