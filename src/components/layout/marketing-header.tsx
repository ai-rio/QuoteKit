'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { LawnQuoteLogo } from '@/components/branding/lawn-quote-logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/utils/cn'

interface NavigationItem {
  label: string
  href: string
  description?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

const featuresSubmenu: NavigationSection[] = [
  {
    title: 'Core Features',
    items: [
      {
        label: 'Quote Management',
        href: '/features/quotes',
        description: 'Create professional estimates and track quote status'
      },
      {
        label: 'Client Management',
        href: '/features/clients',
        description: 'Organize customer information and project history'
      },
      {
        label: 'Project Tracking',
        href: '/features/projects',
        description: 'Monitor job progress and team assignments'
      },
    ],
  },
  {
    title: 'Business Tools',
    items: [
      {
        label: 'Reporting & Analytics',
        href: '/features/analytics',
        description: 'Track business performance and growth metrics'
      },
      {
        label: 'Team Management',
        href: '/features/team',
        description: 'Manage crew schedules and assign projects'
      },
      {
        label: 'Mobile App',
        href: '/features/mobile',
        description: 'Access your business data on the go'
      },
    ],
  },
]

interface MarketingHeaderProps {
  className?: string
}

export function MarketingHeader({ className }: MarketingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-stone-gray/20 bg-paper-white/95 backdrop-blur-sm transition-all duration-300',
        isScrolled && 'shadow-sm',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <LawnQuoteLogo 
                className="text-forest-green" 
                width={32} 
                height={32} 
              />
              <span className="text-xl font-bold text-charcoal">LawnQuote</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete">
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete">
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Features Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete bg-transparent">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[600px] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {featuresSubmenu.map((section) => (
                        <div key={section.title} className="space-y-3">
                          <h4 className="text-sm font-medium text-charcoal/80 uppercase tracking-wider">
                            {section.title}
                          </h4>
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <Link key={item.label} href={item.href} legacyBehavior passHref>
                                <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-light-concrete hover:text-forest-green focus:bg-light-concrete focus:text-forest-green">
                                  <div className="text-sm font-medium leading-none text-charcoal">
                                    {item.label}
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-charcoal/70">
                                    {item.description}
                                  </p>
                                </NavigationMenuLink>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete">
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete">
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/contact" legacyBehavior passHref>
                  <NavigationMenuLink className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete">
                    Contact
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-charcoal hover:text-forest-green hover:bg-light-concrete"
              asChild
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              variant="sexy"
              size="sm"
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-semibold"
              asChild
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-charcoal hover:text-forest-green hover:bg-light-concrete"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full bg-paper-white sm:max-w-sm">
                <SheetHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <LawnQuoteLogo 
                        className="text-forest-green" 
                        width={28} 
                        height={28} 
                      />
                      <span className="text-lg font-bold text-charcoal">LawnQuote</span>
                    </div>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-charcoal hover:text-forest-green hover:bg-light-concrete"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                {/* Mobile Navigation Links */}
                <div className="mt-8 space-y-6">
                  <nav className="space-y-4">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="block px-4 py-2 text-base font-medium text-charcoal hover:text-forest-green hover:bg-light-concrete rounded-md transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Features Submenu */}
                  <div className="px-4 py-2 border-t border-stone-gray/20">
                    <h3 className="text-sm font-semibold text-charcoal/80 uppercase tracking-wider mb-4">
                      Features
                    </h3>
                    <div className="space-y-4">
                      {featuresSubmenu.map((section) => (
                        <div key={section.title} className="space-y-2">
                          <h4 className="text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                            {section.title}
                          </h4>
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <Link
                                key={item.label}
                                href={item.href}
                                className="block py-2 text-sm text-charcoal hover:text-forest-green transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile CTA Buttons */}
                  <div className="space-y-3 px-4 pt-6 border-t border-stone-gray/20">
                    <Button
                      variant="outline"
                      className="w-full text-charcoal border-stone-gray/30 hover:bg-light-concrete hover:text-forest-green"
                      asChild
                    >
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button
                      variant="sexy"
                      className="w-full bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-semibold"
                      asChild
                    >
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        Start Free Trial
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}