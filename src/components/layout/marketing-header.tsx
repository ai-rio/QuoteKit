'use client'

import React, { useEffect,useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { LawnQuoteLogo } from '@/components/branding/lawn-quote-logo'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetClose,SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet'
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

              <NavigationMenuItem>
                <Link href="/features" legacyBehavior passHref>
                  <NavigationMenuLink className="text-sm font-medium text-charcoal hover:text-forest-green transition-colors px-3 py-2 rounded-md hover:bg-light-concrete">
                    Features
                  </NavigationMenuLink>
                </Link>
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