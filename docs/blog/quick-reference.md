# **MDX Blog Integration - Quick Reference Guide**

## **Overview**
This guide provides quick access to essential information for developing and maintaining the MDX blog system.

---

## **Key Commands**

### **Development**
```bash
# Start development server
npm run dev

# Create new blog post
npm run blog:new "Your Post Title"

# Validate all content
npm run blog:validate

# Migrate existing posts (one-time)
npm run blog:migrate

# Build for production
npm run build
```

### **Content Management**
```bash
# Create new post manually
touch content/posts/2025/$(date +%m)-your-post-slug.mdx

# Validate specific post
npx tsx scripts/validate-single-post.ts content/posts/2025/01-example.mdx

# Generate content analytics
npm run blog:analytics
```

---

## **File Structure Quick Reference**

```
/content/
├── posts/
│   └── 2025/
│       ├── 01-how-to-price-paver-patio.mdx
│       └── 02-build-client-trust.mdx
├── templates/
│   ├── pricing-post.mdx
│   ├── operations-post.mdx
│   └── tools-post.mdx
└── assets/
    └── images/blog/

/src/
├── lib/blog/
│   ├── content.ts          # Content fetching
│   ├── validation.ts       # Schema validation
│   ├── types.ts           # TypeScript interfaces
│   └── utils.ts           # Helper functions
├── components/mdx/
│   ├── callout.tsx        # <Callout> component
│   ├── code-block.tsx     # <CodeBlock> component
│   └── pricing-calculator.tsx
└── app/blog/
    ├── [slug]/page.tsx    # Dynamic blog post page
    └── page.tsx           # Blog index page

/scripts/
├── create-blog-post.ts    # New post generator
├── migrate-blog-posts.ts  # Migration script
└── validate-content.ts    # Content validation
```

---

## **Frontmatter Template**

### **Standard Post**
```yaml
---
title: "Your Post Title"
slug: "your-post-slug"
category: "pricing" | "operations" | "tools"
author: "Author Name"
publishedAt: "2025-01-15"
summary: "Brief description for SEO and previews"
readTime: 8
image: "https://example.com/image.jpg"
featured: false
draft: false
tags: ["tag1", "tag2"]
seo:
  description: "Custom meta description (optional)"
  keywords: ["keyword1", "keyword2"]
imageAlt: "Image description for accessibility"
---
```

### **Draft Post**
```yaml
---
title: "Draft Post Title"
slug: "draft-post-slug"
category: "pricing"
author: "Author Name"
publishedAt: "2025-02-01"  # Future date
summary: "This is a draft post"
readTime: 5
image: "https://example.com/image.jpg"
draft: true  # Won't appear in production
---
```

---

## **MDX Components Usage**

### **Callout Component**
```mdx
<Callout type="info" title="Pro Tip">
This is an informational callout with a custom title.
</Callout>

<Callout type="warning">
This is a warning without a title.
</Callout>

<Callout type="success" title="Success!">
This indicates something positive.
</Callout>

<Callout type="error" title="Important">
This highlights critical information.
</Callout>
```

### **Code Block Component**
```mdx
<CodeBlock language="typescript" title="Example TypeScript">
interface BlogPost {
  title: string;
  slug: string;
  content: string;
}
</CodeBlock>

<CodeBlock language="bash">
npm install gray-matter next-mdx-remote
</CodeBlock>
```

### **Pricing Calculator**
```mdx
<PricingCalculator 
  basePrice={100}
  factors={[
    { name: "Square Footage", multiplier: 0.5 },
    { name: "Complexity", multiplier: 1.2 }
  ]}
/>
```

---

## **Common Functions**

### **Content Fetching**
```typescript
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog/content';

// Get all published posts
const posts = await getAllPosts();

// Get specific post
const post = await getPostBySlug('how-to-price-paver-patio');

// Get related posts
const related = await getRelatedPosts('current-slug', 3);
```

### **Content Validation**
```typescript
import { BlogPostFrontmatterSchema } from '@/lib/blog/validation';

// Validate frontmatter
try {
  const validData = BlogPostFrontmatterSchema.parse(frontmatter);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

## **Troubleshooting**

### **Common Issues**

#### **Build Fails with "Invalid frontmatter"**
```bash
# Check validation errors
npm run blog:validate

# Common fixes:
# - Ensure all required fields are present
# - Check date format (YYYY-MM-DD)
# - Verify category is one of: pricing, operations, tools
# - Ensure slug contains only lowercase letters, numbers, and hyphens
```

#### **Post Not Appearing**
```bash
# Check if post is marked as draft
grep "draft:" content/posts/2025/your-post.mdx

