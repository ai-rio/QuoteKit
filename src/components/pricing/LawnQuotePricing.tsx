'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check } from 'lucide-react';

interface LawnQuotePricingProps {
  onSelectPlan: (stripePriceId: string, planName: string) => void;
}

export default function LawnQuotePricing({ onSelectPlan }: LawnQuotePricingProps) {
  const [isYearly, setIsYearly] = useState(false);

  const monthlyPrice = 12;
  const yearlyDiscount = 0.20;
  const yearlyPriceMonthly = monthlyPrice * (1 - yearlyDiscount);
  const yearlyPriceTotal = yearlyPriceMonthly * 12;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="w-full overflow-x-hidden bg-light-concrete">
      <main>
        {/* Hero Section */}
        <section className="bg-paper-white py-20 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-charcoal leading-tight">
              The Right Plan for Your Business.
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-charcoal/70">
              Start for free and see how it works. Upgrade when you're ready to unlock powerful features and grow your business. Simple, transparent pricing. No surprises.
            </p>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="bg-light-concrete py-20">
          <div className="container mx-auto px-6">
            {/* Cards */}
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
              {/* Free Plan */}
              <div className="bg-paper-white p-8 rounded-2xl border border-stone-gray/20 shadow-lg h-full flex flex-col">
                <h3 className="text-2xl font-bold text-charcoal">Free</h3>
                <p className="mt-2 text-charcoal/70">For new businesses getting started and learning the ropes.</p>
                <p className="mt-6 font-mono text-5xl font-bold text-charcoal">$0</p>
                <Button 
                  onClick={() => onSelectPlan('price_free_monthly', 'Free Plan')}
                  className="mt-8 w-full bg-paper-white text-forest-green border-2 border-forest-green font-bold px-6 py-4 rounded-lg hover:bg-forest-green hover:text-paper-white transition-all duration-200"
                >
                  Start for Free
                </Button>
                <div className="mt-8 border-t border-stone-gray/20 pt-8">
                  <p className="font-bold text-charcoal mb-4">Core features include:</p>
                  <ul className="space-y-3 text-charcoal/80">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-success-green" />
                      5 Quotes / Month
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-success-green" />
                      Unlimited Item Library
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-success-green" />
                      Real-time Quote Calculator
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-success-green" />
                      Professional PDF Generation
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-forest-green text-paper-white p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
                <span className="absolute top-0 right-0 bg-equipment-yellow text-charcoal text-xs font-bold px-4 py-1 rounded-bl-lg">MOST POPULAR</span>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold">Pro</h3>
                    <p className="mt-2 text-stone-gray">For established businesses ready to grow.</p>
                  </div>
                  {/* Toggle */}
                  <div className="flex items-center space-x-3 font-medium text-sm">
                    <span className={`transition-colors ${!isYearly ? 'font-bold text-paper-white' : 'text-stone-gray'}`}>Monthly</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isYearly}
                        onChange={(e) => setIsYearly(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-paper-white/30 rounded-full peer peer-checked:bg-equipment-yellow peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                    <span className={`transition-colors ${isYearly ? 'font-bold text-paper-white' : 'text-stone-gray'}`}>Yearly</span>
                  </div>
                </div>

                <p className="mt-6 font-mono text-5xl font-bold text-equipment-yellow">
                  {formatCurrency(isYearly ? yearlyPriceMonthly : monthlyPrice)}
                  <span className="text-xl text-paper-white/70">/ month</span>
                </p>
                {isYearly && (
                  <p className="text-sm text-stone-gray font-mono mt-1 transition-opacity duration-300">
                    Billed as {formatCurrency(yearlyPriceTotal)} per year
                  </p>
                )}
                <Button 
                  onClick={() => onSelectPlan(
                    isYearly ? 'price_1RoUo5GgBK1ooXYF4nMSQooR' : 'price_1RVyAQGgBK1ooXYF0LokEHtQ', 
                    'Pro Plan'
                  )}
                  className="mt-8 w-full bg-equipment-yellow text-charcoal font-bold px-6 py-4 rounded-lg hover:brightness-110 transition-all duration-200"
                >
                  Upgrade to Pro
                </Button>
                <div className="mt-8 border-t border-paper-white/20 pt-8">
                  <p className="font-bold text-paper-white mb-4">Everything in Free, plus:</p>
                  <ul className="space-y-3 text-stone-gray">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-equipment-yellow" />
                      Unlimited Quotes
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-equipment-yellow" />
                      Remove LawnQuote Branding
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-equipment-yellow" />
                      Client Management
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-equipment-yellow" />
                      Quote Templates
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 mr-3 text-equipment-yellow" />
                      Business Dashboard & Analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-paper-white py-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-charcoal">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border-b border-stone-gray/20 pb-4">
                <AccordionTrigger className="text-left font-bold text-lg text-charcoal hover:no-underline py-2">
                  What happens when I use my 5 free quotes?
                </AccordionTrigger>
                <AccordionContent className="text-charcoal/70 pt-4">
                  Your account remains active and you can still manage your item library and clients. To create more quotes for the month, you'll need to upgrade to the Pro plan. Your limit will reset to 5 quotes on the first of the next month.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-b border-stone-gray/20 pb-4">
                <AccordionTrigger className="text-left font-bold text-lg text-charcoal hover:no-underline py-2">
                  Can I cancel my Pro plan at any time?
                </AccordionTrigger>
                <AccordionContent className="text-charcoal/70 pt-4">
                  Absolutely. You can cancel your subscription from your account settings with a single click. You'll retain access to all Pro features until the end of your current billing period.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-b border-stone-gray/20 pb-4">
                <AccordionTrigger className="text-left font-bold text-lg text-charcoal hover:no-underline py-2">
                  What kind of support is included?
                </AccordionTrigger>
                <AccordionContent className="text-charcoal/70 pt-4">
                  All users have access to our email support. Pro plan users receive priority support, meaning your inquiries will be moved to the front of the queue for faster responses.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
    </div>
  );
}
