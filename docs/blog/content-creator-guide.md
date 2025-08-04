# **Content Creator Guide - MDX Blog System**

## **Quick Start**

Welcome to the LawnQuote MDX Blog System! This guide will help you create professional, SEO-optimized blog content using our automated tools.

### **Creating Your First Post**
```bash
npm run blog:new "How to Price Landscape Design Services"
```

This single command will:
- Generate a unique slug: `how-to-price-landscape-design-services`
- Create the file: `content/posts/2025/01-how-to-price-landscape-design-services.mdx`
- Pre-populate all required metadata
- Open your editor (if configured)

## **Content Structure**

### **Frontmatter (Required Metadata)**
Every blog post starts with YAML frontmatter between `---` markers:

```yaml
---
title: "How to Price Landscape Design Services"
slug: "how-to-price-landscape-design-services"
category: "pricing"
author: "LawnQuote Team"
publishedAt: "2025-01-15"
summary: "Learn the essential factors that determine landscape design pricing and how to create profitable quotes that win clients."
readTime: 12
image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&h=630&fit=crop"
imageAlt: "Professional landscape designer working on garden layout plans"
featured: false
draft: false
tags: ["pricing", "landscape-design", "business"]
seo:
  description: "Master landscape design pricing with our comprehensive guide. Learn cost factors, pricing strategies, and client communication tips."
  keywords: ["landscape design pricing", "garden design costs", "landscaping quotes"]
---
```

### **Content Categories**
Choose from three main categories:
- **`pricing`** - Cost estimation, pricing strategies, quote creation
- **`operations`** - Business processes, client management, workflow optimization  
- **`tools`** - Software reviews, equipment guides, productivity tips

### **Writing Guidelines**

#### **Title Best Practices**
- **Length**: 10-60 characters
- **Format**: Descriptive and action-oriented
- **Examples**:
  - ✅ "The 5-Minute Quote: How to Price a Paver Patio"
  - ✅ "3 Tools That Cut Quote Preparation Time in Half"
  - ❌ "Pricing" (too vague)
  - ❌ "The Complete Comprehensive Ultimate Guide to Every Aspect of Landscape Design Pricing" (too long)

#### **Summary Writing**
- **Length**: 50-300 characters
- **Purpose**: Meta description and social media previews
- **Style**: Clear, compelling, includes primary keyword
- **Example**: "Learn the essential factors that determine landscape design pricing and how to create profitable quotes that win clients."

#### **Content Structure**
```markdown
# Main Title (H1) - Auto-generated from frontmatter

## Introduction
Brief overview of the topic and what readers will learn.

## Key Section 1
Main content with practical information.

### Subsection (H3)
Detailed explanations and examples.

## Key Section 2
Continue with logical flow.

## Conclusion
Summary of key takeaways and next steps.
```

## **Enhanced Content Components**

### **Key Takeaways**
Highlight essential points for AI optimization:

```markdown
<KeyTakeaways
  title="Essential Pricing Factors"
  takeaways={[
    "Material costs typically account for 40-60% of total project cost",
    "Labor rates vary by region: $25-75/hour for landscaping work",
    "Always include 10-15% markup for unexpected expenses",
    "Seasonal demand affects pricing by 15-30%"
  ]}
/>
```

### **FAQ Sections**
Create SEO-optimized FAQ sections eligible for rich snippets:

```markdown
<FAQAccordion
  faqs={[
    {
      question: "How much should I charge for landscape design?",
      answer: "Landscape design fees typically range from $2,000-$15,000 depending on project scope, property size, and complexity. For residential projects, expect $5-$10 per square foot of designed space."
    },
    {
      question: "What factors affect landscaping costs?",
      answer: "Key factors include material costs, labor requirements, site accessibility, soil conditions, drainage needs, and local building codes. Regional variations can impact costs by 20-40%."
    }
  ]}
/>
```

### **Interactive Table of Contents**
Auto-generate based on your headings:

```markdown
<TableOfContents />
```

### **Professional Data Tables**
Present pricing information clearly:

```markdown
<MaterialCostTable
  title="Common Landscaping Material Costs"
  data={[
    { material: "Concrete Pavers", cost: "$3-8/sq ft", notes: "Includes installation" },
    { material: "Natural Stone", cost: "$15-30/sq ft", notes: "Premium option" },
    { material: "Mulch", cost: "$30-50/yard", notes: "Delivered" },
    { material: "Topsoil", cost: "$20-40/yard", notes: "Quality varies" }
  ]}
/>
```

### **Callout Boxes**
Highlight important information:

```markdown
<Callout type="warning" title="Important Pricing Tip">
Always factor in your overhead costs when pricing projects. A common mistake is only calculating materials and direct labor while forgetting about insurance, equipment depreciation, and administrative time.
</Callout>

<Callout type="info">
Pro tip: Use seasonal pricing strategies to maximize profitability during peak and off-peak seasons.
</Callout>
```

Available types: `info`, `warning`, `success`, `error`

### **Code Examples**
For technical content with syntax highlighting:

