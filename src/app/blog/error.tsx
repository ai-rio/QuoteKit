'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BlogError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console for debugging, but safely handle undefined cases
    console.error('Blog error:', {
      message: error?.message || 'Unknown error',
      digest: error?.digest || 'No digest',
      name: error?.name || 'Unknown',
      // Safely access stack property
      stack: error?.stack || 'No stack trace available'
    })
  }, [error])

  return (
    <div className="min-h-screen bg-light-concrete flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-charcoal">Blog Error</h1>
          <h2 className="text-xl font-semibold text-forest-green">
            Something went wrong
          </h2>
          <p className="text-charcoal/70">
            We encountered an error while loading the blog content. This might be a temporary issue.
          </p>
          {error?.digest && (
            <p className="text-sm text-charcoal/50 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block bg-equipment-yellow text-charcoal px-6 py-3 rounded-lg font-semibold hover:bg-equipment-yellow/90 transition-colors"
          >
            Try Again
          </button>
          
          <div className="space-x-4">
            <Link 
              href="/blog"
              className="text-forest-green hover:text-equipment-yellow underline"
            >
              Back to Blog
            </Link>
            
            <Link 
              href="/"
              className="text-forest-green hover:text-equipment-yellow underline"
            >
              Go Home
            </Link>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-charcoal/70 hover:text-charcoal">
              Debug Information
            </summary>
            <div className="mt-2 p-4 bg-paper-white rounded-lg border border-stone-gray/20 text-xs font-mono">
              <div><strong>Message:</strong> {error?.message || 'No message'}</div>
              <div><strong>Name:</strong> {error?.name || 'No name'}</div>
              <div><strong>Digest:</strong> {error?.digest || 'No digest'}</div>
              {error?.stack && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1 text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}