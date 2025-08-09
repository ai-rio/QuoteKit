/**
 * Heading Extraction Utilities
 * 
 * Utilities for extracting and processing headings from MDX content
 * to generate Table of Contents and navigation structures.
 */

export interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract headings from MDX content string
 * Looks for markdown headings (## and ###) and generates IDs
 */
export function extractHeadingsFromContent(content: string): TOCHeading[] {
  const headings: TOCHeading[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Match ## or ### headings (H2 and H3)
    const headingMatch = trimmedLine.match(/^(#{2,3})\s+(.+)$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length; // 2 for ##, 3 for ###
      const text = headingMatch[2].trim();
      const id = generateHeadingId(text);
      
      headings.push({
        id,
        text,
        level
      });
    }
  }

  return headings;
}

// Track generated IDs to prevent duplicates
const generatedIds = new Map<string, number>();

/**
 * Generate a URL-safe ID from heading text
 */
export function generateHeadingId(text: string): string {
  const baseId = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Handle duplicates by adding a counter
  const count = generatedIds.get(baseId) || 0;
  generatedIds.set(baseId, count + 1);
  
  return count === 0 ? baseId : `${baseId}-${count}`;
}

/**
 * Extract headings from rendered HTML (for client-side TOC)
 * This is useful when the content is already rendered and we need to build TOC
 */
export function extractHeadingsFromDOM(container?: Element): TOCHeading[] {
  const headings: TOCHeading[] = [];
  const selector = 'h2[data-toc], h3[data-toc], h2, h3';
  const elements = container 
    ? container.querySelectorAll(selector)
    : document.querySelectorAll(selector);

  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    const level = tagName === 'h2' ? 2 : 3;
    const text = element.textContent?.trim() || '';
    let id = element.id;

    // Generate ID if not present
    if (!id) {
      id = generateHeadingId(text);
      element.id = id;
    }

    headings.push({
      id,
      text,
      level
    });
  });

  return headings;
}

/**
 * Add data-toc attributes to headings in content
 * This helps with TOC generation and scroll tracking
 */
export function addTOCAttributes(content: string): string {
  return content.replace(/^(#{2,3})\s+(.+)$/gm, (match, hashes, text) => {
    const id = generateHeadingId(text.trim());
    return `${hashes} ${text.trim()} {#${id} data-toc}`;
  });
}

/**
 * Filter headings by level (useful for nested TOCs)
 */
export function filterHeadingsByLevel(headings: TOCHeading[], maxLevel: number = 3): TOCHeading[] {
  return headings.filter(heading => heading.level <= maxLevel);
}

/**
 * Group headings into hierarchical structure
 */
export interface NestedHeading extends TOCHeading {
  children: NestedHeading[];
}

export function nestHeadings(headings: TOCHeading[]): NestedHeading[] {
  const nested: NestedHeading[] = [];
  const stack: NestedHeading[] = [];

  for (const heading of headings) {
    const nestedHeading: NestedHeading = {
      ...heading,
      children: []
    };

    // Find the appropriate parent
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level heading
      nested.push(nestedHeading);
    } else {
      // Child heading
      stack[stack.length - 1].children.push(nestedHeading);
    }

    stack.push(nestedHeading);
  }

  return nested;
}

/**
 * Validate heading structure (ensure proper hierarchy)
 */
export function validateHeadingStructure(headings: TOCHeading[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let previousLevel = 1; // Start with H1 level

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    
    // Check for skipped levels (e.g., H2 -> H4)
    if (heading.level > previousLevel + 1) {
      errors.push(
        `Heading "${heading.text}" (H${heading.level}) skips levels. ` +
        `Previous heading was H${previousLevel}.`
      );
    }

    // Check for duplicate IDs
    const duplicates = headings.filter((h, index) => 
      index !== i && h.id === heading.id
    );
    
    if (duplicates.length > 0) {
      errors.push(
        `Duplicate heading ID "${heading.id}" found for "${heading.text}"`
      );
    }

    previousLevel = heading.level;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
