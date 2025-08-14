/**
 * CodeBlock Component for MDX Content
 * Provides syntax-highlighted code blocks with copy functionality
 */

'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({ 
  children, 
  language = 'text', 
  title, 
  showLineNumbers = false,
  className 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Extract text content from children (handles both string and React nodes)
  const getTextContent = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children;
    }
    
    if (React.isValidElement(children)) {
      // If it's a React element, try to extract text from props.children
      if (typeof children.props?.children === 'string') {
        return children.props.children;
      }
      
      // Handle nested elements by recursively extracting text
      if (children.props?.children) {
        return getTextContent(children.props.children);
      }
    }
    
    if (Array.isArray(children)) {
      return children.map(child => getTextContent(child)).join('');
    }
    
    // Fallback: convert to string
    return String(children || '');
  };

  const textContent = getTextContent(children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Split code into lines for line numbers
  const lines = textContent.split('\n');

  return (
    <div className={cn('relative group mb-6', className)}>
      {/* Header with title and copy button */}
      {(title || true) && (
        <div className="flex items-center justify-between bg-charcoal text-paper-white px-4 py-2 rounded-t-lg border-b border-stone-gray">
          <span className="text-sm font-medium text-stone-gray">
            {title || language}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 text-stone-gray hover:text-paper-white hover:bg-stone-gray/20"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
      
      {/* Code content */}
      <div className="relative">
        <pre className={cn(
          'bg-charcoal text-paper-white p-4 overflow-x-auto text-sm leading-relaxed',
          title ? 'rounded-b-lg' : 'rounded-lg',
          showLineNumbers && 'pl-12'
        )}>
          {showLineNumbers && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-stone-gray/20 border-r border-stone-gray/30 flex flex-col text-stone-gray text-xs">
              {lines.map((_, index) => (
                <span 
                  key={index} 
                  className="px-2 py-0 leading-relaxed text-right"
                >
                  {index + 1}
                </span>
              ))}
            </div>
          )}
          <code className={cn(
            'font-mono text-sm',
            getLanguageClass(language)
          )}>
            {textContent}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Simple syntax highlighting classes (can be enhanced with a proper syntax highlighter)
function getLanguageClass(language: string): string {
  const languageClasses: Record<string, string> = {
    javascript: 'language-javascript',
    typescript: 'language-typescript',
    jsx: 'language-jsx',
    tsx: 'language-tsx',
    css: 'language-css',
    html: 'language-html',
    json: 'language-json',
    bash: 'language-bash',
    shell: 'language-shell',
    sql: 'language-sql',
    python: 'language-python',
    text: 'language-text',
  };
  
  return languageClasses[language] || 'language-text';
}

// Convenience components for common languages
export const JavaScriptCode = (props: Omit<CodeBlockProps, 'language'>) => (
  <CodeBlock language="javascript" {...props} />
);

export const TypeScriptCode = (props: Omit<CodeBlockProps, 'language'>) => (
  <CodeBlock language="typescript" {...props} />
);

export const BashCode = (props: Omit<CodeBlockProps, 'language'>) => (
  <CodeBlock language="bash" {...props} />
);

export const SQLCode = (props: Omit<CodeBlockProps, 'language'>) => (
  <CodeBlock language="sql" {...props} />
);
