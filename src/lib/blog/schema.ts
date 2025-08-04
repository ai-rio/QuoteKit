/**
 * Schema Markup Utilities
 * 
 * Generates JSON-LD structured data for blog posts to improve SEO
 * and enable rich snippets in search results.
 */

interface Author {
  name: string;
  url?: string;
}

interface Publisher {
  name: string;
  logo: string;
  url?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogPostSchemaData {
  title: string;
  description: string;
  url: string;
  image?: string;
  author: Author;
  publisher: Publisher;
  datePublished: string;
  dateModified: string;
  category?: string;
  tags?: string[];
  faqs?: FAQItem[];
}

/**
 * Generate BlogPosting structured data
 */
export function generateBlogPostSchema(data: BlogPostSchemaData) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": data.url
    },
    "headline": data.title,
    "description": data.description,
    "author": {
      "@type": "Person",
      "name": data.author.name,
      ...(data.author.url && { "url": data.author.url })
    },
    "publisher": {
      "@type": "Organization",
      "name": data.publisher.name,
      "logo": {
        "@type": "ImageObject",
        "url": data.publisher.logo
      },
      ...(data.publisher.url && { "url": data.publisher.url })
    },
    "datePublished": data.datePublished,
    "dateModified": data.dateModified,
    ...(data.image && { "image": data.image }),
    ...(data.category && { "articleSection": data.category }),
    ...(data.tags && data.tags.length > 0 && { "keywords": data.tags.join(", ") })
  };

  return schema;
}

/**
 * Generate FAQPage structured data
 */
export function generateFAQSchema(faqs: FAQItem[], url: string) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return schema;
}

/**
 * Generate combined schema with both BlogPosting and FAQPage
 */
export function generateCombinedSchema(data: BlogPostSchemaData) {
  const schemas = [];

  // Always include BlogPosting schema
  schemas.push(generateBlogPostSchema(data));

  // Add FAQPage schema if FAQs exist
  if (data.faqs && data.faqs.length > 0) {
    const faqSchema = generateFAQSchema(data.faqs, data.url);
    if (faqSchema) {
      schemas.push(faqSchema);
    }
  }

  return schemas;
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return schema;
}

/**
 * Generate organization structured data
 */
export function generateOrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LawnQuote",
    "url": "https://lawnquote.com",
    "logo": "https://lawnquote.com/logo.png",
    "description": "Professional quote management software for landscaping and lawn care businesses",
    "sameAs": [
      // Add social media URLs when available
    ]
  };

  return schema;
}

/**
 * Utility to safely stringify JSON-LD for HTML insertion
 */
export function stringifySchema(schema: any): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Generate complete schema markup for a blog post page
 */
export function generatePageSchema(data: BlogPostSchemaData) {
  const schemas = generateCombinedSchema(data);
  
  // Add breadcrumb schema
  const breadcrumbItems = [
    { name: "Home", url: "https://lawnquote.com" },
    { name: "Blog", url: "https://lawnquote.com/blog" },
    { name: data.title, url: data.url }
  ];
  
  schemas.push(generateBreadcrumbSchema(breadcrumbItems));
  schemas.push(generateOrganizationSchema());

  return schemas;
}