```markdown
<CodeBlock language="javascript" title="Quote Calculator Example">
function calculateQuote(materials, laborHours, hourlyRate) {
  const materialCost = materials.reduce((sum, item) => sum + item.cost, 0);
  const laborCost = laborHours * hourlyRate;
  const subtotal = materialCost + laborCost;
  const markup = subtotal * 0.15; // 15% markup
  return subtotal + markup;
}
</CodeBlock>
```

## **Content Workflow**

### **1. Planning Your Post**
- **Research**: Gather data, statistics, and examples
- **Outline**: Structure your main points
- **Keywords**: Identify 3-5 relevant keywords for SEO
- **Images**: Source high-quality, relevant images

### **2. Creating Content**
```bash
# Start with the CLI tool
npm run blog:new "Your Post Title"

# This creates a template with:
# - Pre-filled frontmatter
# - Category-specific content template
# - Placeholder sections to fill in
```

### **3. Writing Process**
1. **Fill in frontmatter** - Update title, summary, read time estimate
2. **Write introduction** - Hook readers and preview content
3. **Develop main sections** - Use clear headings and subheadings
4. **Add components** - Enhance with FAQ, tables, callouts
5. **Write conclusion** - Summarize key points and next steps

### **4. Content Enhancement**
- **Add FAQ section** for common questions
- **Include data tables** for pricing/comparison information
- **Use callouts** to highlight important tips
- **Add key takeaways** section for AI optimization

### **5. Review & Validation**
```bash
# Validate your content
npm run blog:validate

# Check SEO optimization
npm run blog:validate-seo
```

### **6. Publishing**
```bash
# Set as draft while editing
npm run blog:draft "your-post-slug"

# Publish when ready
npm run blog:publish "your-post-slug"

# Or schedule for future
npm run blog:schedule "your-post-slug" "2025-01-20"
```

## **SEO Best Practices**

### **Keyword Integration**
- **Primary keyword** in title, summary, and first paragraph
- **Secondary keywords** naturally throughout content
- **Long-tail keywords** in FAQ sections and subheadings

### **Meta Descriptions**
- **Length**: 120-160 characters
- **Include primary keyword**
- **Compelling call-to-action**
- **Example**: "Master landscape design pricing with our comprehensive guide. Learn cost factors, pricing strategies, and client communication tips that win more projects."

### **Image Optimization**
- **Alt text**: Descriptive and keyword-rich
- **File names**: Use descriptive names with keywords
- **Sources**: Use high-quality stock photos from Unsplash
- **Example alt text**: "Professional landscape designer working on garden layout plans with measuring tools"

### **Internal Linking**
Reference related posts naturally:
```markdown
For more details on client communication, see our guide on [building client trust](build-client-trust).
```

## **Content Templates**

### **Pricing Category Template**
```markdown
# [Tool/Service] Pricing Guide: What You Need to Know

## Introduction
Brief overview of pricing landscape for this topic.

<KeyTakeaways
  title="Quick Pricing Facts"
  takeaways={[
    "Typical price range: $X-Y",
    "Key cost factors: A, B, C",
    "Regional variations: X%"
  ]}
/>

## Cost Breakdown

<MaterialCostTable
  title="Cost Components"
  data={[
    { component: "Materials", cost: "$X-Y", percentage: "40-60%" },
    { component: "Labor", cost: "$X-Y", percentage: "30-40%" },
    { component: "Overhead", cost: "$X-Y", percentage: "10-20%" }
  ]}
/>

## Pricing Strategies

### Strategy 1: Value-Based Pricing
Explanation and examples.

### Strategy 2: Competitive Pricing
Explanation and examples.

## Common Pricing Mistakes

<Callout type="warning">
Most common mistake and how to avoid it.
</Callout>

## FAQ Section

<FAQAccordion
  faqs={[
    {
      question: "How much should I charge for [service]?",
      answer: "Detailed pricing guidance..."
    }
  ]}
/>

## Conclusion
Summary and next steps.
```

### **Operations Category Template**
```markdown
# How to Streamline [Process]: A Step-by-Step Guide

## Introduction
Why this process matters for your business.

<TableOfContents />

## Current Challenges
Common problems businesses face.

## The Solution: [Your Method]

### Step 1: [Action]
Detailed instructions.

### Step 2: [Action]  
Detailed instructions.

<Callout type="info" title="Pro Tip">
Insider advice for better results.
</Callout>

## Tools & Resources
Recommended tools and software.

## Measuring Success
KPIs and metrics to track.

<FAQAccordion
  faqs={[
    {
      question: "How long does this process take?",
      answer: "Timeline expectations..."
    }
  ]}
/>

## Conclusion
Benefits and next steps.
```

