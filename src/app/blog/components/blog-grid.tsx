'use client';

import { Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { ProcessedBlogPost } from '@/lib/blog/types';
import { cn } from '@/utils/cn';

import { useBlogFilter } from '../contexts/blog-filter-context';
import { BlogImage } from './blog-image';

interface BlogGridProps {
  posts: ProcessedBlogPost[];
}

export function BlogGrid({ posts }: BlogGridProps) {
  const { searchTerm, selectedCategory } = useBlogFilter();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
      const searchMatch = 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return categoryMatch && searchMatch;
    });
  }, [posts, searchTerm, selectedCategory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pricing':
        return 'text-equipment-yellow';
      case 'operations':
        return 'text-forest-green';
      case 'tools':
        return 'text-charcoal';
      default:
        return 'text-forest-green';
    }
  };

  if (filteredPosts.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center py-20">
            <h3 className="text-3xl md:text-4xl font-black text-charcoal mb-4">
              No Articles Found
            </h3>
            <p className="text-lg text-charcoal/80">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block bg-paper-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 bg-stone-gray/50 overflow-hidden">
                <BlogImage
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {post.featured && (
                  <div className="absolute top-4 left-4 bg-equipment-yellow text-charcoal font-bold px-3 py-1 rounded-full text-sm">
                    Featured
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Category */}
                <p className={cn(
                  "text-sm font-bold uppercase tracking-wide",
                  getCategoryColor(post.category)
                )}>
                  {post.category.replace('-', ' ')}
                </p>
                
                {/* Title */}
                <h3 className="mt-2 text-xl font-bold text-charcoal group-hover:text-equipment-yellow transition-colors leading-tight">
                  {post.title}
                </h3>
                
                {/* Summary - Improved contrast */}
                <p className="mt-3 text-charcoal/90 text-sm leading-relaxed">
                  {post.summary}
                </p>
                
                {/* Meta Information - Improved contrast */}
                <div className="mt-4 flex items-center gap-4 text-xs text-charcoal/70">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}