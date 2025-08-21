import { AlertTriangle,Shield } from 'lucide-react'
import { Metadata } from 'next'
import React from 'react'

import FormbricksDebugPanel from '@/components/feedback/formbricks-debug-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Formbricks Debug Console - QuoteKit',
  description: 'Debug and test Formbricks integration',
  robots: {
    index: false,
    follow: false
  }
}

export default function FormbricksDebugPage() {
  // Only show in development or to admin users
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              Debug tools are only available in development mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This debug console is restricted to development environments for security reasons.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
      <div className="container mx-auto py-8 px-4">
        {/* Development Warning */}
        <div className="mb-6">
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Development Mode</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                This debug console is only available in development. It provides comprehensive testing 
                and diagnostic tools for the Formbricks integration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Debug Panel */}
        <FormbricksDebugPanel />
      </div>
    </div>
  )
}