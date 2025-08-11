# **MDX Blog System - Troubleshooting Guide**

## **Quick Diagnostics**

### **First Steps for Any Issue**
```bash
# 1. Validate content integrity
npm run blog:validate

# 2. Check SEO optimization
npm run blog:validate-seo  

# 3. Run essential tests
npm run blog:test-essential

# 4. Check performance
npm run blog:perf-test
```

### **Common Issue Categories**
- **Content Issues**: Posts not appearing, validation errors
- **Build Issues**: Compilation failures, TypeScript errors
- **Performance Issues**: Slow loading, cache problems
- **SEO Issues**: Missing metadata, structured data problems
- **Component Issues**: MDX components not rendering

## **Content Issues**

### **Posts Not Appearing**

#### **Symptom**: Blog post created but not visible on site
**Diagnostic Steps:**
```bash
# Check if post is marked as draft
grep -r "draft: true" content/posts/

# Check publication date
grep -r "publishedAt:" content/posts/ | grep "$(date +%Y-%m-%d)"

# Verify content validation
npm run blog:validate
```

**Common Causes & Solutions:**

1. **Draft Status**
   ```yaml
   # Problem: Post marked as draft
   draft: true
   
   # Solution: Change to false or remove line
   draft: false
   ```

2. **Future Publication Date**
   ```yaml
   # Problem: Future date
   publishedAt: "2025-12-31"
   
   # Solution: Use current or past date
   publishedAt: "2025-01-15"
   ```

3. **Invalid Slug**
   ```yaml
   # Problem: Invalid characters
   slug: "My Post Title!"
   
   # Solution: Use only lowercase letters, numbers, hyphens
   slug: "my-post-title"
   ```

### **Content Validation Errors**

#### **Symptom**: `npm run blog:validate` shows errors
**Error Examples & Solutions:**

```bash
# Error: Missing required field
❌ Error in 01-example-post.mdx: Required field 'summary' is missing

# Solution: Add missing field to frontmatter
summary: "Your post summary here (50-300 characters)"
```

```bash
# Error: Invalid category
❌ Error in 02-example-post.mdx: Invalid category 'landscaping'

# Solution: Use valid categories only
category: "pricing"  # or "operations" or "tools"
```

```bash
# Error: Slug too long
❌ Error in 03-example-post.mdx: Slug exceeds 50 characters

# Solution: Shorten slug
slug: "short-descriptive-slug"  # Keep under 50 characters
```

```bash
# Error: Invalid date format
❌ Error in 04-example-post.mdx: Invalid date format

# Solution: Use YYYY-MM-DD format
publishedAt: "2025-01-15"  # Must be in this exact format
```

### **Duplicate Slug Errors**

#### **Symptom**: Two posts have the same slug
```bash
# Diagnostic
npm run blog:validate
# Output: ❌ Duplicate slug found: "example-post"
```

**Solution:**
1. Find duplicate files:
   ```bash
   grep -r "slug: \"example-post\"" content/posts/
   ```
2. Change one of the slugs to be unique
3. Update any internal links referencing the changed slug

### **Image Display Issues**

#### **Symptom**: Images not loading or displaying incorrectly
**Diagnostic Steps:**
```bash
# Check image URLs in frontmatter
grep -r "image:" content/posts/

# Common issues:
# - Invalid URLs
# - Missing imageAlt text
# - Broken image links
```

**Solutions:**
1. **Invalid URL Format**
   ```yaml
   # Problem: Not a valid URL
   image: "broken-link.jpg"
   
   # Solution: Use full HTTPS URL
   image: "https://images.unsplash.com/photo-1234567890/image.jpg?w=1200&h=630"
   ```

2. **Missing Alt Text**
   ```yaml
   # Problem: Missing imageAlt
   image: "https://example.com/image.jpg"
   
   # Solution: Add descriptive alt text
   image: "https://example.com/image.jpg"
   imageAlt: "Professional landscaper working on garden design"
   ```

