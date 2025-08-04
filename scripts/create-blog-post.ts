#!/usr/bin/env tsx

/**
 * Blog Post Creation CLI Tool
 * 
 * Usage:
 *   npm run blog:new "Your Post Title"
 *   npm run blog:new "Your Post Title" --category=guides
 *   npm run blog:new "Your Post Title" --draft
 * 
 * Features:
 * - Automatic slug generation
 * - Category-specific templates
 * - Interactive prompts for metadata
 * - Validation of required fields
 * - Duplicate slug detection
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Types and schemas
const CategorySchema = z.enum(['pricing', 'operations', 'tools']);
type Category = z.infer<typeof CategorySchema>;

interface BlogPostMetadata {
  title: string;
  slug: string;
  category: Category;
  summary: string;
  author: string;
  publishedAt: string;
  readTime: number;
  image: string;
  tags?: string[];
  isDraft: boolean;
}

interface TemplateConfig {
  category: Category;
  defaultTags: string[];
  contentTemplate: string;
  summaryTemplate: string;
  defaultImage: string;
}

// Configuration
const CONTENT_DIR = join(process.cwd(), 'content', 'posts');
const AUTHOR_NAME = 'LawnQuote Team';

// Category templates
const CATEGORY_TEMPLATES: Record<Category, TemplateConfig> = {
  'pricing': {
    category: 'pricing',
    defaultTags: ['pricing', 'quotes', 'business'],
    summaryTemplate: 'Learn effective pricing strategies and techniques for',
    defaultImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
    contentTemplate: `## Introduction

Pricing is one of the most critical aspects of running a successful landscaping business. In this comprehensive guide, we'll explore proven strategies for {title}.

## Understanding Your Costs

Before setting prices, you need to understand your true costs:

- **Labor costs**: Hourly wages plus benefits and taxes
- **Equipment costs**: Purchase, maintenance, and depreciation
- **Material costs**: Direct materials plus waste factor
- **Overhead costs**: Insurance, office expenses, vehicle costs
- **Profit margin**: Your desired return on investment

## Pricing Strategies

### 1. Cost-Plus Pricing

This is the most straightforward approach:

<CodeBlock language="javascript">
// Basic cost-plus calculation
const laborCost = hourlyRate * estimatedHours;
const materialCost = materials * (1 + wastePercentage);
const overhead = (laborCost + materialCost) * overheadPercentage;
const subtotal = laborCost + materialCost + overhead;
const finalPrice = subtotal * (1 + profitMargin);
</CodeBlock>

### 2. Value-Based Pricing

Price based on the value you provide to the customer:

- Time savings for the customer
- Quality of work and materials
- Expertise and experience
- Convenience and reliability

<Callout type="tip">
**Pro Tip**: Always communicate the value you're providing, not just the cost breakdown.
</Callout>

### 3. Competitive Pricing

Research your local market:

- Get quotes from competitors
- Understand their service levels
- Position yourself appropriately
- Don't always compete on price alone

## Common Pricing Mistakes

<Callout type="warning">
**Avoid These Pitfalls**: Many landscapers underprice their services by not accounting for all costs.
</Callout>

1. **Forgetting overhead costs**
2. **Not factoring in profit margin**
3. **Underestimating time requirements**
4. **Ignoring seasonal variations**
5. **Not adjusting for inflation**

## Pricing Tools and Calculators

Use technology to improve your pricing accuracy:

<PricingCalculator 
  title="Basic Landscaping Quote Calculator"
  description="Calculate your quote with labor, materials, and overhead"
/>

## Best Practices

### Documentation
- Keep detailed records of actual vs. estimated costs
- Track time spent on different types of jobs
- Monitor material usage and waste

### Communication
- Present prices professionally
- Explain your value proposition
- Be confident in your pricing

### Flexibility
- Offer different service levels
- Consider seasonal pricing
- Provide package deals

## Conclusion

Effective pricing is essential for business success. By understanding your costs, researching the market, and communicating value, you can price your services profitably while remaining competitive.

## Next Steps

- Calculate your true hourly costs
- Research competitor pricing
- Implement a pricing system
- Track and adjust based on results

<Callout type="info">
**Need Help?** Use our pricing calculator tools to get started with professional quote pricing.
</Callout>`
  },
  'operations': {
    category: 'operations',
    defaultTags: ['operations', 'efficiency', 'management'],
    summaryTemplate: 'Streamline your landscaping operations with proven strategies for',
    defaultImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    contentTemplate: `## Introduction

Efficient operations are the backbone of any successful landscaping business. This guide covers essential strategies for {title} that will help you optimize your workflow and increase profitability.

## Operational Fundamentals

### Planning and Scheduling

Effective operations start with proper planning:

- **Route optimization**: Minimize travel time between jobs
- **Crew scheduling**: Match skills to job requirements
- **Equipment allocation**: Ensure tools are available when needed
- **Weather contingencies**: Have backup plans for weather delays

### Workflow Management

Create standardized processes for:

1. **Job preparation**
2. **Site setup and safety**
3. **Work execution**
4. **Quality control**
5. **Site cleanup**
6. **Customer communication**

## Technology Integration

### Digital Tools

Leverage technology to improve efficiency:

<CodeBlock language="bash">
# Example: Using GPS tracking for route optimization
curl -X GET "https://api.route-optimizer.com/v1/optimize" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "jobs": [
      {"address": "123 Main St", "duration": 120},
      {"address": "456 Oak Ave", "duration": 90}
    ]
  }'
</CodeBlock>

### Mobile Applications

Essential apps for field operations:

- **Scheduling and dispatch**
- **Time tracking**
- **Photo documentation**
- **Customer communication**
- **Inventory management**

## Quality Control Systems

### Inspection Checklists

Create standardized checklists for:

- Pre-job site assessment
- Work quality verification
- Equipment condition checks
- Safety compliance
- Customer satisfaction

<Callout type="success">
**Quality Tip**: Regular quality checks prevent costly callbacks and maintain customer satisfaction.
</Callout>

### Performance Metrics

Track key operational metrics:

- **Job completion time vs. estimates**
- **Customer satisfaction scores**
- **Equipment utilization rates**
- **Crew productivity**
- **Callback frequency**

## Safety and Compliance

### Safety Protocols

Implement comprehensive safety measures:

1. **Daily safety briefings**
2. **Personal protective equipment (PPE)**
3. **Equipment safety checks**
4. **Hazard identification**
5. **Emergency procedures**

<Callout type="warning">
**Safety First**: Never compromise on safety to save time or money. Accidents are always more expensive than prevention.
</Callout>

### Regulatory Compliance

Stay compliant with:

- Local licensing requirements
- Environmental regulations
- Labor laws
- Insurance requirements

## Inventory and Equipment Management

### Inventory Control

Maintain optimal inventory levels:

- **Just-in-time ordering**
- **Seasonal planning**
- **Waste reduction**
- **Cost tracking**

### Equipment Maintenance

Preventive maintenance program:

- **Regular service schedules**
- **Maintenance logs**
- **Replacement planning**
- **Downtime tracking**

## Team Management

### Training Programs

Invest in your team:

- **Technical skills training**
- **Safety certification**
- **Customer service skills**
- **Equipment operation**

### Performance Management

- Set clear expectations
- Provide regular feedback
- Recognize good performance
- Address issues promptly

## Continuous Improvement

### Process Optimization

Regularly review and improve:

- **Time and motion studies**
- **Bottleneck identification**
- **Automation opportunities**
- **Best practice sharing**

### Customer Feedback

Use customer feedback to improve:

- **Service quality**
- **Communication processes**
- **Response times**
- **Overall experience**

## Conclusion

Effective operations management is crucial for business success. By implementing these strategies for {title}, you'll improve efficiency, reduce costs, and enhance customer satisfaction.

## Action Items

- [ ] Assess current operational processes
- [ ] Identify improvement opportunities
- [ ] Implement new systems gradually
- [ ] Monitor and measure results
- [ ] Continuously refine processes

<Callout type="info">
**Get Started**: Begin with one area of improvement and expand your operational enhancements over time.
</Callout>`
  },
  'tools': {
    category: 'tools',
    defaultTags: ['tools', 'software', 'technology'],
    summaryTemplate: 'Discover the best tools and technologies for',
    defaultImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop',
    contentTemplate: `## Introduction

The right tools can make all the difference in your landscaping business. This comprehensive guide covers everything you need to know about {title} to improve efficiency and results.

## Tool Categories

### Essential Hand Tools

Every landscaper needs these basics:

- **Shovels and spades**: For digging and moving soil
- **Pruning shears**: For trimming and shaping plants
- **Rakes**: For cleanup and soil preparation
- **Measuring tools**: For accurate installations
- **Safety equipment**: Protection for you and your crew

### Power Equipment

Invest in quality power tools:

1. **Mowers**: Commercial-grade for efficiency
2. **Trimmers**: String trimmers and edgers
3. **Blowers**: For cleanup and maintenance
4. **Chainsaws**: For tree work and removal
5. **Aerators**: For lawn health improvement

## Software Solutions

### Quote Management Software

Features to look for:

<CodeBlock language="javascript">
// Example: Quote calculation API
const calculateQuote = (services, materials, labor) => {
  const subtotal = services + materials + labor;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  return {
    subtotal,
    tax,
    total,
    breakdown: {
      services,
      materials,
      labor
    }
  };
};
</CodeBlock>

### Scheduling and Dispatch

Key capabilities:

- **Drag-and-drop scheduling**
- **GPS tracking**
- **Real-time updates**
- **Customer notifications**
- **Route optimization**

### Customer Relationship Management (CRM)

Essential CRM features:

- Contact management
- Service history tracking
- Communication logs
- Follow-up reminders
- Marketing automation

## Equipment Selection Criteria

### Quality vs. Cost

Consider these factors:

<Callout type="tip">
**Buying Tip**: Sometimes it's worth paying more upfront for tools that will last longer and perform better.
</Callout>

- **Durability**: How long will it last?
- **Performance**: Does it do the job well?
- **Maintenance**: What are the ongoing costs?
- **Warranty**: What protection do you have?
- **Resale value**: Will it retain value?

### Seasonal Considerations

Plan purchases around:

- **Peak season needs**
- **Off-season deals**
- **Storage requirements**
- **Maintenance schedules**

## Technology Integration

### Mobile Apps

Essential apps for landscapers:

1. **Weather tracking**
2. **Plant identification**
3. **Measurement tools**
4. **Photo documentation**
5. **Time tracking**

### GPS and Mapping

Use technology for:

- Route planning
- Site documentation
- Property measurements
- Progress tracking

## Maintenance and Care

### Preventive Maintenance

Create schedules for:

- **Daily inspections**
- **Weekly cleaning**
- **Monthly servicing**
- **Annual overhauls**

<Callout type="warning">
**Maintenance Alert**: Regular maintenance prevents costly breakdowns and extends tool life.
</Callout>

### Storage Solutions

Proper storage protects your investment:

- **Climate-controlled environments**
- **Security measures**
- **Organization systems**
- **Inventory tracking**

## ROI Analysis

### Cost-Benefit Analysis

Evaluate tools based on:

<PricingCalculator 
  title="Tool ROI Calculator"
  description="Calculate the return on investment for new equipment"
/>

- **Time savings**
- **Quality improvements**
- **Reduced labor costs**
- **Increased capacity**

### Financing Options

Consider:

- **Purchase vs. lease**
- **Equipment loans**
- **Seasonal financing**
- **Trade-in programs**

## Safety Considerations

### Personal Protective Equipment (PPE)

Always use appropriate PPE:

- **Eye protection**
- **Hearing protection**
- **Hand protection**
- **Foot protection**
- **Respiratory protection**

### Training Requirements

Ensure proper training on:

- **Equipment operation**
- **Safety procedures**
- **Maintenance tasks**
- **Emergency protocols**

## Future Trends

### Emerging Technologies

Stay ahead with:

- **Electric equipment**
- **Autonomous systems**
- **IoT sensors**
- **Drone technology**
- **AI-powered analytics**

## Conclusion

Choosing the right tools for {title} is crucial for business success. Invest wisely in quality equipment and software that will improve your efficiency and profitability.

## Recommended Actions

- [ ] Assess your current tool inventory
- [ ] Identify gaps and needs
- [ ] Research options and compare features
- [ ] Create a purchase plan and budget
- [ ] Implement proper maintenance procedures

<Callout type="info">
**Tool Tip**: Start with the basics and gradually upgrade as your business grows and needs evolve.
</Callout>`
  }
};

// Utility functions
function generateSlug(title: string): string {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Truncate to 50 characters if too long
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-[^-]*$/, ''); // Remove partial word at end
  }
  
  return slug;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function checkSlugExists(slug: string): Promise<boolean> {
  try {
    const filePath = join(CONTENT_DIR, `${slug}.mdx`);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (await checkSlugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

function createFrontmatter(metadata: BlogPostMetadata): string {
  return `---
title: "${metadata.title}"
slug: "${metadata.slug}"
category: "${metadata.category}"
summary: "${metadata.summary}"
author: "${metadata.author}"
publishedAt: "${metadata.publishedAt}"
readTime: ${metadata.readTime}
image: "${metadata.image}"${metadata.tags ? `
tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]` : ''}
isDraft: ${metadata.isDraft}
---`;
}

function createContent(title: string, template: TemplateConfig): string {
  return template.contentTemplate.replace(/{title}/g, title);
}

async function promptForInput(question: string, defaultValue?: string): Promise<string> {
  // In a real implementation, you'd use a library like 'inquirer' for interactive prompts
  // For now, we'll use command line arguments and defaults
  return defaultValue || '';
}

async function createBlogPost(
  title: string,
  category: Category = 'pricing',
  isDraft: boolean = false
): Promise<void> {
  try {
    console.log(`🚀 Creating new blog post: "${title}"`);
    
    // Generate slug and check for duplicates
    const baseSlug = generateSlug(title);
    const slug = await generateUniqueSlug(baseSlug);
    
    if (slug !== baseSlug) {
      console.log(`⚠️  Slug "${baseSlug}" already exists, using "${slug}" instead`);
    }
    
    // Get template configuration
    const template = CATEGORY_TEMPLATES[category];
    
    // Create content
    const content = createContent(title, template);
    const readTime = calculateReadingTime(content);
    
    // Create metadata
    const metadata: BlogPostMetadata = {
      title,
      slug,
      category,
      summary: `${template.summaryTemplate} ${title.toLowerCase()}.`,
      author: AUTHOR_NAME,
      publishedAt: isDraft ? '' : formatDate(new Date()),
      readTime,
      image: template.defaultImage,
      tags: template.defaultTags,
      isDraft
    };
    
    // Generate frontmatter and full content
    const frontmatter = createFrontmatter(metadata);
    const fullContent = `${frontmatter}\n\n${content}`;
    
    // Ensure content directory exists
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    
    // Write file
    const filePath = join(CONTENT_DIR, `${slug}.mdx`);
    await fs.writeFile(filePath, fullContent, 'utf-8');
    
    console.log(`✅ Blog post created successfully!`);
    console.log(`📁 File: ${filePath}`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📂 Category: ${category}`);
    console.log(`📖 Reading time: ${readTime} min`);
    console.log(`📝 Status: ${isDraft ? 'Draft' : 'Published'}`);
    console.log(`🏷️  Tags: ${metadata.tags.join(', ')}`);
    
    if (isDraft) {
      console.log(`\n💡 To publish this post, edit the file and set isDraft: false`);
    }
    
    console.log(`\n🎯 Next steps:`);
    console.log(`1. Edit the content in ${filePath}`);
    console.log(`2. Update the summary and tags as needed`);
    console.log(`3. Replace placeholder image with actual image`);
    console.log(`4. Run 'npm run blog:validate' to check for issues`);
    console.log(`5. Run 'npm run dev' to preview your changes`);
    
  } catch (error) {
    console.error('❌ Error creating blog post:', error);
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 Blog Post Creation Tool

Usage:
  npm run blog:new "Your Post Title"
  npm run blog:new "Your Post Title" --category=guides
  npm run blog:new "Your Post Title" --draft
  npm run blog:new "Your Post Title" --category=tutorials --draft

Options:
  --category=<category>  Set the post category (pricing, operations, tools)
  --draft               Create as draft (won't be published)
  --help, -h            Show this help message

Examples:
  npm run blog:new "How to Price Lawn Care Services"
  npm run blog:new "Equipment Maintenance Tips" --category=operations
  npm run blog:new "Best Software for Landscapers" --category=tools --draft

Categories:
  - pricing: Pricing strategies, quote management, and business financials
  - operations: Business operations, workflow management, and efficiency
  - tools: Software, equipment, and technology recommendations
`);
    return;
  }
  
  // Parse arguments more carefully
  let title = '';
  let category: Category = 'guides';
  let isDraft = false;
  
  // Separate title words from options
  const titleWords: string[] = [];
  
  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      const categoryValue = arg.split('=')[1];
      try {
        category = CategorySchema.parse(categoryValue);
      } catch {
        console.error(`❌ Error: Invalid category "${categoryValue}"`);
        console.log('Valid categories: pricing, operations, tools');
        process.exit(1);
      }
    } else if (arg === '--draft') {
      isDraft = true;
    } else if (!arg.startsWith('--')) {
      titleWords.push(arg);
    }
  }
  
  title = titleWords.join(' ');
  
  if (!title) {
    console.error('❌ Error: Post title is required');
    console.log('Usage: npm run blog:new "Your Post Title"');
    console.log('Arguments received:', args);
    process.exit(1);
  }
  
  await createBlogPost(title, category, isDraft);
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { createBlogPost, generateSlug, calculateReadingTime };