# Check if publishedAt is in the future
grep "publishedAt:" content/posts/2025/your-post.mdx

# Verify slug is unique
npm run blog:validate
```

#### **MDX Component Not Rendering**
```typescript
// Ensure component is exported in mdx-components.tsx
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    YourComponent,  // Add your component here
    ...components,
  };
}
```

#### **Images Not Loading**
```mdx
<!-- Use absolute URLs for external images -->
image: "https://example.com/image.jpg"

<!-- Or relative paths for local images -->
image: "/images/blog/your-image.jpg"

<!-- Ensure imageAlt is provided for accessibility -->
imageAlt: "Descriptive alt text"
```

### **Performance Issues**

#### **Slow Build Times**
```bash
# Check number of posts
find content/posts -name "*.mdx" | wc -l

# Optimize by implementing caching
# See src/lib/blog/cache.ts for implementation
```

#### **Large Bundle Size**
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer

# Common fixes:
# - Lazy load MDX components
# - Optimize images
# - Remove unused dependencies
```

---

## **Development Workflow**

### **Creating a New Post**
1. **Generate template**: `npm run blog:new "Post Title"`
2. **Edit content**: Open generated `.mdx` file
3. **Add components**: Use available MDX components
4. **Validate**: `npm run blog:validate`
5. **Preview**: `npm run dev` and navigate to post
6. **Publish**: Commit and push to deploy

### **Editing Existing Post**
1. **Find post**: `content/posts/YYYY/MM-slug.mdx`
2. **Edit content**: Modify frontmatter or content
3. **Validate**: `npm run blog:validate`
4. **Test**: Preview changes locally
5. **Deploy**: Commit and push changes

### **Adding New Components**
1. **Create component**: `src/components/mdx/your-component.tsx`
2. **Export in mdx-components**: Add to `useMDXComponents`
3. **Document usage**: Add to this guide
4. **Test**: Use in a test post
5. **Deploy**: Commit changes

---

## **SEO Checklist**

### **Required for Every Post**
- [ ] Unique, descriptive title
- [ ] Compelling summary (150-160 characters)
- [ ] Relevant category and tags
- [ ] High-quality featured image
- [ ] Descriptive image alt text
- [ ] Proper heading structure (H1, H2, H3)
- [ ] Internal links to related posts
- [ ] Appropriate reading time

### **Optional SEO Enhancements**
- [ ] Custom meta description
- [ ] Targeted keywords
- [ ] Schema markup (auto-generated)
- [ ] Social media preview optimization
- [ ] External authoritative links

---

## **Deployment Checklist**

### **Pre-Deployment**
- [ ] All content validates: `npm run blog:validate`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Performance benchmarks met
- [ ] SEO metadata complete

### **Post-Deployment**
- [ ] All URLs accessible
- [ ] Images loading correctly
- [ ] SEO metadata rendering
- [ ] Social media previews working
- [ ] Core Web Vitals maintained

---

## **Emergency Procedures**

### **Rollback Process**
1. **Immediate**: Revert last commit
2. **Verify**: Check site functionality
3. **Investigate**: Identify root cause
4. **Fix**: Apply proper solution
5. **Redeploy**: Test and deploy fix

### **Content Issues**
1. **Identify**: Use validation tools
2. **Isolate**: Test specific posts
3. **Fix**: Correct frontmatter/content
4. **Validate**: Run full validation
5. **Deploy**: Push corrected content

### **Performance Issues**
1. **Monitor**: Check Core Web Vitals
2. **Analyze**: Use performance tools
3. **Optimize**: Apply performance fixes
4. **Test**: Validate improvements
5. **Deploy**: Release optimizations

---

## **Useful Resources**

### **Documentation**
- [MDX Documentation](https://mdxjs.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Gray Matter](https://github.com/jonschlinkert/gray-matter)
- [Zod Validation](https://zod.dev/)

### **Tools**
- [MDX Playground](https://mdxjs.com/playground/)
- [Frontmatter Validator](https://frontmatter.codes/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### **Internal Links**
- [Requirements (MoSCoW)](./requirements-moscow.md)
- [Technical Specification](./technical-specification.md)
- [Implementation Roadmap](./implementation-roadmap.md)
- [MDX Integration Research](./mdx-integration-research.md)

This quick reference guide should be updated as the system evolves and new patterns emerge during development.
