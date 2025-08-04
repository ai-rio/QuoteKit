# **LawnQuote MDX Blog Integration - Agent Guide**

## **Overview for AI Agents**

This README provides comprehensive guidance for AI agents tasked with implementing the MDX blog integration for LawnQuote. It contains all necessary context, constraints, and implementation details to ensure successful execution.

---

## **Project Context**

### **Current State Analysis**
LawnQuote currently uses a **hardcoded TypeScript blog system** with the following characteristics:

**Existing Structure:**
```
src/app/blog/
├── [slug]/page.tsx          # Dynamic blog post rendering
├── components/              # Blog UI components
├── data/blog-posts.ts       # Hardcoded blog data (TO BE REPLACED)
├── hooks/                   # Blog-related hooks
└── page.tsx                 # Blog index page
```

**Current Data Schema:**
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: 'pricing' | 'operations' | 'tools';
  image: string;
  summary: string;
  author: string;
  publishedAt: string;
  readTime: number;
  featured?: boolean;
}
```

**Existing Posts (6+ entries):**
- "The 5-Minute Quote: How to Price a Paver Patio"
- "3 Things Your Quote Must Include to Build Client Trust"
- "The $12 Tool with a Better ROI Than a New Mower"
- Additional pricing, operations, and tools content

### **Target State**
Transform to a **flexible MDX-based system** that:
- Maintains 100% backward compatibility
- Preserves all existing URLs and SEO
- Enables rich content with React components
- Provides automated content creation workflows

---

## **Critical Constraints for Agents**

### **🚨 NON-NEGOTIABLE Requirements**

1. **Zero Breaking Changes**
   - All existing URLs must continue working
   - SEO metadata must be preserved exactly
   - Current blog functionality must remain intact

2. **Data Preservation**
   - All existing blog posts must be migrated without data loss
   - Metadata fields must map exactly to current schema
   - Content must render identically to current implementation

3. **Performance Maintenance**
   - Build time increase must be < 20%
   - Page load times must not degrade
   - Core Web Vitals scores must be maintained

4. **LawnQuote Design System**
   - Use existing Tailwind classes (`bg-light-concrete`, `text-forest-green`, etc.)
   - Maintain current component architecture
   - Preserve responsive design patterns

### **🎯 Technology Stack (FIXED)**
- **Framework**: Next.js 15 with App Router (current)
- **Styling**: Tailwind CSS (current)
- **Content**: MDX files with `gray-matter` + `next-mdx-remote`
- **Validation**: Zod schemas for type safety
- **Deployment**: Vercel (current platform)

---

## **Implementation Strategy**

### **Phase-Based Approach**
Follow the **4-sprint roadmap** defined in `implementation-roadmap.md`:

1. **Sprint 1**: Core MDX infrastructure + content migration
2. **Sprint 2**: Enhanced features + custom components
3. **Sprint 3**: Content automation + workflows
4. **Sprint 4**: Optimization + documentation

### **Key Implementation Files**

**Must Create:**
```
/content/posts/2025/           # MDX blog posts
/src/lib/blog/content.ts       # Content fetching utilities
/src/lib/blog/types.ts         # TypeScript interfaces
/src/lib/blog/validation.ts    # Zod schemas
/mdx-components.tsx            # MDX component mapping
/scripts/migrate-blog-posts.ts # Migration script
```

**Must Update:**
```
/src/app/blog/[slug]/page.tsx  # Update to use MDX
/package.json                  # Add MDX dependencies
```

---

## **Agent Implementation Guidelines**

### **Step 1: Environment Setup**
```bash
# Install required dependencies
npm install gray-matter next-mdx-remote zod

# Optional enhancements
npm install rehype-pretty-code rehype-slug remark-gfm
```

### **Step 2: Create Core Infrastructure**

**Priority Order:**
1. Create `/content/posts/` directory structure
2. Build content fetching utilities (`src/lib/blog/content.ts`)
3. Define TypeScript interfaces (`src/lib/blog/types.ts`)
4. Implement Zod validation (`src/lib/blog/validation.ts`)
5. Create migration script (`scripts/migrate-blog-posts.ts`)

### **Step 3: Content Migration**

**Critical Steps:**
1. **Backup existing data** - Create copy of `blog-posts.ts`
2. **Run migration script** - Convert TypeScript to MDX
3. **Validate migration** - Ensure all posts converted correctly
4. **Test rendering** - Verify all posts display properly

**Migration Validation Checklist:**
- [ ] All 6+ posts converted to MDX format
- [ ] All metadata fields preserved
- [ ] Slugs match exactly (for URL preservation)
- [ ] Categories remain: 'pricing', 'operations', 'tools'
- [ ] Featured images and alt text preserved

### **Step 4: Update Blog Rendering**

**Key Changes to `[slug]/page.tsx`:**
```typescript
// Replace hardcoded data import
- import { blogPosts } from '../data/blog-posts';
+ import { getAllPosts, getPostBySlug } from '@/lib/blog/content';

