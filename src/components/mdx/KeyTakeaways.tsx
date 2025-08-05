'use client';

import { CheckCircle } from 'lucide-react';
import React from 'react';

interface KeyTakeawaysProps {
  items: string[];
  title?: string;
  className?: string;
}

/**
 * KeyTakeaways Component
 * 
 * Displays a highlighted TL;DR section with key points from the article.
 * Optimized for GEO (Generative Engine Optimization) to provide quick,
 * scannable content that AI systems can easily extract and summarize.
 * 
 * Features:
 * - Forest-green styling matching the design system
 * - Bullet points with check icons for visual appeal
 * - Responsive design with proper spacing
 * - Semantic HTML for accessibility and SEO
 * - WCAG AAA compliant colors and typography
 * - Brand-consistent card styling
 * 
 * @param items - Array of key takeaway strings
 * @param title - Optional custom title (defaults to "Key Takeaways")
 * @param className - Optional additional CSS classes
 */
export function KeyTakeaways({ 
  items, 
  title = "Key Takeaways",
  className = "" 
}: KeyTakeawaysProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div 
      className={`
        bg-paper-white 
        rounded-2xl 
        border 
        border-stone-gray/20 
        shadow-lg 
        p-8 
        my-12
        border-l-4 
        border-l-forest-green
        ${className}
      `}
      role="complementary"
      aria-labelledby="key-takeaways-title"
    >
      {/* H3 with proper typography hierarchy: font-bold, responsive sizing */}
      <h3 
        id="key-takeaways-title"
        className="
          text-xl 
          md:text-2xl 
          font-bold 
          text-forest-green 
          mb-6 
          flex 
          items-center 
          gap-3
        "
      >
        <CheckCircle className="w-6 h-6 text-charcoal" aria-hidden="true" />
        {title}
      </h3>
      
      <ul className="space-y-4" role="list">
        {items.map((item, index) => (
          <li 
            key={index}
            className="
              flex 
              items-start 
              gap-4 
              text-lg 
              text-charcoal 
              leading-relaxed
            "
          >
            <CheckCircle 
              className="
                w-5 
                h-5 
                text-forest-green 
                mt-1 
                flex-shrink-0
              " 
              aria-hidden="true"
            />
            <span className="text-lg text-charcoal">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default KeyTakeaways;
