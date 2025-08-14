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
 * Enhanced TableOfContents Component with Accordion/Collapsible UI
 * 
 * Features:
 * - Accordion/collapsible interface for better mobile UX
 * - Auto-responsive: collapsed on mobile, expanded on desktop
 * - Smooth animations and transitions
 * - Active section highlighting and progress tracking
 * - Full accessibility support with keyboard navigation
 * - Auto-collapse after navigation on mobile
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false); // Collapsed by default on mobile
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Determine if we're using sections (legal pages) or headings (blog posts)
  const usingSections = propSections && propSections.length > 0;
  const items = usingSections ? propSections : headings;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-expand on desktop, collapsed on mobile
      if (!mobile) {
        setIsExpanded(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      // Calculate offset for sticky header and padding
      const headerOffset = 120; // Adjust based on your header height
      const elementPosition = element.offsetTop - headerOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });

      // Auto-collapse on mobile after navigation
      if (isMobile) {
        setIsExpanded(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToSection(id);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleToggleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-paper-white border-stone-gray/20 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-forest-green">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-charcoal/70 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Toggle Button - Always visible but more prominent on mobile */}
          <button
            onClick={toggleExpanded}
            onKeyDown={handleToggleKeyDown}
            className={`
              flex items-center justify-center
              w-10 h-10 rounded-lg
              border-2 border-stone-gray/20
              hover:border-forest-green/50
              hover:bg-forest-green/5
              focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-2
              transition-all duration-200
              ${isMobile ? 'bg-forest-green/10' : 'bg-transparent'}
            `}
            aria-label={isExpanded ? 'Collapse table of contents' : 'Expand table of contents'}
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-5 h-5 text-forest-green transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        
        {/* Progress indicator when collapsed */}
        {!isExpanded && activeId && (
          <div className="mt-3 pt-3 border-t border-stone-gray/20">
            <div className="flex items-center gap-2 text-sm text-charcoal/70">
              <div className="w-2 h-2 rounded-full bg-forest-green animate-pulse"></div>
              <span>
                Reading: {items.find(item => item.id === activeId)?.[
                  usingSections ? 'title' : 'text'
                ] || 'Unknown section'}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      {/* Collapsible Content */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <CardContent className="pt-0">
          <nav className="space-y-2" aria-labelledby="toc-title">
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
                    p-3 
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
                      ? 'border-forest-green bg-forest-green/5 shadow-sm scale-[1.02]' 
                      : 'border-stone-gray/20 hover:border-forest-green/30 hover:bg-forest-green/5 hover:scale-[1.01]'
                    }
                    ${isSubheading ? 'ml-4 border-l-4 border-l-forest-green/20' : ''}
                  `}
                  aria-label={`Navigate to ${usingSections ? (item as TOCSection).title : (item as TOCHeading).text}`}
                >
                  <div className="flex items-start space-x-3">
                    {showNumbers && (
                      <span className={`
                        flex-shrink-0 
                        w-7 
                        h-7 
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
                    
                    {/* Active indicator dot */}
                    {!showNumbers && (
                      <div className={`
                        flex-shrink-0 w-2 h-2 rounded-full mt-2 transition-colors
                        ${isActive ? 'bg-forest-green' : 'bg-stone-gray/30 group-hover:bg-forest-green/50'}
                      `} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`
                        font-semibold 
                        transition-colors
                        leading-tight
                        ${isActive 
                          ? 'text-forest-green' 
                          : 'text-charcoal/80 group-hover:text-forest-green'
                        }
                        ${isSubheading ? 'text-sm' : 'text-base'}
                      `}>
                        {usingSections ? (item as TOCSection).title : (item as TOCHeading).text}
                      </h3>
                      {usingSections && (item as TOCSection).description && (
                        <p className="text-sm text-charcoal/60 mt-1 line-clamp-2">
                          {(item as TOCSection).description}
                        </p>
                      )}
                    </div>
                    
                    {/* Navigation arrow */}
                    <div className={`
                      flex-shrink-0 transition-transform duration-200
                      ${isActive ? 'translate-x-1' : 'translate-x-0 group-hover:translate-x-1'}
                    `}>
                      <svg
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-forest-green' : 'text-stone-gray/40 group-hover:text-forest-green'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          
          {/* Footer with reading progress */}
          {enableScrollTracking && !usingSections && (
            <div className="mt-6 pt-4 border-t border-stone-gray/20">
              <div className="flex items-center justify-between text-sm text-charcoal/60">
                <span>{items.length} sections</span>
                <span>
                  {activeId ? 
                    `Section ${items.findIndex(item => item.id === activeId) + 1} of ${items.length}` :
                    'Start reading'
                  }
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 w-full bg-stone-gray/20 rounded-full h-1">
                <div 
                  className="bg-forest-green h-1 rounded-full transition-all duration-300"
                  style={{
                    width: activeId ? 
                      `${((items.findIndex(item => item.id === activeId) + 1) / items.length) * 100}%` :
                      '0%'
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
