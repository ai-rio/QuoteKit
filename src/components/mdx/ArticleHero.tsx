'use client';

import React from 'react';
import { Calendar, Clock, User, Tag } from 'lucide-react';
import Image from 'next/image';

interface ArticleHeroProps {
  category: string;
  title: string;
  author: {
    name: string;
    avatar?: string;
    url?: string;
  };
  publishedDate: string;
  readTime: number;
  heroImage?: {
    src: string;
    alt: string;
  };
  className?: string;
}

/**
 * ArticleHero Component
 * 
 * Hero section for blog posts with category badge, title, author info, and metadata.
 * Optimized for SEO with proper heading hierarchy and structured data support.
 * 
 * Features:
 * - Category badge with color coding
 * - Large responsive headline
 * - Author information with avatar
 * - Publication date and read time
 * - Optional hero image
 * - WCAG AAA compliant styling
 * - Proper semantic HTML structure
 * 
 * @param category - Article category (e.g., "PRICING STRATEGY")
 * @param title - Article title
 * @param author - Author information object
 * @param publishedDate - Publication date string
 * @param readTime - Estimated read time in minutes
 * @param heroImage - Optional hero image object
 * @param className - Optional additional CSS classes
 */
export function ArticleHero({ 
  category,
  title,
  author,
  publishedDate,
  readTime,
  heroImage,
  className = "" 
}: ArticleHeroProps) {
  // Category color mapping
  const getCategoryColor = (cat: string) => {
    const normalizedCat = cat.toLowerCase();
    if (normalizedCat.includes('pricing')) return 'bg-equipment-yellow text-charcoal';
    if (normalizedCat.includes('operations')) return 'bg-forest-green text-paper-white';
    if (normalizedCat.includes('tools')) return 'bg-charcoal text-paper-white';
    return 'bg-stone-gray text-charcoal';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <header className={`py-12 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Badge */}
        <div className="mb-6">
          <span className={`
            inline-flex 
            items-center 
            gap-2 
            px-4 
            py-2 
            rounded-lg 
            text-base 
            font-bold 
            uppercase 
            tracking-wide
            ${getCategoryColor(category)}
          `}>
            <Tag className="w-4 h-4" aria-hidden="true" />
            {category}
          </span>
        </div>

        {/* Article Title - H1 with proper typography hierarchy */}
        <h1 className="
          text-4xl 
          md:text-6xl 
          font-black 
          text-forest-green 
          leading-tight 
          mb-8
        ">
          {title}
        </h1>

        {/* Author and Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
          {/* Author Info */}
          <div className="flex items-center gap-4">
            {author.avatar ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={author.avatar}
                  alt={`${author.name} avatar`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="
                w-12 
                h-12 
                rounded-full 
                bg-forest-green 
                flex 
                items-center 
                justify-center
              ">
                <User className="w-6 h-6 text-paper-white" aria-hidden="true" />
              </div>
            )}
            
            <div>
              {author.url ? (
                <a 
                  href={author.url}
                  className="
                    text-lg 
                    font-bold 
                    text-forest-green 
                    hover:text-charcoal 
                    transition-colors 
                    duration-200
                  "
                >
                  {author.name}
                </a>
              ) : (
                <span className="text-lg font-bold text-forest-green">
                  {author.name}
                </span>
              )}
              <div className="text-base text-charcoal/70">
                Author
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 text-base text-charcoal">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-charcoal/70" aria-hidden="true" />
              <time dateTime={publishedDate}>
                {formatDate(publishedDate)}
              </time>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-charcoal/70" aria-hidden="true" />
              <span>
                {readTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {heroImage && (
          <div className="
            relative 
            w-full 
            h-64 
            md:h-96 
            rounded-2xl 
            overflow-hidden 
            shadow-lg
          ">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>
    </header>
  );
}

export default ArticleHero;
