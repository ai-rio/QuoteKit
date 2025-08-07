'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { blogPosts } from '@/app/blog/data/blog-posts';
import { Button } from '@/components/ui/button';

// Interactive Quote Sandbox Component
function InteractiveQuoteSandbox() {
  const [quote, setQuote] = useState<Record<string, { id: string; name: string; price: number; qty: number }>>({});
  const [animatingTotal, setAnimatingTotal] = useState(false);

  const libraryItems = [
    { id: 'mow', name: 'Lawn Mowing', price: 65.00 },
    { id: 'mulch', name: 'Mulch Installation', price: 80.00 },
    { id: 'hedge', name: 'Hedge Trimming', price: 50.00 },
    { id: 'aerate', name: 'Core Aeration', price: 150.00 },
  ];

  const taxRate = 0.0825;

  const handleAddItem = (itemId: string) => {
    if (quote[itemId]) {
      setQuote(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], qty: prev[itemId].qty + 1 }
      }));
    } else {
      const libraryItem = libraryItems.find(i => i.id === itemId);
      if (libraryItem) {
        setQuote(prev => ({
          ...prev,
          [itemId]: { ...libraryItem, qty: 1 }
        }));
      }
    }
    
    setAnimatingTotal(true);
    setTimeout(() => setAnimatingTotal(false), 400);
  };

  const subtotal = Object.values(quote).reduce((sum, item) => sum + (item.qty * item.price), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-6xl mx-auto">
      {/* Item Library Panel */}
      <div className="w-full lg:w-64 xl:w-72 bg-paper-white/10 p-4 lg:p-5 rounded-2xl border border-paper-white/20">
        <h3 className="font-bold text-base sm:text-lg text-paper-white mb-4 text-center">Click to Add Items</h3>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
          {libraryItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleAddItem(item.id)}
              className="w-full text-left bg-paper-white/20 text-paper-white p-2 sm:p-3 rounded-lg hover:bg-equipment-yellow hover:text-charcoal transition-all duration-200 font-medium text-sm sm:text-base touch-manipulation"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quote Demo Card */}
      <div className="flex-1 bg-paper-white text-charcoal rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 pb-4 border-b border-stone-gray/30">
          <div className="flex-1">
            <h2 className="font-bold text-lg sm:text-xl lg:text-2xl text-forest-green">Your Company Inc.</h2>
            <p className="text-xs sm:text-sm text-charcoal/60">123 Green St, Meadowville</p>
          </div>
          <div className="text-left sm:text-right">
            <h3 className="font-bold text-base sm:text-lg">QUOTE</h3>
            <p className="font-mono text-xs sm:text-sm text-charcoal/60">#2025-001</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mt-4">
          <div className="space-y-2 min-h-[80px] sm:min-h-[100px]">
            {Object.keys(quote).length === 0 ? (
              <p className="text-center text-charcoal/50 pt-6 sm:pt-8 text-sm sm:text-base">Your quote is empty.</p>
            ) : (
              Object.values(quote).map(item => {
                const itemTotal = item.qty * item.price;
                return (
                  <div key={item.id} className="bg-stone-gray/10 p-3 sm:p-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-3">
                        <p className="font-medium text-sm sm:text-base text-charcoal">{item.name}</p>
                        <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
                          {item.qty} {item.qty === 1 ? 'unit' : 'units'} × {formatCurrency(item.price)} each
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-sm sm:text-base text-forest-green">{formatCurrency(itemTotal)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-stone-gray/30 space-y-1 sm:space-y-2">
          <div className="flex justify-between items-center text-charcoal/80">
            <p className="font-medium text-sm sm:text-base">Subtotal</p>
            <p className="font-mono font-bold text-sm sm:text-base">{formatCurrency(subtotal)}</p>
          </div>
          <div className="flex justify-between items-center text-charcoal/80">
            <p className="font-medium text-sm sm:text-base">Tax (8.25%)</p>
            <p className="font-mono font-bold text-sm sm:text-base">{formatCurrency(tax)}</p>
          </div>
          <div className="flex justify-between items-center text-forest-green text-lg sm:text-xl mt-2">
            <p className="font-bold">Total</p>
            <p className={`font-mono font-bold text-xl sm:text-2xl transition-all duration-400 ${animatingTotal ? 'animate-pulse text-equipment-yellow' : ''}`}>
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pricing Toggle Component
function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false);
  
  const monthlyPrice = 12;
  const yearlyDiscount = 0.20;
  const yearlyPriceMonthly = monthlyPrice * (1 - yearlyDiscount);
  const yearlyPriceTotal = yearlyPriceMonthly * 12;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="text-center">
      {/* Pricing Toggle */}
      <div className="mt-8 sm:mt-10 flex justify-center items-center space-x-3 sm:space-x-4 font-medium">
        <span className={`transition-colors text-sm sm:text-base ${!isYearly ? 'text-paper-white' : 'text-stone-gray'}`}>Monthly</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isYearly}
            onChange={(e) => setIsYearly(e.target.checked)}
          />
          <div className="w-12 h-7 sm:w-14 sm:h-8 bg-paper-white/30 rounded-full peer peer-checked:bg-equipment-yellow peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 sm:after:top-1 after:left-[2px] sm:after:left-[4px] after:bg-white after:border-stone-gray after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
        </label>
        <span className={`transition-colors text-sm sm:text-base ${isYearly ? 'text-paper-white' : 'text-stone-gray'}`}>
          Yearly <span className="bg-equipment-yellow text-charcoal text-xs font-bold px-2 py-1 rounded-full ml-1">Save 20%</span>
        </span>
      </div>

      {/* Pricing Card */}
      <div className="mt-6 sm:mt-8 bg-paper-white/10 p-6 sm:p-8 lg:p-10 rounded-2xl max-w-lg mx-auto border border-paper-white/20">
        <h3 className="text-xl sm:text-2xl font-bold">Pro Plan</h3>
        <p className="mt-2 text-equipment-yellow font-mono text-3xl sm:text-4xl lg:text-5xl font-bold">
          {formatCurrency(isYearly ? yearlyPriceMonthly : monthlyPrice)}
          <span className="text-base sm:text-xl text-paper-white/70">/ month</span>
        </p>
        {isYearly && (
          <p className="text-xs sm:text-sm text-stone-gray font-mono mt-1 opacity-100 transition-opacity duration-300">
            Billed as {formatCurrency(yearlyPriceTotal)} per year
          </p>
        )}
        
        <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-left">
          <li className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-equipment-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm sm:text-base">Unlimited Quotes</span>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-equipment-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm sm:text-base">Professional PDF Branding</span>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-equipment-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm sm:text-base">Save Unlimited Items & Clients</span>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-equipment-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm sm:text-base">Priority Support</span>
          </li>
        </ul>
        <Button asChild className="mt-8 sm:mt-10 w-full bg-equipment-yellow text-charcoal font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-base sm:text-lg">
          <Link href="/signup">Get Started Now</Link>
        </Button>
      </div>
    </div>
  );
}

export default function HomePageClient() {
  // Get the featured blog posts (first 3 posts from the blog data)
  const featuredPosts = blogPosts.slice(0, 3);
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-forest-green text-paper-white min-h-screen flex items-center py-12 sm:py-16 lg:py-20 xl:py-0">
        <div className="w-full">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:gap-12 xl:gap-16 items-center lg:grid-cols-2">
              {/* Left: Text Content */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <h1 className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl leading-tight tracking-tighter text-paper-white">
                  Stop Underbidding.
                  <span className="text-equipment-yellow"> Start Winning Jobs.</span>
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-stone-gray max-w-2xl mx-auto lg:mx-0">
                  Create professional landscaping quotes in under 5 minutes. Ditch the messy spreadsheets, look like a pro, and win the bids you deserve.
                </p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Button asChild className="bg-equipment-yellow text-charcoal font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-base sm:text-lg w-full sm:w-auto">
                    <Link href="/signup">Create Your Free Account</Link>
                  </Button>
                  <Button asChild variant="secondary" className="bg-paper-white/20 text-paper-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-paper-white/30 transition-all duration-200 w-full sm:w-auto">
                    <Link href="#pricing">See Pricing</Link>
                  </Button>
                </div>
                <p className="mt-4 sm:mt-6 text-sm text-stone-gray/70">Free plan with 5 quotes/month. No credit card required.</p>
              </div>

              {/* Right: Interactive Quote Sandbox */}
              <div className="order-1 lg:order-2">
                <InteractiveQuoteSandbox />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-light-concrete">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal">From Messy Notes to Professional Bids.</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-charcoal/70 max-w-2xl mx-auto">Stop looking unprofessional. Start winning clients&apos; trust before the job even begins.</p>
          </div>
          <div className="grid gap-6 sm:gap-8 lg:gap-12 md:grid-cols-2 items-center max-w-6xl mx-auto">
            {/* Before */}
            <div className="bg-paper-white p-4 sm:p-6 rounded-2xl border border-stone-gray shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-error-red/10 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">👎</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-charcoal">The Old Way</h3>
                  <p className="text-sm sm:text-base text-charcoal/60">Inaccurate, unprofessional, and slow.</p>
                </div>
              </div>
              <div className="bg-stone-gray/20 rounded-lg p-3 sm:p-6 flex items-center justify-center">
                {/* Messy Note Mockup */}
                <div className="bg-yellow-50 p-4 sm:p-6 rounded-md shadow-inner border border-yellow-200 w-full max-w-sm font-handwriting text-gray-700 transform -rotate-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Job for Bob</h3>
                  <ul className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-base sm:text-lg">
                    <li>Mow lawn - $50?</li>
                    <li><span className="line-through">2</span> 3 bags mulch - $25/bag</li>
                    <li>Trim hedges - 1 hr? - $45</li>
                  </ul>
                  <div className="mt-4 sm:mt-6 border-t border-dashed border-gray-400 pt-3 sm:pt-4 text-right">
                    <p className="text-sm sm:text-base">Subtotal: $170</p>
                    <p className="text-sm sm:text-base">Tax??</p>
                    <p className="font-bold text-lg sm:text-xl text-red-600">Total: ???</p>
                  </div>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="bg-paper-white p-4 sm:p-6 rounded-2xl border-2 border-forest-green shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success-green/10 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">👍</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-charcoal">The LawnQuote Way</h3>
                  <p className="text-sm sm:text-base text-charcoal/60">Polished, profitable, and fast.</p>
                </div>
              </div>
              <div className="bg-forest-green/5 rounded-lg p-3 sm:p-6 flex items-center justify-center">
                {/* Polished Quote Mockup */}
                <div className="bg-paper-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm border border-stone-gray/20 transform rotate-2">
                  <div className="flex justify-between items-start pb-2 sm:pb-3 border-b border-stone-gray/30">
                    <div>
                      <h2 className="font-sans font-bold text-base sm:text-lg text-forest-green">Your Company Inc.</h2>
                    </div>
                    <div className="text-right">
                      <h3 className="font-sans font-bold text-sm sm:text-base text-charcoal">QUOTE</h3>
                      <p className="font-mono text-xs text-charcoal/60">#2025-042</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                    <div className="grid grid-cols-12 gap-1 sm:gap-2 text-xs sm:text-sm text-charcoal">
                      <div className="col-span-6 font-sans font-medium">Lawn Mowing</div>
                      <div className="col-span-2 text-right font-mono">1</div>
                      <div className="col-span-2 text-right font-mono">$65.00</div>
                      <div className="col-span-2 text-right font-mono font-bold">$65.00</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1 sm:gap-2 text-xs sm:text-sm text-charcoal">
                      <div className="col-span-6 font-sans font-medium">Mulch Installation</div>
                      <div className="col-span-2 text-right font-mono">3</div>
                      <div className="col-span-2 text-right font-mono">$80.00</div>
                      <div className="col-span-2 text-right font-mono font-bold">$240.00</div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-gray/30 space-y-1 text-xs sm:text-sm text-charcoal">
                    <div className="flex justify-between"><p className="font-sans">Subtotal</p><p className="font-mono font-bold">$305.00</p></div>
                    <div className="flex justify-between"><p className="font-sans">Tax (8.25%)</p><p className="font-mono font-bold">$25.16</p></div>
                    <div className="flex justify-between font-bold text-sm sm:text-base lg:text-lg text-forest-green mt-1 sm:mt-2"><p className="font-sans">Total</p><p className="font-mono">$330.16</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="bg-paper-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal">Actionable Advice for Your Business.</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-charcoal/70 max-w-2xl mx-auto">Insights and strategies to help you grow your landscaping company and increase your profits.</p>
          </div>
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {featuredPosts.map((post, index) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`} 
                className={`group block bg-light-concrete rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className="h-40 sm:h-48 bg-stone-gray/50">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm font-bold text-forest-green uppercase">
                    {post.category === 'pricing' && 'PRICING STRATEGY'}
                    {post.category === 'operations' && 'BUSINESS OPERATIONS'}
                    {post.category === 'tools' && 'TOOLBOX TALK'}
                  </p>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-charcoal group-hover:text-equipment-yellow transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 sm:mt-3 text-charcoal/70 text-sm line-clamp-3">
                    {post.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-light-concrete py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal">Built for the Trade.</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-charcoal/70 max-w-3xl mx-auto">
            We&apos;ve seen the discussions on <span className="font-bold text-forest-green">r/landscaping</span> and <span className="font-bold text-forest-green">r/hardscape</span>. We know you&apos;re asking for advice on pricing and client contracts. We built LawnQuote to solve those exact problems.
          </p>
          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <div className="bg-paper-white p-6 sm:p-8 rounded-2xl shadow-sm">
              <p className="text-sm sm:text-base text-charcoal/80 italic">&quot;How much should I charge for a paver patio? I&apos;m worried about underbidding.&quot;</p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base font-bold text-forest-green">- A real question from r/hardscape</p>
            </div>
            <div className="bg-paper-white p-6 sm:p-8 rounded-2xl shadow-sm">
              <p className="text-sm sm:text-base text-charcoal/80 italic">&quot;My quotes are just a list in an email. How can I look more professional to win bigger jobs?&quot;</p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base font-bold text-forest-green">- Inspired by r/landscaping</p>
            </div>
            <div className="bg-paper-white p-6 sm:p-8 rounded-2xl shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm sm:text-base text-charcoal/80 italic">&quot;I spend hours on quotes after working all day. There has to be a faster way.&quot;</p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base font-bold text-forest-green">- The reason we exist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-forest-green text-paper-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-center">A Better ROI Than Any Tool in Your Truck.</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-stone-gray max-w-2xl mx-auto text-center">For just $12 a month, LawnQuote pays for itself the first time you don&apos;t leave money on the table.</p>
          
          <PricingToggle />
        </div>
      </section>
    </div>
  );
}