import Link from 'next/link';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { BlogPost } from '../data/blog-posts';
import { BlogImage } from './blog-image';
import { cn } from '@/utils/cn';

interface BlogPostHeaderProps {
  post: BlogPost;
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
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
        return 'text-equipment-yellow bg-equipment-yellow/10 border-equipment-yellow/20';
      case 'operations':
        return 'text-forest-green bg-forest-green/10 border-forest-green/20';
      case 'tools':
        return 'text-charcoal bg-charcoal/10 border-charcoal/20';
      default:
        return 'text-forest-green bg-forest-green/10 border-forest-green/20';
    }
  };

  return (
    <section className="bg-paper-white">
      {/* Back to Blog Link */}
      <div className="container mx-auto px-6 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-forest-green hover:text-equipment-yellow font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Category Badge */}
          <div className={cn(
            "inline-flex items-center px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide border mb-6",
            getCategoryColor(post.category)
          )}>
            {post.category.replace('-', ' ')}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black text-charcoal leading-tight mb-6">
            {post.title}
          </h1>

          {/* Summary - Improved contrast */}
          <p className="text-lg md:text-xl text-charcoal/90 mb-8 leading-relaxed font-medium">
            {post.summary}
          </p>

          {/* Meta Information - Improved contrast */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-charcoal/80 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden">
            <BlogImage
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
