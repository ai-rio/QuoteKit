'use client'

import React from 'react'
import Link from 'next/link'

import { LawnQuoteLogo } from '@/components/branding/lawn-quote-logo'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/cn'

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'API', href: '/api' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Templates', href: '/templates' },
      { label: 'Community', href: '/community' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  },
]

const socialLinks = [
  {
    label: 'Twitter',
    href: 'https://twitter.com/lawnquote',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/lawnquote',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/lawnquote',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@lawnquote',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
      </svg>
    ),
  },
]

interface MarketingFooterProps {
  className?: string
}

export function MarketingFooter({ className }: MarketingFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn('bg-light-concrete pt-16 pb-8', className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer content */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Company info section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <LawnQuoteLogo 
                className="text-forest-green" 
                width={32} 
                height={32} 
              />
              <span className="text-xl font-bold text-charcoal">LawnQuote</span>
            </div>
            <p className="text-sm text-charcoal/70 max-w-md">
              Professional landscaping quote management software that helps contractors 
              create accurate estimates, manage clients, and grow their business efficiently.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-gray hover:text-forest-green transition-colors duration-200"
                >
                  <span className="sr-only">{social.label}</span>
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation sections */}
          <div className="mt-12 xl:mt-0 xl:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {footerSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-semibold text-charcoal tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="text-sm text-charcoal/70 hover:text-forest-green transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter subscription section */}
        <div className="mt-12 pt-8 border-t border-stone-gray/30">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="xl:col-span-1">
              <h3 className="text-lg font-semibold text-charcoal">
                Stay updated
              </h3>
              <p className="mt-2 text-sm text-charcoal/70">
                Get the latest landscaping business tips and product updates.
              </p>
            </div>
            <div className="mt-6 xl:mt-0 xl:col-span-2">
              <form className="sm:flex sm:max-w-md" aria-label="Newsletter subscription">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="w-full min-w-0 appearance-none rounded-l-md border border-stone-gray/30 bg-paper-white px-4 py-2 text-sm text-charcoal placeholder-charcoal/50 shadow-sm focus:border-forest-green focus:outline-none focus:ring-1 focus:ring-forest-green sm:rounded-r-none"
                  placeholder="Enter your email"
                />
                <div className="mt-3 sm:mt-0 sm:ml-0 sm:flex-shrink-0">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-r-md bg-forest-green px-4 py-2 text-sm font-medium text-paper-white shadow-sm hover:bg-forest-green/90 focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-2 focus:ring-offset-light-concrete transition-colors duration-200 sm:rounded-l-none"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom section with separator */}
        <div className="mt-12">
          <Separator className="bg-stone-gray/30" />
          <div className="mt-8 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <Link
                href="/privacy"
                className="text-sm text-charcoal/70 hover:text-forest-green transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-charcoal/70 hover:text-forest-green transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-charcoal/70 hover:text-forest-green transition-colors duration-200"
              >
                Cookies
              </Link>
            </div>
            <p className="mt-8 text-sm text-charcoal/70 md:order-1 md:mt-0">
              © {currentYear} LawnQuote. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}