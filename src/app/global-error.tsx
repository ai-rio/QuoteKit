'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Safely log the error without accessing undefined properties
    console.error('Global application error:', {
      message: error?.message || 'Unknown global error',
      digest: error?.digest || 'No digest',
      name: error?.name || 'Unknown',
      // Use optional chaining and nullish coalescing for stack
      stack: error?.stack ?? 'No stack trace available',
      timestamp: new Date().toISOString()
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-light-concrete flex items-center justify-center px-4">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-charcoal">Application Error</h1>
              <h2 className="text-xl font-semibold text-forest-green">
                Something went wrong
              </h2>
              <p className="text-charcoal/70">
                We encountered a critical error. Please try refreshing the page or contact support if the problem persists.
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
                  href="/"
                  className="text-forest-green hover:text-equipment-yellow underline"
                >
                  Go Home
                </Link>
                
                <button
                  onClick={() => window.location.reload()}
                  className="text-forest-green hover:text-equipment-yellow underline"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-charcoal/70 hover:text-charcoal">
                  Debug Information
                </summary>
                <div className="mt-2 p-4 bg-paper-white rounded-lg border border-stone-gray/20 text-xs font-mono">
                  <div><strong>Message:</strong> {error.message || 'No message'}</div>
                  <div><strong>Name:</strong> {error.name || 'No name'}</div>
                  <div><strong>Digest:</strong> {error.digest || 'No digest'}</div>
                  {error.stack && (
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
      </body>
    </html>
  )
}