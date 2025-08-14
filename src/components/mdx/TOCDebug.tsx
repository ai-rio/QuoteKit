/**
 * TOC Debug Component
 * Helps debug Table of Contents functionality by showing extracted headings
 * and testing navigation links
 */

'use client';

import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

interface TOCDebugProps {
  headings?: TOCHeading[];
  className?: string;
}

export function TOCDebug({ headings: propHeadings, className = "" }: TOCDebugProps) {
  const [domHeadings, setDomHeadings] = useState<TOCHeading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Extract headings from DOM
  useEffect(() => {
    const extractedHeadings: TOCHeading[] = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach((element) => {
      const level = parseInt(element.tagName.charAt(1));
      const id = element.id;
      const text = element.textContent || '';
      
      if (id && text) {
        extractedHeadings.push({
          id,
          text,
          level
        });
      }
    });
    
    setDomHeadings(extractedHeadings);
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = domHeadings.map(heading => ({
        id: heading.id,
        element: document.getElementById(heading.id)
      })).filter(item => item.element);

      let currentActiveId = '';
      const scrollPosition = window.scrollY + 120;

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
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [domHeadings]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.offsetTop - headerOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Card className={`bg-paper-white border-stone-gray/20 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-forest-green">
          TOC Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prop Headings */}
        <div>
          <h4 className="font-semibold text-charcoal mb-2">
            Prop Headings ({propHeadings?.length || 0})
          </h4>
          {propHeadings && propHeadings.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {propHeadings.map((heading, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-charcoal/60">H{heading.level}:</span>
                  <span className="font-mono text-xs bg-stone-gray/20 px-1 rounded">
                    #{heading.id}
                  </span>
                  <span className="text-charcoal">{heading.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-charcoal/60 text-sm">No prop headings provided</p>
          )}
        </div>

        {/* DOM Headings */}
        <div>
          <h4 className="font-semibold text-charcoal mb-2">
            DOM Headings ({domHeadings.length})
          </h4>
          {domHeadings.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {domHeadings.map((heading, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-charcoal/60">H{heading.level}:</span>
                  <span className="font-mono text-xs bg-stone-gray/20 px-1 rounded">
                    #{heading.id}
                  </span>
                  <button
                    onClick={() => scrollToSection(heading.id)}
                    className={`text-left hover:text-forest-green transition-colors ${
                      activeId === heading.id ? 'text-forest-green font-semibold' : 'text-charcoal'
                    }`}
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-charcoal/60 text-sm">No DOM headings found</p>
          )}
        </div>

        {/* Active Section */}
        <div>
          <h4 className="font-semibold text-charcoal mb-2">Active Section</h4>
          <p className="text-sm">
            {activeId ? (
              <span className="font-mono bg-forest-green/10 text-forest-green px-2 py-1 rounded">
                #{activeId}
              </span>
            ) : (
              <span className="text-charcoal/60">None</span>
            )}
          </p>
        </div>

        {/* Test Navigation */}
        <div>
          <h4 className="font-semibold text-charcoal mb-2">Test Navigation</h4>
          <div className="flex flex-wrap gap-2">
            {domHeadings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToSection(heading.id)}
                className="px-3 py-1 text-xs bg-forest-green/10 text-forest-green rounded hover:bg-forest-green hover:text-paper-white transition-colors"
              >
                Go to {heading.text.substring(0, 20)}...
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
