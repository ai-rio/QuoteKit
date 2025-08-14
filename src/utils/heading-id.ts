/**
 * Shared Heading ID Generation Utility
 * Ensures consistent ID generation between MDX components and TOC extraction
 */

/**
 * Generate a URL-safe ID from heading text
 * This function is used by both MDX heading components and TOC extraction
 * to ensure IDs match perfectly for navigation
 */
export function generateHeadingId(text: string | React.ReactNode): string {
  // Convert React children to string
  let textString: string;
  
  if (typeof text === 'string') {
    textString = text;
  } else if (Array.isArray(text)) {
    textString = text.join('');
  } else if (text && typeof text === 'object' && 'toString' in text) {
    textString = text.toString();
  } else {
    textString = String(text || '');
  }

  // Generate URL-safe ID
  const id = textString
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
    .trim();

  // Return fallback if no valid ID could be generated
  return id || 'heading-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Extract text content from React children
 * Useful for getting plain text from complex React elements
 */
export function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  
  if (Array.isArray(children)) {
    return children.map(child => extractTextFromChildren(child)).join('');
  }
  
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as any).props.children);
  }
  
  return String(children || '');
}
