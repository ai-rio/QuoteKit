'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
  title?: string;
  className?: string;
  allowMultipleOpen?: boolean;
}

/**
 * FAQAccordion Component
 * 
 * Interactive FAQ section with structured data integration for SEO.
 * Optimized for Google FAQ rich snippets and GEO consumption.
 * 
 * Features:
 * - Expandable/collapsible sections with smooth animations
 * - Single or multiple item expansion modes
 * - Structured data ready (JSON-LD integration handled by parent)
 * - Keyboard navigation support
 * - Screen reader friendly with proper ARIA attributes
 * - Mobile-responsive design
 * - WCAG AAA compliant colors and typography
 * 
 * @param faqs - Array of FAQ items with question and answer
 * @param title - Optional section title (defaults to "Frequently Asked Questions")
 * @param className - Optional additional CSS classes
 * @param allowMultipleOpen - Whether multiple items can be open simultaneously
 */
export function FAQAccordion({ 
  faqs, 
  title = "Frequently Asked Questions",
  className = "",
  allowMultipleOpen = false
}: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(index)) {
        // Close the item
        newSet.delete(index);
      } else {
        // Open the item
        if (!allowMultipleOpen) {
          // Close all other items if single-open mode
          newSet.clear();
        }
        newSet.add(index);
      }
      
      return newSet;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleItem(index);
    }
  };

  return (
    <section 
      className={`my-12 ${className}`}
      aria-labelledby="faq-title"
    >
      {/* H2 with proper typography hierarchy: font-black, responsive sizing */}
      <h2 
        id="faq-title"
        className="
          text-3xl 
          md:text-4xl 
          font-black 
          text-forest-green 
          mb-8 
          flex 
          items-center 
          gap-3
        "
      >
        <HelpCircle className="w-8 h-8 text-charcoal" aria-hidden="true" />
        {title}
      </h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openItems.has(index);
          
          return (
            <div 
              key={index}
              className="
                bg-paper-white 
                rounded-2xl 
                border 
                border-stone-gray/20 
                shadow-lg 
                overflow-hidden
                transition-all 
                duration-200 
                hover:border-forest-green/30
              "
            >
              <button
                className="
                  w-full 
                  p-8 
                  text-left 
                  bg-light-concrete 
                  hover:bg-forest-green/5
                  transition-colors 
                  duration-200
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-forest-green 
                  focus:ring-inset
                "
                onClick={() => toggleItem(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                type="button"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* H3 with proper typography: font-bold, responsive sizing */}
                  <h3 className="
                    text-xl 
                    md:text-2xl 
                    font-bold 
                    text-forest-green 
                    leading-tight
                    text-left
                  ">
                    {faq.question}
                  </h3>
                  
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <ChevronUp 
                        className="w-6 h-6 text-charcoal" 
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown 
                        className="w-6 h-6 text-charcoal" 
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              </button>
              
              <div
                id={`faq-answer-${index}`}
                className={`
                  overflow-hidden 
                  transition-all 
                  duration-300 
                  ease-in-out
                  ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
                aria-hidden={!isOpen}
              >
                <div className="p-8 bg-paper-white">
                  {/* Body text with proper size and color: text-lg text-charcoal */}
                  <div 
                    className="
                      text-lg 
                      text-charcoal 
                      leading-relaxed
                      prose 
                      prose-lg 
                      max-w-none
                      prose-headings:text-forest-green
                      prose-headings:font-bold
                      prose-p:text-charcoal
                      prose-p:text-lg
                      prose-strong:text-charcoal
                      prose-strong:font-bold
                    "
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FAQAccordion;