## **Build Issues**

### **TypeScript Compilation Errors**

#### **Symptom**: `npm run build` fails with TypeScript errors
**Common Errors & Solutions:**

```typescript
// Error: Cannot find module '@/components/mdx/new-component'
// Solution: Ensure component exists and is properly exported

// Check file exists
ls src/components/mdx/new-component.tsx

// Check export in mdx-components.tsx
import { NewComponent } from '@/components/mdx/new-component'
export function useMDXComponents(components: MDXComponents) {
  return {
    NewComponent,
    ...components,
  }
}
```

```typescript
// Error: Type 'unknown' is not assignable to parameter
// Solution: Check frontmatter types in validation schema

// Ensure all fields in BlogPostFrontmatterSchema match usage
const BlogPostFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  // ... all other fields must be defined
})
```

### **MDX Parsing Errors**

#### **Symptom**: Build fails during MDX processing
**Common Causes:**

1. **Invalid Frontmatter YAML**
   ```yaml
   # Problem: Malformed YAML
   ---
   title: "Example Post
   slug: missing-quote
   ---
   
   # Solution: Fix YAML syntax
   ---
   title: "Example Post"
   slug: "missing-quote"
   ---
   ```

2. **Component Usage Errors**
   ```markdown
   <!-- Problem: Incorrect component syntax -->
   <Callout type="invalid-type">
   Content
   </Callout>
   
   <!-- Solution: Use valid props -->
   <Callout type="info">
   Content
   </Callout>
   ```

### **Bundle Size Issues**

#### **Symptom**: Build warnings about large bundle size
**Diagnostic:**
```bash
npm run analyze  # Analyze bundle composition
```

**Solutions:**
1. **Check for accidentally imported large dependencies**
2. **Optimize component imports**
3. **Use dynamic imports for heavy components**

## **Performance Issues**

### **Slow Page Loading**

#### **Symptom**: Blog pages load slowly
**Diagnostic Steps:**
```bash
# Check performance metrics
npm run blog:perf-test -- --compare

# Expected output should show:
# ✅ Cache hit rate: >95%
# ✅ Average lookup: <10ms
# ✅ File system operations: <100ms
```

**Performance Troubleshooting:**

1. **Cache Issues**
   ```bash
   # Check cache effectiveness
   npm run blog:perf-test
   
   # Look for:
   # - Low cache hit rates (<90%)
   # - High file system operation times (>100ms)
   # - Memory issues
   ```

2. **Too Many Posts Loading**
   ```typescript
   // Problem: Loading all posts when only some needed
   const allPosts = await getAllPosts()  // Loads everything
   
   // Solution: Use specific queries
   const featuredPosts = await getFeaturedPosts()  // Only featured
   const categoryPosts = await getPostsByCategory('pricing')  // Filtered
   ```

3. **Inefficient Content Processing**
   ```bash
   # Check for patterns that bypass cache
   # Cache misses indicate inefficient usage
   
   # Solution: Use batch operations
   # Instead of multiple individual calls, use batch functions
   ```

### **Memory Issues**

#### **Symptom**: High memory usage or memory leaks
**Diagnostic:**
```bash
# Monitor memory during performance test
npm run blog:perf-test -- --verbose

# Check for:
# - Continuously growing memory usage
# - Cache not being cleaned up
# - Large objects not being garbage collected
```

**Solutions:**
1. **Cache TTL Issues**
   - Verify cache TTL is working (5 seconds dev, 5 minutes prod)
   - Check for cache entries not expiring

2. **Large Content Objects**
   - Use `getPostWithLazyContent()` for display-only scenarios
   - Avoid loading full content when only metadata needed

## **SEO Issues**

### **Missing Structured Data**

#### **Symptom**: SEO validation fails or rich snippets not appearing
```bash
npm run blog:validate-seo
# Output shows missing or invalid structured data
```

