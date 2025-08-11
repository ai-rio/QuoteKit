import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { LawnQuoteLogoHorizontal } from '@/components/branding/lawn-quote-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-light-concrete flex items-center justify-center p-6">
      <div className="flex flex-col gap-6 w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <LawnQuoteLogoHorizontal />
        </div>

        {/* Error Card */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-charcoal">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              We encountered an issue while signing you in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-charcoal/80">
                The authentication process was interrupted or failed. This could happen if:
              </p>
              <ul className="text-sm text-charcoal/70 text-left space-y-2">
                <li>• You cancelled the sign-in process</li>
                <li>• There was a network connection issue</li>
                <li>• The authentication session expired</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-forest-green text-paper-white hover:opacity-90">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">
                  Create New Account
                </Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-charcoal/60">
                Still having trouble?{' '}
                <Link 
                  href="/contact" 
                  className="text-forest-green hover:text-forest-green/90 underline-offset-4 hover:underline"
                >
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
