#!/usr/bin/env node

/**
 * Color Contrast Audit Script
 * Run this to check WCAG AAA compliance for blog typography
 */

// Simple implementation for Node.js environment
const COLORS = {
  'forest-green': '#2A3D2F',
  'equipment-yellow': '#F2B705',
  'light-concrete': '#F5F5F5',
  'stone-gray': '#D7D7D7',
  'charcoal': '#1C1C1C',
  'paper-white': '#FFFFFF',
  'success-green': '#0f7a2a',
  'error-red': '#dc2626',
  'info-blue': '#2563eb',
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

function checkCompliance(foreground, background, requiredRatio = 7) {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= requiredRatio,
    required: requiredRatio
  };
}

console.log('🎨 QuoteKit Blog Typography Color Contrast Audit\n');
console.log('WCAG AAA Standard: 7:1 for normal text, 4.5:1 for large text\n');

const combinations = [
  { element: 'Headings (H1-H4)', fg: COLORS['forest-green'], bg: COLORS['paper-white'], large: true },
  { element: 'Body Text (p, li)', fg: COLORS['charcoal'], bg: COLORS['paper-white'], large: false },
  { element: 'Blockquotes', fg: COLORS['charcoal'], bg: COLORS['light-concrete'], large: false },
  { element: 'Inline Code', fg: COLORS['charcoal'], bg: COLORS['light-concrete'], large: false },
  { element: 'Code Blocks', fg: COLORS['paper-white'], bg: COLORS['charcoal'], large: false },
  { element: 'Links', fg: COLORS['forest-green'], bg: COLORS['paper-white'], large: false },
  { element: 'Links Hover', fg: COLORS['equipment-yellow'], bg: COLORS['paper-white'], large: false },
  { element: 'Table Headers', fg: COLORS['forest-green'], bg: COLORS['light-concrete'], large: false },
];

let totalTests = 0;
let passingTests = 0;

combinations.forEach(combo => {
  const requiredRatio = combo.large ? 4.5 : 7;
  const result = checkCompliance(combo.fg, combo.bg, requiredRatio);
  
  totalTests++;
  if (result.passes) passingTests++;
  
  const status = result.passes ? '✅ PASS' : '❌ FAIL';
  const standard = combo.large ? 'AAA Large' : 'AAA Normal';
  
  console.log(`${status} ${combo.element}`);
  console.log(`   Ratio: ${result.ratio}:1 (${standard} requires ${result.required}:1)`);
  console.log(`   Colors: ${combo.fg} on ${combo.bg}`);
  
  if (!result.passes) {
    console.log(`   🔧 Recommendation: Use charcoal (#1C1C1C) for better contrast`);
  }
  console.log('');
});

console.log(`📊 Summary: ${passingTests}/${totalTests} combinations pass WCAG AAA standards`);

if (passingTests < totalTests) {
  console.log('\n🚨 Action Required: Some color combinations need improvement for accessibility compliance');
  console.log('\n💡 Recommended fixes:');
  console.log('1. Use charcoal (#1C1C1C) for body text instead of forest-green');
  console.log('2. Consider forest-green only for large headings (H1, H2)');
  console.log('3. Ensure equipment-yellow links have sufficient contrast');
}