**Common Issues & Solutions:**

1. **Missing FAQ Schema**
   ```markdown
   <!-- Problem: FAQ content without schema -->
   ## Frequently Asked Questions
   **Q: How much does it cost?**
   A: It depends on several factors...
   
   <!-- Solution: Use FAQ component -->
   <FAQAccordion
     faqs={[
       {
         question: "How much does it cost?",
         answer: "It depends on several factors..."
       }
     ]}
   />
   ```

2. **Invalid JSON-LD**
   ```typescript
   // Check schema generation
   const schema = generateBlogPostingSchema(post)
   console.log(JSON.stringify(schema, null, 2))
   
   // Validate against Google's structured data testing tool
   ```

### **Meta Description Issues**

#### **Symptom**: Missing or invalid meta descriptions
```bash
# Check for missing descriptions
grep -L "description:" content/posts/*/seo

# Check for descriptions too long (>160 chars)
grep -r "description:" content/posts/ | awk -F': ' '{print length($2), $0}' | sort -n
```

**Solutions:**
```yaml
# Add SEO section to frontmatter
seo:
  description: "Concise description under 160 characters with primary keyword"
  keywords: ["relevant", "keywords", "for-seo"]
```

### **Missing Alt Text**

#### **Symptom**: Images without proper alt text
```bash
# Find images missing alt text
npm run blog:validate-seo | grep "imageAlt"
```

**Solution:**
```yaml
# Always include descriptive alt text
image: "https://example.com/image.jpg"
imageAlt: "Professional landscaper installing paver patio with tools and materials visible"
```

## **Component Issues**

### **Components Not Rendering**

#### **Symptom**: MDX components appear as plain text or don't render
**Diagnostic Steps:**

1. **Check Component Export**
   ```typescript
   // Verify in mdx-components.tsx
   import { Callout } from '@/components/mdx/callout'
   
   export function useMDXComponents(components: MDXComponents) {
     return {
       Callout,  // Must be included here
       ...components,
     }
   }
   ```

2. **Check Component Props**
   ```markdown
   <!-- Problem: Invalid props -->
   <Callout type="invalid">
   Content
   </Callout>
   
   <!-- Solution: Use valid props -->
   <Callout type="info">
   Content
   </Callout>
   ```

3. **Check Component Import**
   ```typescript
   // Verify component exists
   ls src/components/mdx/callout.tsx
   
   // Check component exports
   export { Callout } from './callout'
   ```

### **Interactive Components Not Working**

#### **Symptom**: Components render but interactivity doesn't work

1. **Table of Contents Not Scrolling**
   ```typescript
   // Check if headings have proper IDs
   // Component relies on heading extraction
   
   // Verify headings.ts is working
   const headings = await extractHeadings(content)
   console.log(headings)  // Should show array of headings with IDs
   ```

2. **FAQ Accordion Not Expanding**
   ```tsx
   // Check for JavaScript errors in browser console
   // Verify Radix UI dependencies are installed
   npm list @radix-ui/react-accordion
   ```

3. **Component State Issues**
   ```tsx
   // Check for hydration mismatches
   // Ensure server-side and client-side rendering match
   ```

## **Development Environment Issues**

### **Hot Reload Not Working**

#### **Symptom**: Changes to content don't appear in development
**Solutions:**

1. **Cache TTL in Development**
   ```typescript
   // Verify cache TTL is short in development
   const CACHE_TTL = process.env.NODE_ENV === 'development' ? 5_000 : 300_000
   ```

2. **File Watching Issues**
   ```bash
   # Restart development server
   npm run dev
   
   # Check if content directory is being watched
   # Next.js should automatically detect content changes
   ```

### **Port Conflicts**

