'use client';

import Link from 'next/link';
import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BlogPost {
  title: string;
  category: string;
  slug: string;
}

interface BlogBreadcrumbProps {
  post?: BlogPost;
  className?: string;
  showHome?: boolean;
}

export function BlogBreadcrumb({ 
  post, 
  className = "container mx-auto px-4 py-4",
  showHome = true 
}: BlogBreadcrumbProps) {
  const breadcrumbItems = [];

  if (showHome) {
    breadcrumbItems.push({ label: 'Home', href: '/' });
  }

  breadcrumbItems.push({ label: 'Blog', href: '/blog' });

  if (post) {
    // Add category as intermediate breadcrumb if it's meaningful
    if (post.category && post.category !== 'General') {
      breadcrumbItems.push({ 
        label: post.category, 
        href: `/blog?category=${encodeURIComponent(post.category.toLowerCase())}` 
      });
    }
    
    // Add current post as final breadcrumb (no link)
    breadcrumbItems.push({ label: post.title });
  }

  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList className="flex flex-wrap items-center gap-1.5 break-words text-lg text-charcoal sm:gap-2.5">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={item.href}
                      className="transition-colors hover:text-forest-green font-medium text-lg text-charcoal"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-bold text-lg text-forest-green">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator className="[&>svg]:size-3.5 text-charcoal" />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
