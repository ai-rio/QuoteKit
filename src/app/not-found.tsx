import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-light-concrete flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-charcoal">404</h1>
          <h2 className="text-2xl font-semibold text-charcoal">Page Not Found</h2>
          <p className="text-charcoal/70 max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="inline-block bg-equipment-yellow text-charcoal px-6 py-3 rounded-lg font-semibold hover:bg-equipment-yellow/90 transition-colors"
          >
            Go to Dashboard
          </Link>
          
          <div>
            <Link 
              href="/"
              className="text-charcoal/70 hover:text-charcoal underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}