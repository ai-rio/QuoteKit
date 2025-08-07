'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProviderProps {
  children?: React.ReactNode;
  customItems?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

// Define route mappings for better UX labels
const routeLabels: Record<string, string> = {
  '': 'Home',
  'blog': 'Blog',
  'about': 'About',
  'features': 'Features',
  'pricing': 'Pricing',
  'contact': 'Contact',
  'privacy': 'Privacy Policy',
  'terms': 'Terms of Service',
  'cookies': 'Cookie Policy',
  'gdpr': 'GDPR Compliance',
};

// Define route hierarchies for logical breadcrumb paths
const routeHierarchies: Record<string, string[]> = {
  '/blog': ['', 'blog'],
  '/about': ['', 'about'],
  '/features': ['', 'features'],
  '/pricing': ['', 'pricing'],
  '/contact': ['', 'contact'],
  '/privacy': ['', 'privacy'],
  '/terms': ['', 'terms'],
  '/cookies': ['', 'cookies'],
  '/gdpr': ['', 'gdpr'],
};

export function BreadcrumbProvider({ 
  children, 
  customItems, 
  showHome = true, 
  className = "container mx-auto px-4 py-4" 
}: BreadcrumbProviderProps) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on home page
  if (pathname === '/') {
    return <>{children}</>;
  }

  // Generate breadcrumb items
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return showHome ? [{ label: 'Home', href: '/' }, ...customItems] : customItems;
    }

    const items: BreadcrumbItem[] = [];
    
    if (showHome) {
      items.push({ label: 'Home', href: '/' });
    }

    // Handle blog post pages
    if (pathname.startsWith('/blog/') && pathname !== '/blog') {
      items.push({ label: 'Blog', href: '/blog' });
      // For blog posts, we'll add the post title as the final breadcrumb
      // This will be handled by the individual blog post pages
      return items;
    }

    // Handle other routes using hierarchy mapping
    const hierarchy = routeHierarchies[pathname];
    if (hierarchy) {
      hierarchy.forEach((segment, index) => {
        if (segment === '' && showHome) return; // Skip empty segment if home already added
        
        const label = routeLabels[segment] || segment;
        const href = index === hierarchy.length - 1 ? undefined : `/${segment}`;
        
        items.push({ label, href });
      });
    } else {
      // Fallback: generate from pathname segments
      const segments = pathname.split('/').filter(Boolean);
      segments.forEach((segment, index) => {
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const href = index === segments.length - 1 ? undefined : `/${segments.slice(0, index + 1).join('/')}`;
        
        items.push({ label, href });
      });
    }

    return items;
  };

  const breadcrumbItems = generateBreadcrumbs();

  // Don't render if only one item (just Home)
  if (breadcrumbItems.length <= 1) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={className}>
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {children}
    </>
  );
}
