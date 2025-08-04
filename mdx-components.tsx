/**
 * MDX Components Configuration
 * Defines custom components and styling for MDX content
 */

import type { MDXComponents } from 'mdx/types';
import { 
  Callout,
  InfoCallout,
  WarningCallout,
  SuccessCallout,
  ErrorCallout,
  TipCallout,
  CodeBlock,
  JavaScriptCode,
  TypeScriptCode,
  BashCode,
  SQLCode,
  PricingCalculator,
  MowingCalculator,
  SeasonalCalculator
} from '@/components/mdx';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Style default HTML elements with LawnQuote design system per style guide
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-forest-green mb-6 mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold text-forest-green mb-4 mt-8">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold text-forest-green mb-3 mt-6">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-semibold text-forest-green mb-2 mt-4">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-lg text-charcoal mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-lg text-charcoal mb-4 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-lg text-charcoal mb-4 space-y-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-lg text-charcoal">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-equipment-yellow pl-6 py-2 mb-4 bg-light-concrete italic text-lg text-charcoal">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-stone-gray px-2 py-1 rounded text-sm font-mono text-charcoal">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-charcoal text-paper-white p-4 rounded-lg mb-4 overflow-x-auto">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="text-forest-green hover:text-equipment-yellow underline transition-colors font-medium"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      <img 
        src={src} 
        alt={alt} 
        className="w-full rounded-lg mb-4 shadow-md"
      />
    ),
    hr: () => (
      <hr className="border-stone-gray my-8" />
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-charcoal">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-charcoal">
        {children}
      </em>
    ),

    // Custom MDX Components
    Callout,
    InfoCallout,
    WarningCallout,
    SuccessCallout,
    ErrorCallout,
    TipCallout,
    CodeBlock,
    JavaScriptCode,
    TypeScriptCode,
    BashCode,
    SQLCode,
    PricingCalculator,
    MowingCalculator,
    SeasonalCalculator,
    
    // Override any custom components passed in
    ...components,
  };
}