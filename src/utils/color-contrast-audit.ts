/**
 * Color Contrast Audit Utility
 * Ensures WCAG AAA compliance for typography color combinations
 */

// Color values from our design system
export const COLORS = {
  'forest-green': '#2A3D2F',      // hsl(147, 21%, 20%)
  'equipment-yellow': '#F2B705',   // hsl(47, 95%, 49%)
  'light-concrete': '#F5F5F5',    // hsl(0, 0%, 96%)
  'stone-gray': '#D7D7D7',        // hsl(0, 0%, 85%)
  'charcoal': '#1C1C1C',          // hsl(0, 0%, 11%)
  'paper-white': '#FFFFFF',       // hsl(0, 0%, 100%)
  'success-green': '#0f7a2a',     // hsl(142, 69%, 30%)
  'error-red': '#dc2626',         // hsl(0, 84%, 60%)
  'info-blue': '#2563eb',         // hsl(221, 83%, 53%)
} as const;

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG standards
 */
export function checkWCAGCompliance(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AAA',
  size: 'normal' | 'large' = 'normal'
): {
  ratio: number;
  passes: boolean;
  level: string;
  recommendation?: string;
} {
  const ratio = getContrastRatio(foreground, background);
  
  let requiredRatio: number;
  if (level === 'AAA') {
    requiredRatio = size === 'large' ? 4.5 : 7;
  } else {
    requiredRatio = size === 'large' ? 3 : 4.5;
  }
  
  const passes = ratio >= requiredRatio;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes,
    level: `WCAG ${level} ${size}`,
    recommendation: !passes ? 
      `Needs ${requiredRatio}:1 ratio, currently ${Math.round(ratio * 100) / 100}:1` : 
      undefined
  };
}

/**
 * Audit current blog typography color combinations
 */
export function auditBlogTypography(): Array<{
  element: string;
  foreground: string;
  background: string;
  current: ReturnType<typeof checkWCAGCompliance>;
  improved?: {
    foreground: string;
    background: string;
    compliance: ReturnType<typeof checkWCAGCompliance>;
  };
}> {
  const combinations = [
    // Current MDX typography combinations
    { element: 'h1, h2, h3, h4', foreground: COLORS['forest-green'], background: COLORS['paper-white'] },
    { element: 'p, li, td', foreground: COLORS['charcoal'], background: COLORS['paper-white'] },
    { element: 'blockquote', foreground: COLORS['charcoal'], background: COLORS['light-concrete'] },
    { element: 'inline code', foreground: COLORS['charcoal'], background: COLORS['light-concrete'] },
    { element: 'pre code', foreground: COLORS['paper-white'], background: COLORS['charcoal'] },
    { element: 'links', foreground: COLORS['forest-green'], background: COLORS['paper-white'] },
    { element: 'links:hover', foreground: COLORS['equipment-yellow'], background: COLORS['paper-white'] },
    { element: 'table headers', foreground: COLORS['forest-green'], background: COLORS['light-concrete'] },
  ];

  return combinations.map(combo => {
    const current = checkWCAGCompliance(combo.foreground, combo.background, 'AAA', 'normal');
    
    let improved;
    if (!current.passes) {
      // Suggest improvements
      if (combo.element.includes('h1') || combo.element.includes('h2')) {
        // Large text - can use lower contrast
        const largeTextCheck = checkWCAGCompliance(combo.foreground, combo.background, 'AAA', 'large');
        if (largeTextCheck.passes) {
          improved = {
            foreground: combo.foreground,
            background: combo.background,
            compliance: largeTextCheck
          };
        } else {
          // Use charcoal for better contrast
          improved = {
            foreground: COLORS['charcoal'],
            background: combo.background,
            compliance: checkWCAGCompliance(COLORS['charcoal'], combo.background, 'AAA', 'large')
          };
        }
      } else {
        // Normal text - needs high contrast
        improved = {
          foreground: COLORS['charcoal'],
          background: combo.background,
          compliance: checkWCAGCompliance(COLORS['charcoal'], combo.background, 'AAA', 'normal')
        };
      }
    }

    return {
      element: combo.element,
      foreground: combo.foreground,
      background: combo.background,
      current,
      improved
    };
  });
}

/**
 * Generate improved color recommendations
 */
export function getImprovedColorRecommendations() {
  const audit = auditBlogTypography();
  
  return {
    summary: {
      total: audit.length,
      passing: audit.filter(item => item.current.passes).length,
      failing: audit.filter(item => !item.current.passes).length,
    },
    recommendations: audit.filter(item => !item.current.passes),
    allResults: audit
  };
}
