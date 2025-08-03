'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    id: 'what-are-cookies',
    title: 'What Are Cookies?',
    description: 'Simple explanation of cookies and how they work'
  },
  {
    id: 'types-of-cookies',
    title: 'Types of Cookies We Use',
    description: 'Essential, functional, analytics, and security cookies'
  },
  {
    id: 'managing-cookies',
    title: 'Managing Your Cookie Preferences',
    description: 'How to control cookies in your browser and on our site'
  },
  {
    id: 'third-party-cookies',
    title: 'Third-Party Cookies',
    description: 'Cookies from our trusted partners and service providers'
  }
];

export function CookieTableOfContents() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <Card className="bg-paper-white border-stone-gray/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-forest-green">
          Table of Contents
        </CardTitle>
        <p className="text-charcoal/70">
          Navigate to any section of our cookie policy
        </p>
      </CardHeader>
      <CardContent>
        <nav className="space-y-3">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full text-left p-4 rounded-lg border border-stone-gray/20 hover:border-forest-green/30 hover:bg-forest-green/5 transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-forest-green/10 text-forest-green font-bold rounded-full flex items-center justify-center text-sm group-hover:bg-forest-green group-hover:text-paper-white transition-colors">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-charcoal group-hover:text-forest-green transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-charcoal/60 mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
