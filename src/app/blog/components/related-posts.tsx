import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { BlogPost } from '../data/blog-posts';
import { BlogImage } from './blog-image';
import { cn } from '@/utils/cn';

interface RelatedPostsProps {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <section className="py-20 bg-paper-white">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-charcoal mb-12 text-center">
            Related Articles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block bg-light-concrete rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-stone-gray/50 overflow-hidden">
                  <BlogImage
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  {/* Category */}
                  <p className={cn(
                    "text-sm font-bold uppercase tracking-wide mb-2",
                    getCategoryColor(post.category)
                  )}>
                    {post.category.replace('-', ' ')}
                  </p>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-charcoal group-hover:text-equipment-yellow transition-colors leading-tight mb-3">
                    {post.title}
                  </h3>
                  
                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-xs text-charcoal/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime} min</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* View All Posts Link */}
          <div className="text-center mt-12">
            <Link
              href="/blog"
              className="bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              View All Articles
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
