import { Metadata } from 'next';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { ContactHero } from './components/contact-hero';
import { ContactForm } from './components/contact-form';

export const metadata: Metadata = {
  title: 'Contact Us - LawnQuote',
  description: 'Get in touch with the LawnQuote team. We read every message and love hearing from the landscaping professionals we build for.',
  keywords: 'contact LawnQuote, customer support, landscaping software help, feature requests',
  openGraph: {
    title: 'Contact Us - LawnQuote',
    description: 'Get in touch with the LawnQuote team. We read every message and love hearing from the landscaping professionals we build for.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us - LawnQuote',
    description: 'Get in touch with the LawnQuote team. We read every message and love hearing from the landscaping professionals we build for.',
  },
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <div className="min-h-screen bg-light-concrete">
        <ContactHero />
        <ContactForm />
      </div>
    </MarketingLayout>
  );
}
