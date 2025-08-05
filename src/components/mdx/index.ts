/**
 * MDX Components Index
 * Centralized exports for all custom MDX components
 */

// Callout components
export { 
  Callout,
  type CalloutVariant,
  ErrorCallout,
  InfoCallout,
  SuccessCallout,
  TipCallout,
  WarningCallout} from './Callout';

// Code block components
export {
  BashCode,
  CodeBlock,
  JavaScriptCode,
  SQLCode,
  TypeScriptCode
} from './CodeBlock';

// Interactive components
export {
  MowingCalculator,
  PricingCalculator,
  SeasonalCalculator
} from './PricingCalculator';

// SEO/GEO Components for advanced blog features
export { default as ArticleHero } from './ArticleHero';
export { default as FAQAccordion } from './FAQAccordion';
export { default as KeyTakeaways } from './KeyTakeaways';
export { default as MaterialCostTable } from './MaterialCostTable';
export { default as TableOfContents } from './TableOfContents';
