import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BlogPostFrontmatter } from '@/lib/blog/types';

interface BlogPostNavigationProps {
  currentSlug: string;
  allPosts: BlogPostFrontmatter[];
}

export function BlogPostNavigation({ currentSlug, allPosts }: BlogPostNavigationProps) {
  // Sort posts by publication date (newest first) to match blog index order
  const sortedPosts = [...allPosts].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  const currentIndex = sortedPosts.findIndex(post => post.slug === currentSlug);
  const previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  if (!previousPost && !nextPost) {
    return null;
  }

  return (
    <section className="py-12 border-t border-stone-gray/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            {/* Previous Post */}
            {previousPost ? (
              <Link
                href={`/blog/${previousPost.slug}`}
                className="group flex items-center gap-4 p-6 bg-paper-white rounded-2xl border border-stone-gray/20 hover:shadow-lg transition-all duration-300 max-w-sm"
              >
                <ChevronLeft className="w-6 h-6 text-forest-green group-hover:text-equipment-yellow transition-colors" />
                <div>
                  <p className="text-sm text-charcoal/60 mb-1">Previous</p>
                  <h3 className="font-bold text-charcoal group-hover:text-equipment-yellow transition-colors line-clamp-2">
                    {previousPost.title}
                  </h3>
                </div>
              </Link>
            ) : (
              <div></div>
            )}

            {/* Next Post */}
            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group flex items-center gap-4 p-6 bg-paper-white rounded-2xl border border-stone-gray/20 hover:shadow-lg transition-all duration-300 max-w-sm text-right"
              >
                <div>
                  <p className="text-sm text-charcoal/60 mb-1">Next</p>
                  <h3 className="font-bold text-charcoal group-hover:text-equipment-yellow transition-colors line-clamp-2">
                    {nextPost.title}
                  </h3>
                </div>
                <ChevronRight className="w-6 h-6 text-forest-green group-hover:text-equipment-yellow transition-colors" />
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}