### **Tools Category Template**
```markdown
# [Tool Name] Review: Is It Worth the Investment?

## Introduction
Brief overview of the tool and why it matters.

<KeyTakeaways
  title="Tool Summary"
  takeaways={[
    "Price: $X/month or $Y one-time",
    "Best for: [specific use case]",
    "Key benefit: [main advantage]",
    "Learning curve: [easy/moderate/steep]"
  ]}
/>

## What Is [Tool Name]?
Detailed description and primary use cases.

## Features & Benefits

### Feature 1: [Name]
How it works and benefits.

### Feature 2: [Name]
How it works and benefits.

## Pricing & Plans

<MaterialCostTable
  title="Pricing Tiers"
  data={[
    { plan: "Basic", cost: "$X/month", features: "Core features" },
    { plan: "Pro", cost: "$Y/month", features: "Advanced features" },
    { plan: "Enterprise", cost: "Custom", features: "Full suite" }
  ]}
/>

## Pros & Cons

<Callout type="success" title="Pros">
- Major advantage 1
- Major advantage 2
- Major advantage 3
</Callout>

<Callout type="warning" title="Cons">
- Limitation 1
- Limitation 2
- Limitation 3
</Callout>

## Who Should Use This Tool?
Target audience and use cases.

<FAQAccordion
  faqs={[
    {
      question: "Is there a free trial?",
      answer: "Trial information..."
    },
    {
      question: "What's the learning curve like?",
      answer: "Learning expectations..."
    }
  ]}
/>

## Final Verdict
Recommendation and conclusion.
```

## **Quality Checklist**

### **Before Publishing**
- [ ] **Title**: Compelling and keyword-optimized (10-60 chars)
- [ ] **Summary**: Clear and engaging (50-300 chars)
- [ ] **Category**: Correctly assigned (pricing/operations/tools)
- [ ] **Read Time**: Accurate estimate based on content length
- [ ] **Image**: High-quality with descriptive alt text
- [ ] **Tags**: 3-5 relevant tags assigned
- [ ] **Content**: At least 800 words for comprehensive coverage
- [ ] **Headings**: Logical H2/H3 structure
- [ ] **Components**: Enhanced with FAQ, tables, or callouts
- [ ] **Links**: Internal links to related posts
- [ ] **Validation**: Passes `npm run blog:validate`
- [ ] **SEO**: Passes `npm run blog:validate-seo`

### **Content Quality Standards**
- **Actionable**: Readers can implement your advice
- **Specific**: Concrete examples and numbers
- **Current**: Up-to-date information and trends
- **Professional**: Expert-level insights
- **Accessible**: Easy to understand for target audience

## **Publishing Workflow**

### **Draft Phase**
```bash
# Create and work on draft
npm run blog:new "Your Title"
# Edit content...
npm run blog:draft "your-slug"  # Ensure it's marked as draft
```

### **Review Phase**
```bash
# Validate content
npm run blog:validate

# Check SEO optimization
npm run blog:validate-seo

# Preview locally
npm run dev  # View at http://localhost:3000/blog/your-slug
```

### **Publishing Phase**
```bash
# Publish immediately
npm run blog:publish "your-slug"

# Or schedule for later
npm run blog:schedule "your-slug" "2025-01-20"

# Check status
npm run blog:status
```

### **Analytics & Monitoring**
```bash
# Generate content analytics
npm run blog:analytics

# Monitor performance
npm run blog:perf-test
```

## **Advanced Tips**

### **Content Series**
Link related posts together:
```markdown
This is part 2 of our pricing series. Read [part 1](pricing-fundamentals) and [part 3](advanced-pricing-strategies).
```

### **Seasonal Content**
- **Spring**: Preparation, planning, early season pricing
- **Summer**: Peak season strategies, efficiency tips
- **Fall**: Wrap-up projects, maintenance focus
- **Winter**: Planning, equipment maintenance, off-season pricing

### **Client-Focused Writing**
Always write with your audience in mind:
- **Pain points**: Address common challenges
- **Solutions**: Provide actionable advice
- **Examples**: Use real-world scenarios
- **Benefits**: Focus on business impact

### **Performance Optimization**
- **Images**: Use optimized file sizes
- **Content length**: Aim for 800-2000 words
- **Components**: Don't overuse interactive elements
- **Links**: Include 2-3 internal links per post

## **Troubleshooting**

### **Common Issues**

**Validation Errors:**
```bash
npm run blog:validate
# Fix any reported issues in frontmatter or content structure
```

**SEO Warnings:**
```bash
npm run blog:validate-seo
# Address missing alt text, long meta descriptions, etc.
```

**Preview Not Working:**
- Check for draft status: `draft: false`
- Verify publication date: `publishedAt: "2025-01-15"`
- Restart dev server: `npm run dev`

**Component Not Rendering:**
- Check component name spelling
- Verify props are correctly formatted
- Check for TypeScript errors in browser console

### **Getting Help**
- **Validation errors**: Run `npm run blog:validate` for detailed error messages
- **SEO issues**: Run `npm run blog:validate-seo` for optimization tips
- **Component help**: Check existing posts for usage examples
- **Technical issues**: Review `docs/blog/technical-documentation-complete.md`

This guide provides everything you need to create professional, SEO-optimized blog content using the LawnQuote MDX Blog System. Start with the simple CLI commands and gradually incorporate advanced components as you become more comfortable with the system.