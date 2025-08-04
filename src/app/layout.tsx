import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Inter, Roboto_Mono, Kalam } from 'next/font/google';


import { Toaster } from '@/components/ui/toaster';
import { CookieConsentProvider } from '@/contexts/cookie-consent-context';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';

import '@/styles/globals.css';

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
  description: 'Stop underbidding and start winning jobs. Create professional landscaping quotes in under 5 minutes with LawnQuote. Trusted by contractors nationwide.',
  keywords: 'landscaping quotes, lawn care software, landscaping business, professional estimates, contractor software',
  authors: [{ name: 'LawnQuote' }],
  openGraph: {
    title: 'LawnQuote - Professional Landscaping Quotes in Minutes',
    description: 'Stop underbidding and start winning jobs. Create professional landscaping quotes in under 5 minutes.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LawnQuote - Professional Landscaping Quotes in Minutes',
    description: 'Stop underbidding and start winning jobs. Create professional landscaping quotes in under 5 minutes.',
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
            connect-src 'self' https://api.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vitals.vercel-insights.com wss://ws-us3.pusher.com;
            frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://hcaptcha.com https://*.hcaptcha.com;
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
