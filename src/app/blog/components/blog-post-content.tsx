import { BlogPost } from '../data/blog-posts';

interface BlogPostContentProps {
  post: BlogPost;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  // This would typically come from a CMS or markdown files
  // For now, we'll show sample content based on the post
  const getSampleContent = (post: BlogPost) => {
    if (post.slug === 'how-to-price-a-paver-patio') {
      return (
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-charcoal font-medium leading-relaxed mb-8">
            Pricing a paver patio correctly is the difference between a profitable job and working for free. Here&apos;s the exact formula I use to price every paver project.
          </p>

          <h2 className="text-3xl font-black text-charcoal mt-12 mb-6">The 3-Part Pricing Formula</h2>
          
          <p className="mb-6 text-charcoal leading-relaxed">
            Every profitable paver patio quote has three components: materials, labor, and profit. Miss any one of these, and you&apos;re either losing money or losing jobs.
          </p>

          <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">1. Calculate Your Materials</h3>
          
          <p className="mb-4 text-charcoal leading-relaxed">
            Start with the basics: pavers, sand, gravel, and edge restraints. Here&apos;s my material checklist:
          </p>

          <ul className="list-disc list-inside mb-6 space-y-2 text-charcoal">
            <li><strong className="text-charcoal">Pavers:</strong> Square footage × 1.05 (5% waste factor)</li>
            <li><strong className="text-charcoal">Sand:</strong> 1 ton per 100 square feet</li>
            <li><strong className="text-charcoal">Gravel base:</strong> 1.5 tons per 100 square feet (4&quot; depth)</li>
            <li><strong className="text-charcoal">Edge restraints:</strong> Perimeter + 10% for cuts</li>
          </ul>

          <div className="bg-equipment-yellow/10 border border-equipment-yellow/20 rounded-lg p-6 mb-8">
            <h4 className="font-bold text-charcoal mb-3">Pro Tip:</h4>
            <p className="text-charcoal leading-relaxed">
              Always add a 10-15% markup on materials. This covers delivery, handling, and the inevitable &quot;oops, we need more sand&quot; moments.
            </p>
          </div>

          <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">2. Price Your Labor</h3>
          
          <p className="mb-4 text-charcoal leading-relaxed">
            Labor is where most contractors lose money. You need to account for:
          </p>

          <ul className="list-disc list-inside mb-6 space-y-2 text-charcoal">
            <li>Excavation and site prep</li>
            <li>Base installation and compaction</li>
            <li>Paver installation</li>
            <li>Sand sweeping and compaction</li>
            <li>Cleanup and final inspection</li>
          </ul>

          <p className="mb-6 text-charcoal leading-relaxed">
            For a standard paver patio, budget 8-12 hours per 100 square feet, depending on complexity.
          </p>

          <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">3. Don&apos;t Forget Your Profit</h3>
          
          <p className="mb-6 text-charcoal leading-relaxed">
            This isn&apos;t optional. A 20-30% profit margin is standard for hardscaping work. This covers your overhead, equipment wear, and actually pays you for running a business.
          </p>

          <div className="bg-forest-green/10 border border-forest-green/20 rounded-lg p-6 mb-8">
            <h4 className="font-bold text-charcoal mb-3">Quick Formula:</h4>
            <p className="text-charcoal font-mono text-lg bg-paper-white p-3 rounded border">
              (Materials + Labor) × 1.25 = Your Quote Price
            </p>
          </div>

          <h2 className="text-3xl font-black text-charcoal mt-12 mb-6">Common Pricing Mistakes</h2>
          
          <p className="mb-4 text-charcoal leading-relaxed">
            I&apos;ve seen contractors make these mistakes over and over:
          </p>

          <ul className="list-disc list-inside mb-6 space-y-2 text-charcoal">
            <li><strong className="text-charcoal">Forgetting site conditions:</strong> Slopes, access issues, and soil conditions all affect labor time</li>
            <li><strong className="text-charcoal">Underestimating prep work:</strong> Excavation always takes longer than you think</li>
            <li><strong className="text-charcoal">Racing to the bottom:</strong> Competing only on price is a losing game</li>
          </ul>

          <h2 className="text-3xl font-black text-charcoal mt-12 mb-6">The Bottom Line</h2>
          
          <p className="mb-6 text-charcoal leading-relaxed">
            Pricing isn&apos;t about being the cheapest—it&apos;s about being profitable while delivering value. Use this formula, track your actual costs, and adjust as you learn.
          </p>

          <p className="text-lg font-bold text-charcoal">
            Remember: A quote that doesn&apos;t make you money isn&apos;t worth winning.
          </p>
        </div>
      );
    }

    // Default sample content for other posts
    return (
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-charcoal font-medium leading-relaxed mb-8">
          {post.summary}
        </p>

        <h2 className="text-3xl font-black text-charcoal mt-12 mb-6">Introduction</h2>
        
        <p className="mb-6 text-charcoal leading-relaxed">
          This is sample content for the blog post. In a real implementation, this content would come from a CMS, markdown files, or a database.
        </p>

        <h3 className="text-2xl font-bold text-charcoal mt-8 mb-4">Key Points</h3>
        
        <ul className="list-disc list-inside mb-6 space-y-2 text-charcoal">
          <li>Professional landscaping requires proper planning</li>
          <li>Understanding your costs is crucial for profitability</li>
          <li>Client communication builds trust and repeat business</li>
        </ul>

        <div className="bg-forest-green/10 border border-forest-green/20 rounded-lg p-6 mb-8">
          <h4 className="font-bold text-charcoal mb-3">Pro Tip:</h4>
          <p className="text-charcoal leading-relaxed">
            Always document your processes and learn from each project to improve your business operations.
          </p>
        </div>

        <h2 className="text-3xl font-black text-charcoal mt-12 mb-6">Conclusion</h2>
        
        <p className="mb-6 text-charcoal leading-relaxed">
          Implementing these strategies will help you build a more profitable and sustainable landscaping business.
        </p>
      </div>
    );
  };

  return (
    <section className="py-20 bg-light-concrete">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-paper-white p-8 md:p-12 rounded-2xl shadow-lg border border-stone-gray/20">
          {getSampleContent(post)}
        </div>
      </div>
    </section>
  );
}
