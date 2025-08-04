'use client';

import { useEffect, useRef } from 'react';

import { DashboardMockup } from './mockups/dashboard-mockup';
import { ItemLibraryMockup } from './mockups/item-library-mockup';
import { ProfessionalPDFMockup } from './mockups/professional-pdf-mockup';
import { QuoteManagementMockup } from './mockups/quote-management-mockup';

export function FeaturesGrid() {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    const currentSections = sectionsRef.current;
    currentSections.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      currentSections.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, []);

  const addToRefs = (el: HTMLDivElement | null, index: number) => {
    sectionsRef.current[index] = el;
  };

  return (
    <section className="bg-light-concrete py-20">
      <div className="container mx-auto px-6 space-y-20">
        {/* Feature 1: Item Library */}
        <div
          ref={(el) => addToRefs(el, 0)}
          className="fade-in-section grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="text-content">
            <span className="font-bold text-forest-green">FEATURE 01</span>
            <h2 className="text-4xl lg:text-5xl font-black text-charcoal mt-2">
              Your Digital Parts Bin.
            </h2>
            <p className="mt-4 text-lg text-charcoal/90">
              Stop guessing material costs or forgetting items. Build your library of services and materials once, and add them to quotes with a single click. No more lost profits from forgotten costs.
            </p>
          </div>
          <div className="mockup-container">
            <ItemLibraryMockup />
          </div>
        </div>

        {/* Feature 2: Quote Management */}
        <div
          ref={(el) => addToRefs(el, 1)}
          className="fade-in-section grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="mockup-container md:order-first">
            <QuoteManagementMockup />
          </div>
          <div className="text-content">
            <span className="font-bold text-forest-green">FEATURE 02</span>
            <h2 className="text-4xl lg:text-5xl font-black text-charcoal mt-2">
              Your Sales Pipeline, Simplified.
            </h2>
            <p className="mt-4 text-lg text-charcoal/90">
              Don&apos;t let leads slip through the cracks. Manage all your quotes in one place. Track what&apos;s been sent, what&apos;s been accepted, and who you need to follow up with. Turn chaos into cashflow.
            </p>
          </div>
        </div>

        {/* Feature 3: Professional PDF */}
        <div
          ref={(el) => addToRefs(el, 2)}
          className="fade-in-section grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="text-content">
            <span className="font-bold text-forest-green">FEATURE 03</span>
            <h2 className="text-4xl lg:text-5xl font-black text-charcoal mt-2">
              Win the Job Before You Start.
            </h2>
            <p className="mt-4 text-lg text-charcoal/90">
              Send polished, professional PDF quotes that build client trust instantly. Your branding, your prices, our professional format. Stop looking like a small operation and start winning bigger jobs.
            </p>
          </div>
          <div className="mockup-container">
            <ProfessionalPDFMockup />
          </div>
        </div>

        {/* Feature 4: Dashboard */}
        <div
          ref={(el) => addToRefs(el, 3)}
          className="fade-in-section grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="mockup-container md:order-first">
            <DashboardMockup />
          </div>
          <div className="text-content">
            <span className="font-bold text-forest-green">FEATURE 04</span>
            <h2 className="text-4xl lg:text-5xl font-black text-charcoal mt-2">
              Know Your Numbers. Grow Your Business.
            </h2>
            <p className="mt-4 text-lg text-charcoal/90">
              The LawnQuote dashboard gives you a real-time overview of your business health. Track revenue, acceptance rates, and performance to make smarter decisions and grow with confidence.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .fade-in-section {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.165, 0.84, 0.44, 1),
                      transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .fade-in-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
