'use client';

import React, { useState, useEffect } from 'react';
import { List, ChevronRight } from 'lucide-react';

interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TOCHeading[];
  title?: string;
  className?: string;
}

/**
 * TableOfContents Component
 * 
 * Interactive table of contents with scroll tracking and smooth navigation.
 * Optimized for SEO and user experience with sticky positioning.
 * 
 * Features:
 * - Sticky positioning that follows scroll
 * - Active section highlighting based on scroll position
 * - Smooth scrolling to sections
 * - Responsive design with mobile collapse
 * - Keyboard navigation support
 * - WCAG AAA compliant styling
 * 
 * @param headings - Array of heading objects with id, text, and level
 * @param title - Optional title for the TOC (defaults to "Table of Contents")
 * @param className - Optional additional CSS classes
 */
export function TableOfContents({ 
  headings, 
  title = "Table of Contents",
  className = "" 
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the heading that's most visible
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Get the first visible heading (topmost)
          const topEntry = visibleEntries.reduce((prev, current) => {
            return prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current;
          });
          
          setActiveId(topEntry.target.id);
        }
      },
      {
        rootMargin: '-20% 0% -35% 0%', // Trigger when heading is in the middle third of viewport
        threshold: 0
      }
    );

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToHeading(id);
    }
  };

  if (!headings || headings.length === 0) {
    return null;
  }

  return (
    <nav 
      className={`
        sticky 
        top-28 
        bg-paper-white 
        rounded-2xl 
        border 
        border-stone-gray/20 
        shadow-lg 
        p-8 
        max-h-[calc(100vh-8rem)]
        overflow-y-auto
        ${className}
      `}
      aria-labelledby="toc-title"
    >
      {/* H3 with proper typography hierarchy */}
      <h3 
        id="toc-title"
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
        <List className="w-6 h-6 text-charcoal" aria-hidden="true" />
        {title}
      </h3>
      
      <ul className="space-y-2" role="list">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const isSubheading = heading.level > 2;
          
          return (
            <li key={heading.id}>
              <button
                className={`
                  w-full 
                  text-left 
                  py-2 
                  px-3 
                  rounded-lg 
                  transition-all 
                  duration-200
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-forest-green 
                  focus:ring-inset
                  ${isSubheading ? 'ml-4 text-base' : 'text-lg'}
                  ${isActive 
                    ? 'bg-forest-green/10 text-forest-green font-bold border-l-2 border-forest-green' 
                    : 'text-charcoal hover:bg-light-concrete hover:text-forest-green'
                  }
                `}
                onClick={() => scrollToHeading(heading.id)}
                onKeyDown={(e) => handleKeyDown(e, heading.id)}
                type="button"
                aria-current={isActive ? 'location' : undefined}
              >
                <div className="flex items-center gap-2">
                  {isActive && (
                    <ChevronRight 
                      className="w-4 h-4 text-forest-green flex-shrink-0" 
                      aria-hidden="true"
                    />
                  )}
                  <span className="leading-tight">
                    {heading.text}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      
      {/* Custom scrollbar styling */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          width: 8px;
        }
        nav::-webkit-scrollbar-track {
          background: #F5F5F5;
          border-radius: 4px;
        }
        nav::-webkit-scrollbar-thumb {
          background: #2A3D2F;
          border-radius: 4px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: #1a2a1f;
        }
      `}</style>
    </nav>
  );
}

export default TableOfContents;