// Update generateStaticParams
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.frontmatter.slug,
  }));
}

// Update page component to use MDX
import { MDXRemote } from 'next-mdx-remote/rsc';
// ... render MDX content
```

### **Step 5: Testing & Validation**

**Required Tests:**
- [ ] All existing URLs return 200 status
- [ ] SEO metadata identical to current
- [ ] Blog index page shows all posts
- [ ] Related posts functionality works
- [ ] Build completes without errors
- [ ] Performance benchmarks met

---

## **Content Structure Specifications**

### **Frontmatter Schema (Exact Mapping)**
```yaml
---
# Required fields (map to current BlogPost interface)
title: "Post Title"                    # → title
slug: "post-slug"                      # → slug  
category: "pricing"                    # → category
author: "Author Name"                  # → author
publishedAt: "2025-01-15"             # → publishedAt
summary: "Post summary"                # → summary
readTime: 8                           # → readTime
image: "https://example.com/img.jpg"   # → image

# Optional fields
featured: true                         # → featured
draft: false                          # New: draft support
tags: ["landscaping", "pricing"]      # New: enhanced categorization

# SEO enhancements
seo:
  description: "Custom meta description"
  keywords: ["keyword1", "keyword2"]
imageAlt: "Image description"
---
```

### **Directory Structure**
```
/content/
├── posts/
│   └── 2025/
│       ├── 01-how-to-price-paver-patio.mdx
│       ├── 02-build-client-trust.mdx
│       ├── 03-software-roi-analysis.mdx
│       └── [additional-posts].mdx
├── templates/
│   ├── pricing-post.mdx
│   ├── operations-post.mdx
│   └── tools-post.mdx
└── assets/
    └── images/blog/
```

---

## **Component Development Guidelines**

### **Custom MDX Components**
Create these components for enhanced content:

**Required Components:**
```typescript
// src/components/mdx/callout.tsx
<Callout type="info|warning|success|error" title="Optional">
  Content here
</Callout>

// src/components/mdx/code-block.tsx  
<CodeBlock language="typescript" title="Optional">
  Code content
</CodeBlock>

// src/components/mdx/pricing-calculator.tsx (LawnQuote-specific)
<PricingCalculator basePrice={100} factors={[...]} />
```

**Component Requirements:**
- Use LawnQuote design system colors
- Ensure mobile responsiveness
- Include accessibility features
- Follow existing component patterns

### **MDX Components Configuration**
```typescript
// mdx-components.tsx
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Style default HTML elements with LawnQuote design
    h1: ({ children }) => <h1 className="text-4xl font-bold text-forest-green mb-6">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold text-forest-green mb-4 mt-8">{children}</h2>,
    // ... other elements
    
    // Custom components
    Callout,
    CodeBlock,
    PricingCalculator,
    
    ...components,
  };
}
```

---

## **Automation & Workflow Tools**

### **Content Creation CLI**
```bash
# Create new blog post
npm run blog:new "How to Price Landscape Design"

# This should:
# 1. Generate slug: "how-to-price-landscape-design"
# 2. Create file: content/posts/2025/MM-how-to-price-landscape-design.mdx
# 3. Pre-populate frontmatter with defaults
# 4. Open in editor (optional)
```

### **Content Validation**
```bash
# Validate all content
npm run blog:validate

