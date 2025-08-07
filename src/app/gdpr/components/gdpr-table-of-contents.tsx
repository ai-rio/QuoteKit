'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    id: 'your-gdpr-rights',
    title: 'Your GDPR Rights',
    description: 'Access, rectification, erasure, portability, and more'
  },
  {
    id: 'legal-basis',
    title: 'Legal Basis for Processing',
    description: 'Why and how we process your personal data'
  },
  {
    id: 'data-protection',
    title: 'Data Protection Measures',
    description: 'Technical and organizational safeguards we implement'
  },
  {
    id: 'data-transfers',
    title: 'International Data Transfers',
    description: 'How we handle data transfers outside the EU/EEA'
  },
  {
    id: 'exercising-rights',
    title: 'How to Exercise Your Rights',
    description: 'Practical steps and contact information'
  }
];

export function GdprTableOfContents() {
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
        <p className="text-charcoal">
          Navigate to any section of our GDPR compliance information
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
                  <p className="text-sm text-charcoal/80 mt-1">
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
