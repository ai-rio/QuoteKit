import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { ContactForm } from './components/contact-form';
import { ContactHero } from './components/contact-hero';

export const metadata: Metadata = {
  title: 'Contact Us - LawnQuote | Get in Touch',
  description: 'Have questions about LawnQuote? Get in touch with our team. We\'re here to help you grow your landscaping business.',
  keywords: 'contact lawnquote, landscaping software support, get help',
};

export default function ContactPage() {
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      
    >
      <div className="min-h-screen bg-light-concrete">
        <ContactHero />
        <ContactForm />
      </div>
    </MarketingLayout>
  );
}