#### **Symptom**: Development server won't start
```bash
# Error: Port 3000 is already in use
# Solution: Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

## **Production Issues**

### **Vercel Deployment Failures**

#### **Symptom**: Deployment fails on Vercel
**Common Causes:**

1. **Build Timeout**
   ```bash
   # Check build duration locally
   time npm run build
   
   # Should complete in <2 minutes
   # If longer, optimize content processing
   ```

2. **Memory Limits**
   ```bash
   # Monitor memory usage during build
   # Reduce concurrent processing if needed
   ```

3. **Environment Variables**
   ```bash
   # Verify all required env vars are set in Vercel dashboard
   NEXT_PUBLIC_SITE_URL=https://yourapp.com
   ```

### **Cache Issues in Production**

#### **Symptom**: Old content showing despite updates
**Solutions:**

1. **Clear CDN Cache**
   - Vercel automatically handles this for new deployments
   - For manual cache clear, redeploy the application

2. **Browser Cache**
   ```bash
   # Add cache-busting headers if needed
   # Usually handled automatically by Next.js
   ```

## **Emergency Procedures**

### **Site Completely Down**

#### **Immediate Response**
```bash
# 1. Check deployment status in Vercel dashboard
# 2. Look for recent commits that might have caused issues
git log --oneline -n 5

# 3. Emergency rollback
git revert HEAD
git push origin main

# 4. Monitor recovery
curl -I https://yourapp.com/blog
```

### **Content Corruption**

#### **Recovery Steps**
```bash
# 1. Assess damage
npm run blog:validate

# 2. Restore from backup
cp -r content/posts.backup.LATEST content/posts

# 3. Commit restoration
git add content/posts
git commit -m "emergency: restore content from backup"
git push origin main

# 4. Verify recovery
npm run blog:validate
npm run blog:test-essential
```

## **Diagnostic Commands Reference**

### **Content Diagnostics**
```bash
# Validate all content
npm run blog:validate

# SEO validation
npm run blog:validate-seo

# Content analytics
npm run blog:analytics

# Check specific post
grep -A 10 -B 5 "title:" content/posts/2025/post-name.mdx
```

### **Performance Diagnostics**
```bash
# Performance benchmark
npm run blog:perf-test

# Compare with baseline
npm run blog:perf-test -- --compare

# MDX-only performance
npm run blog:perf-test -- --mdx-only

# Bundle analysis
npm run analyze
```

### **System Diagnostics**
```bash
# Essential system tests
npm run blog:test-essential

# Build test
npm run build

# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint
```

### **File System Diagnostics**
```bash
# Check content structure
find content/posts -name "*.mdx" | wc -l  # Should show 9 posts

# Check for hidden files
ls -la content/posts/

# Check file permissions
ls -la content/posts/2025/

# Check disk space
df -h
```

## **Prevention Best Practices**

### **Pre-Commit Checks**
```bash
# Always run before committing
npm run blog:validate && npm run blog:validate-seo && npm run build
```

### **Regular Maintenance**
```bash
# Weekly checks
npm run blog:analytics  # Review content performance
npm run blog:perf-test -- --baseline  # Update performance baselines

# Monthly checks
npm audit  # Check for security vulnerabilities
npm outdated  # Check for dependency updates
```

### **Monitoring Setup**
- **Vercel Analytics**: Monitor Core Web Vitals
- **Google Search Console**: Track SEO performance
- **Custom Health Checks**: Automated endpoint monitoring
- **Error Tracking**: Browser console error monitoring

## **Getting Help**

### **Self-Service Resources**
1. **Run diagnostics**: Start with validation commands
2. **Check logs**: Browser console and Vercel deployment logs
3. **Review documentation**: Technical docs and this troubleshooting guide
4. **Test in isolation**: Create minimal reproduction case

### **Escalation Path**
1. **Level 1**: Run all diagnostic commands, check common solutions
2. **Level 2**: Review Git history, check for recent changes
3. **Level 3**: Emergency rollback procedures
4. **Level 4**: System restoration from backups

This troubleshooting guide covers the most common issues and their solutions. Always start with the diagnostic commands to identify the root cause before applying solutions.