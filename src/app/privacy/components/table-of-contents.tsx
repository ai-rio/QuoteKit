'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    description: 'What data we need to make LawnQuote work for you'
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    description: 'Making your life easier, never selling your data'
  },
  {
    id: 'data-security',
    title: 'Data Security',
    description: 'Industry-standard protection for your business data'
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing and Third Parties',
    description: 'Trusted partners only, no selling to advertisers'
  },
  {
    id: 'your-rights',
    title: 'Your Rights and Choices',
    description: 'Full control over your data and privacy preferences'
  }
];

export function TableOfContents() {
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
          Jump to any section to find what you're looking for
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
