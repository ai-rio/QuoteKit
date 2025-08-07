'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    id: 'account-responsibilities',
    title: 'Your Account & Responsibilities',
    description: 'Account security, acceptable use, and data ownership'
  },
  {
    id: 'service-limitations',
    title: 'Our Service & Limitations',
    description: 'Service availability, changes, and liability limits'
  },
  {
    id: 'payment-subscription',
    title: 'Payment & Subscription',
    description: 'Free plan, Pro billing, cancellation, and refunds'
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    description: 'Software ownership, your content rights, and trademarks'
  },
  {
    id: 'termination',
    title: 'Termination',
    description: 'How this agreement ends and data retention policies'
  }
];

export function TermsTableOfContents() {
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
          Navigate to any section of our terms of service
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
                  <h3 className="font-semibold text-charcoal/70 group-hover:text-forest-green transition-colors">
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