# Should check:
# - Required frontmatter fields
# - Unique slugs
# - Valid categories
# - Image references
# - Date formats
```

### **Build Integration**
```json
{
  "scripts": {
    "build": "npm run blog:validate && next build",
    "dev": "next dev",
    "blog:new": "tsx scripts/create-blog-post.ts",
    "blog:validate": "tsx scripts/validate-content.ts",
    "blog:migrate": "tsx scripts/migrate-blog-posts.ts"
  }
}
```

---

## **Quality Assurance Checklist**

### **Pre-Implementation Validation**
- [ ] Current blog system fully analyzed
- [ ] All existing posts catalogued
- [ ] Component dependencies identified
- [ ] Performance baseline established

### **During Implementation**
- [ ] Each sprint deliverable tested
- [ ] Backward compatibility maintained
- [ ] Performance impact monitored
- [ ] SEO preservation validated

### **Post-Implementation**
- [ ] All URLs return correct content
- [ ] SEO metadata preserved
- [ ] Performance benchmarks met
- [ ] Content creation workflow functional
- [ ] Documentation complete

---

## **Error Handling & Troubleshooting**

### **Common Issues & Solutions**

**Build Failures:**
```bash
# Check content validation
npm run blog:validate

# Common fixes:
# - Fix frontmatter syntax errors
# - Ensure all required fields present
# - Check for duplicate slugs
# - Validate date formats
```

**Missing Posts:**
```bash
# Check if posts are marked as drafts
grep -r "draft: true" content/posts/

# Check if publishedAt is in future
grep -r "publishedAt:" content/posts/ | grep "2025-"
```

**Component Rendering Issues:**
```typescript
// Ensure components are properly exported in mdx-components.tsx
// Check for TypeScript errors in component files
// Verify component imports are correct
```

### **Rollback Procedures**
1. **Immediate**: Revert to previous Git commit
2. **Content**: Restore from backup of `blog-posts.ts`
3. **Dependencies**: Remove MDX packages if needed
4. **Validation**: Test all blog functionality
5. **Communication**: Document issues for future resolution

---

## **Success Metrics**

### **Technical Metrics**
- ✅ Build time increase < 20%
- ✅ All existing URLs return 200 status
- ✅ Core Web Vitals maintained
- ✅ Zero TypeScript errors
- ✅ 100% content migration success

### **Functional Metrics**
- ✅ All blog features work identically
- ✅ SEO metadata preserved
- ✅ Related posts function correctly
- ✅ Search functionality maintained
- ✅ Social media previews work

### **Process Metrics**
- ✅ Content creation time reduced
- ✅ Validation catches all errors
- ✅ Automation tools functional
- ✅ Documentation complete
- ✅ Team can maintain system

---

## **Documentation References**

### **Implementation Guides**
- [`requirements-moscow.md`](./requirements-moscow.md) - Detailed requirements with MoSCoW prioritization
- [`technical-specification.md`](./technical-specification.md) - Complete technical implementation details
- [`implementation-roadmap.md`](./implementation-roadmap.md) - 4-sprint delivery plan
- [`quick-reference.md`](./quick-reference.md) - Developer quick reference guide

### **Research Foundation**
- [`mdx-integration-research.md`](./mdx-integration-research.md) - Comprehensive research analysis that informed all decisions

### **External Resources**
- [Next.js MDX Documentation](https://nextjs.org/docs/app/guides/mdx)
- [Gray Matter Documentation](https://github.com/jonschlinkert/gray-matter)
- [Next MDX Remote](https://github.com/hashicorp/next-mdx-remote)
- [Zod Validation](https://zod.dev/)

---

## **Agent Success Criteria**

An AI agent successfully implementing this plan should achieve:

1. **Zero Disruption**: Existing blog functionality unchanged
2. **Enhanced Capability**: MDX content creation enabled
3. **Automated Workflow**: Content creation streamlined
4. **Maintainable System**: Clear documentation and structure
5. **Performance Maintained**: No degradation in site performance

### **Final Validation**
Before considering implementation complete:
- [ ] All existing blog URLs work identically
- [ ] New MDX posts can be created and rendered
- [ ] Content validation prevents errors
- [ ] Performance benchmarks met
- [ ] Documentation updated and accurate

---

## **Support & Escalation**

### **Implementation Questions**
Refer to the comprehensive documentation suite in this directory. Each document provides specific guidance for different aspects of the implementation.

### **Technical Decisions**
All technical decisions are based on the research in `mdx-integration-research.md` and follow industry best practices for Next.js MDX integration.

### **Scope Changes**
Any changes to requirements should be evaluated against the MoSCoW analysis in `requirements-moscow.md` to maintain project focus and timeline.

This README serves as the definitive guide for AI agents implementing the LawnQuote MDX blog integration. Follow this guide systematically to ensure successful delivery of all project objectives.
