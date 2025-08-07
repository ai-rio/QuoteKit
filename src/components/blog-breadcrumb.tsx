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
  );
}
