#!/usr/bin/env node

/**
 * Button Contrast Ratio Verification Script
 * Validates that all button variants meet WCAG accessibility standards
 */

// Color definitions from the design system (HSL values converted to hex)
const colors = {
  'forest-green': '#2A3D2F',    // hsl(147, 21%, 20%)
  'equipment-yellow': '#F2B705', // hsl(47, 95%, 49%)
  'paper-white': '#FFFFFF',      // hsl(0, 0%, 100%)
  'charcoal': '#1C1C1C',        // hsl(0, 0%, 11%)
  'stone-gray': '#D7D7D7',      // hsl(0, 0%, 85%)
  'error-red': '#DC2626',       // hsl(0, 84%, 60%)
  'success-green': '#0F7A2A',   // hsl(142, 69%, 30%) - Updated for better contrast
  'light-concrete': '#F5F5F5',  // hsl(0, 0%, 96%)
};

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance
function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// WCAG compliance levels
function getComplianceLevel(ratio) {
  if (ratio >= 7) return 'AAA (Enhanced)';
  if (ratio >= 4.5) return 'AA (Standard)';
  if (ratio >= 3) return 'AA Large Text';
  return 'FAIL';
}

// Button variant definitions
const buttonVariants = [
  {
    name: 'Primary',
    background: colors['forest-green'],
    text: colors['paper-white'],
    description: 'Main actions, primary CTAs'
  },
  {
    name: 'Secondary', 
    background: colors['equipment-yellow'],
    text: colors['charcoal'],
    description: 'Secondary actions, alternative options'
  },
  {
    name: 'Destructive',
    background: colors['error-red'],
    text: colors['paper-white'],
    description: 'Delete, cancel, destructive actions'
  },
  {
    name: 'Success',
    background: colors['success-green'],
    text: colors['paper-white'],
    description: 'Confirmation, success actions'
  },
  {
    name: 'Outline',
    background: colors['paper-white'],
    text: colors['charcoal'],
    description: 'Secondary actions, neutral options'
  },
  {
    name: 'Outline Primary (Hover)',
    background: colors['forest-green'],
    text: colors['paper-white'],
    description: 'Outline primary button hover state'
  },
  {
    name: 'Outline Destructive (Hover)',
    background: colors['error-red'],
    text: colors['paper-white'],
    description: 'Outline destructive button hover state'
  },
  {
    name: 'Ghost (Hover)',
    background: colors['light-concrete'],
    text: colors['charcoal'],
    description: 'Ghost button hover state'
  }
];

console.log('🎨 Button Contrast Ratio Verification\n');
console.log('=' .repeat(80));

let allPassed = true;

buttonVariants.forEach(variant => {
  const ratio = getContrastRatio(variant.background, variant.text);
  const compliance = getComplianceLevel(ratio);
  const passed = ratio >= 4.5;
  
  if (!passed) allPassed = false;
  
  const status = passed ? '✅' : '❌';
  
  console.log(`${status} ${variant.name}`);
  console.log(`   Background: ${variant.background}`);
  console.log(`   Text: ${variant.text}`);
  console.log(`   Contrast Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`   Compliance: ${compliance}`);
  console.log(`   Usage: ${variant.description}`);
  console.log('');
});

console.log('=' .repeat(80));

if (allPassed) {
  console.log('🎉 All button variants meet WCAG AA accessibility standards!');
  process.exit(0);
} else {
  console.log('⚠️  Some button variants do not meet accessibility standards.');
  console.log('   Please review and adjust color combinations.');
  process.exit(1);
}
