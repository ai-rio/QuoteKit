import type { Metadata } from 'next';
import { AboutPageClient } from './about-page-client';

export const metadata: Metadata = {
  title: 'About LawnQuote - Built for the Trade',
  description: 'Learn the story behind LawnQuote, the professional-grade quoting tool built by landscapers, for landscapers. Discover our mission to help you stop underbidding and start winning jobs.',
  keywords: 'about lawnquote, landscaping software story, professional quoting tool, landscaping business tools',
  openGraph: {
    title: 'About LawnQuote - Built for the Trade',
    description: 'Learn the story behind LawnQuote, the professional-grade quoting tool built by landscapers, for landscapers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About LawnQuote - Built for the Trade',
    description: 'Learn the story behind LawnQuote, the professional-grade quoting tool built by landscapers, for landscapers.',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
