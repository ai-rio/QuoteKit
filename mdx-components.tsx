/**
 * MDX Components Configuration
 * Defines custom components and styling for MDX content
 */

import type { MDXComponents } from 'mdx/types';
import React from 'react';

import { 
  ArticleHero,
  BashCode,
  BetaTestingJourney,
  Callout,
  CelebrationCallout,
  ChallengeCallout,
  CodeBlock,
  ErrorCallout,
  FAQAccordion,
  InfoCallout,
  JavaScriptCode,
  KeyTakeaways,
  MaterialCostTable,
  MilestoneCelebration,
  MotivationCallout,
  MowingCalculator,
  PricingCalculator,
  QuestCallout,
  RewardCallout,
  SeasonalCalculator,
  SQLCode,
  SuccessCallout,
  TableOfContents,
  TestingScenarios,
  TipCallout,
  TOCDebug,
  TypeScriptCode,
  WarningCallout} from '@/components/mdx';
import { generateHeadingId } from '@/utils/heading-id';


export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Style default HTML elements with LawnQuote design system per style guide
    // FIXED: Proper typography hierarchy with font-black for H1/H2, font-bold for H3
    // ENHANCED: Added ID generation for TOC navigation
    h1: ({ children }) => {
      const id = generateHeadingId(children);
      
      return (
        <h1 id={id} className="text-4xl md:text-6xl font-black text-forest-green mb-8 mt-12 first:mt-0">
          {children}
        </h1>
      );
    },
    h2: ({ children }) => {
      const id = generateHeadingId(children);
      
      return (
        <h2 id={id} className="text-3xl md:text-4xl font-black text-forest-green mb-6 mt-10">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = generateHeadingId(children);
      
      return (
        <h3 id={id} className="text-xl md:text-2xl font-bold text-forest-green mb-4 mt-8">
          {children}
        </h3>
      );
    },
    h4: ({ children }) => {
      const id = generateHeadingId(children);
      
      return (
        <h4 id={id} className="text-lg md:text-xl font-bold text-forest-green mb-3 mt-6">
          {children}
        </h4>
      );
    },
    // FIXED: Body text uses text-lg text-charcoal per style guide (not text-sm text-stone-gray)
    p: ({ children }) => (
      <p className="text-lg text-charcoal mb-6 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-lg text-charcoal mb-6 space-y-2 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-lg text-charcoal mb-6 space-y-2 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-lg text-charcoal leading-relaxed">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="
        border-l-4 
        border-equipment-yellow 
        pl-8 
        py-4 
        mb-6 
        bg-light-concrete 
        italic 
        text-lg 
        text-charcoal
        rounded-r-lg
      ">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="
        bg-light-concrete 
        px-2 
        py-1 
        rounded 
        text-base 
        font-mono 
        text-charcoal
        border
        border-stone-gray/20
      ">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="
        bg-charcoal 
        text-paper-white 
        p-6 
        rounded-2xl 
        mb-6 
        overflow-x-auto
        border
        border-stone-gray/20
        shadow-lg
      ">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="
          text-forest-green 
          hover:text-charcoal
          focus:text-charcoal
          focus:outline-2
          focus:outline-forest-green
          focus:outline-offset-2
          underline 
          transition-colors 
          duration-200
          font-medium
        "
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
        className="w-full rounded-2xl mb-6 shadow-lg border border-stone-gray/20"
      />
    ),
    hr: () => (
      <hr className="border-stone-gray/30 my-12" />
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-charcoal">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-charcoal">
        {children}
      </em>
    ),
    // Tables with proper styling
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6">
        <table className="
          w-full 
          bg-paper-white 
          rounded-2xl 
          border 
          border-stone-gray/20 
          shadow-lg 
          overflow-hidden
        ">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-light-concrete">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="
        text-left 
        p-4 
        text-lg 
        font-bold 
        text-forest-green
        border-b 
        border-stone-gray/20
      ">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="
        p-4 
        text-lg 
        text-charcoal 
        border-b 
        border-stone-gray/10 
        last:border-b-0
      ">
        {children}
      </td>
    ),

    // Original Custom MDX Components
    Callout,
    InfoCallout,
    WarningCallout,
    SuccessCallout,
    ErrorCallout,
    TipCallout,
    CelebrationCallout,
    ChallengeCallout,
    MotivationCallout,
    QuestCallout,
    RewardCallout,
    CodeBlock,
    JavaScriptCode,
    TypeScriptCode,
    BashCode,
    SQLCode,
    PricingCalculator,
    MowingCalculator,
    SeasonalCalculator,
    
    // New SEO/GEO Components
    KeyTakeaways,
    FAQAccordion,
    MaterialCostTable,
    TableOfContents,
    ArticleHero,
    
    // Beta Testing Components
    BetaTestingJourney,
    TestingScenarios,
    MilestoneCelebration,
    
    // Debug Components (for development)
    TOCDebug,
    
    // Override any custom components passed in
    ...components,
  };
}
