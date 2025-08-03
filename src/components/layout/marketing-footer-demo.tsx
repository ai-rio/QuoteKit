/**
 * Demo/Example component showing how to use the MarketingFooter
 * This is for development reference only - remove in production
 */

import { MarketingFooter } from './marketing-footer'

export function MarketingFooterDemo() {
  return (
    <div className="min-h-screen bg-light-concrete">
      {/* Demo content */}
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-charcoal mb-4">
          Marketing Footer Demo
        </h1>
        <p className="text-charcoal/70 max-w-2xl mx-auto">
          Scroll down to see the LawnQuote marketing footer in action.
          This footer includes navigation sections, social links, newsletter signup,
          and uses the brand color palette.
        </p>
      </div>
      
      {/* Demo features */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-paper-white p-6 rounded-lg border border-stone-gray/30">
            <h3 className="font-semibold text-charcoal mb-2">Features</h3>
            <ul className="text-sm text-charcoal/70 space-y-1">
              <li>• Responsive design (mobile-first)</li>
              <li>• Accessible navigation with ARIA labels</li>
              <li>• Brand color integration</li>
              <li>• Social media links with icons</li>
              <li>• Newsletter subscription form</li>
              <li>• SEO-friendly structure</li>
            </ul>
          </div>
          
          <div className="bg-paper-white p-6 rounded-lg border border-stone-gray/30">
            <h3 className="font-semibold text-charcoal mb-2">Usage</h3>
            <pre className="text-xs text-charcoal/70 bg-light-concrete p-3 rounded border overflow-x-auto">
{`import { MarketingFooter } from '@/components/layout/marketing-footer'

export default function Layout() {
  return (
    <div>
      <main>{/* Your content */}</main>
      <MarketingFooter />
    </div>
  )
}`}
            </pre>
          </div>
        </div>
      </div>
      
      {/* The actual footer */}
      <MarketingFooter />
    </div>
  )
}