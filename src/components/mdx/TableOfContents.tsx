'use client';

import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TOCHeading {
  id: string;
  text: string;
  level: number;
  description?: string;
}

interface TOCSection {
  id: string;
  title: string;
  description: string;
}

interface TableOfContentsProps {
  // For blog posts: dynamic headings extracted from DOM
  headings?: TOCHeading[];
  // For legal pages: static predefined sections
  sections?: TOCSection[];
  title?: string;
  subtitle?: string;
  className?: string;
  // Enable scroll tracking for blog posts
  enableScrollTracking?: boolean;
  // Show numbered indicators (legal pages style)
  showNumbers?: boolean;
}

/**
 * Unified TableOfContents Component
 * 
 * Serves both blog posts and legal pages with consistent QuoteKit design system.
 * 
 * Features:
 * - QuoteKit design system styling with proper colors
 * - Supports both dynamic headings (blog) and static sections (legal)
 * - Optional scroll tracking and active section highlighting
 * - Numbered indicators for legal pages
 * - Smooth scrolling navigation
 * - Responsive design and accessibility
 * - Keyboard navigation support
 */
export default function TableOfContents({ 
  headings: propHeadings,
  sections: propSections,
  title = "Table of Contents",
  subtitle,
  className = "",
  enableScrollTracking = true,
  showNumbers = false
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCHeading[]>(propHeadings || []);
  const [activeId, setActiveId] = useState<string>('');

  // Determine if we're using sections (legal pages) or headings (blog posts)
  const usingSections = propSections && propSections.length > 0;
  const items = usingSections ? propSections : headings;

  // Auto-extract headings from DOM if not provided via props and not using sections
  useEffect(() => {
    if (!usingSections && (!propHeadings || propHeadings.length === 0)) {
      const extractedHeadings: TOCHeading[] = [];
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headingElements.forEach((element) => {
        const level = parseInt(element.tagName.charAt(1));
        let id = element.id;
        
        // Generate ID if missing
        if (!id) {
          id = element.textContent
            ?.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim() || '';
          element.id = id;
        }
        
        if (element.textContent && id) {
          extractedHeadings.push({
            id,
            text: element.textContent,
            level
          });
        }
      });
      
      setHeadings(extractedHeadings);
    }
  }, [propHeadings, usingSections]);

  // Track scroll position and update active heading (only for blog posts)
  useEffect(() => {
    if (!enableScrollTracking || usingSections) return;

    const handleScroll = () => {
      const headingElements = headings.map(heading => ({
        id: heading.id,
        element: document.getElementById(heading.id)
      })).filter(item => item.element);

      // Find the current active heading based on scroll position
      let currentActiveId = '';
      const scrollPosition = window.scrollY + 120; // Offset for sticky header

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i].element;
        if (element && element.offsetTop <= scrollPosition) {
          currentActiveId = headingElements[i].id;
          break;
        }
      }

      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Set initial active heading
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, enableScrollTracking, usingSections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToSection(id);
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-paper-white border-stone-gray/20 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-forest-green">
          {title}
        </CardTitle>
        {subtitle && (
          <p className="text-charcoal/70">
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <nav className="space-y-3" aria-labelledby="toc-title">
          {items.map((item, index) => {
            const isActive = enableScrollTracking && activeId === item.id;
            const isSubheading = !usingSections && 'level' in item && item.level > 2;
            
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={`
                  w-full 
                  text-left 
                  p-4 
                  rounded-lg 
                  border 
                  transition-all 
                  duration-200 
                  group
                  focus:outline-none
                  focus:ring-2
                  focus:ring-forest-green
                  focus:ring-offset-2
                  ${isActive 
                    ? 'border-forest-green bg-forest-green/5 shadow-sm' 
                    : 'border-stone-gray/20 hover:border-forest-green/30 hover:bg-forest-green/5'
                  }
                  ${isSubheading ? 'ml-6' : ''}
                `}
                aria-label={`Navigate to ${usingSections ? (item as TOCSection).title : (item as TOCHeading).text}`}
              >
                <div className="flex items-start space-x-3">
                  {showNumbers && (
                    <span className={`
                      flex-shrink-0 
                      w-8 
                      h-8 
                      rounded-full 
                      flex 
                      items-center 
                      justify-center 
                      text-sm 
                      font-bold 
                      transition-colors
                      ${isActive
                        ? 'bg-forest-green text-paper-white'
                        : 'bg-forest-green/10 text-forest-green group-hover:bg-forest-green group-hover:text-paper-white'
                      }
                    `}>
                      {index + 1}
                    </span>
                  )}
                  <div className="flex-1">
                    <h3 className={`
                      font-semibold 
                      transition-colors
                      ${isActive 
                        ? 'text-forest-green' 
                        : 'text-charcoal/70 group-hover:text-forest-green'
                      }
                      ${isSubheading ? 'text-sm' : ''}
                    `}>
                      {usingSections ? (item as TOCSection).title : (item as TOCHeading).text}
                    </h3>
                    {usingSections && (item as TOCSection).description && (
                      <p className="text-sm text-charcoal/80 mt-1">
                        {(item as TOCSection).description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}