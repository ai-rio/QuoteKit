import '@/styles/globals.css';
import '@/styles/onboarding.css';

import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Inter, Kalam, Roboto_Mono } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { NavigationTracker } from '@/components/tracking/navigation-tracker';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentProvider } from '@/contexts/cookie-consent-context';
import { FormbricksProvider } from '@/libs/formbricks';
import { cn } from '@/utils/cn';

export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

const kalam = Kalam({
  variable: '--font-kalam',
  subsets: ['latin'],
  weight: ['300', '400'],
});

export const metadata: Metadata = {
  title: 'LawnQuote - Professional Landscaping Quotes in Minutes',
  description: 'Create professional landscaping quotes in minutes. LawnQuote helps landscaping contractors streamline their quoting process and grow their business.',
  keywords: 'landscaping quotes, lawn care estimates, landscaping contractor software, landscaping quote generator, professional landscaping quotes',
  authors: [{ name: 'LawnQuote' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'LawnQuote - Professional Landscaping Quotes in Minutes',
    description: 'Create professional landscaping quotes in minutes. Streamline your quoting process and grow your landscaping business.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LawnQuote - Professional Landscaping Quotes in Minutes',
    description: 'Create professional landscaping quotes in minutes. Streamline your quoting process and grow your landscaping business.',
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en'>
      <head>
        {/* Meta tags for SEO and viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={cn('font-sans antialiased', inter.variable, robotoMono.variable, kalam.variable)}>
        <CookieConsentProvider>
          <FormbricksProvider />
          <NavigationTracker />
          <div className='flex min-h-screen flex-col'>
            {children}
          </div>
          <CookieConsentBanner />
          <Toaster />
          <Analytics />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
