import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Inter, Kalam,Roboto_Mono } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsentProvider } from '@/contexts/cookie-consent-context';
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
        <meta
          httpEquiv="Content-Security-Policy"
          content={`
            default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vercel.live https://va.vercel-scripts.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https: blob:;
            connect-src 'self' https://api.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vitals.vercel-insights.com wss://ws-us3.pusher.com data:;
            frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://hcaptcha.com https://*.hcaptcha.com blob:;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
          `.replace(/\s+/g, ' ').trim()}
        />
      </head>
      <body className={cn('font-sans antialiased', inter.variable, robotoMono.variable, kalam.variable)}>
        <CookieConsentProvider>
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
