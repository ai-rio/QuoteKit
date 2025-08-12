'use client';

import { AlertCircle, Check, Download, Plus, RefreshCw, Settings, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { EnhancedButton } from './enhanced-button';

/**
 * Button Showcase Component
 * Demonstrates all enhanced button variants with proper contrast ratios
 * Use this component for testing and documentation purposes
 */
export function ButtonShowcase() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleLoadingDemo = (variant: string) => {
    setLoading(variant);
    setTimeout(() => setLoading(null), 2000);
  };

  return (
    <div className="space-y-8 p-8 bg-light-concrete min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-forest-green mb-2">Enhanced Button System</h1>
        <p className="text-lg text-charcoal mb-8">
          All button variants meet WCAG AA accessibility standards with proper contrast ratios
        </p>

        {/* Primary Variants */}
        <Card className="mb-8 bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-forest-green">Primary Variants</CardTitle>
            <CardDescription className="text-charcoal">
              Main action buttons with high contrast ratios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Primary (11.62:1 - AAA)</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="primary" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Small
                  </EnhancedButton>
                  <EnhancedButton variant="primary" size="default">
                    <Settings className="h-4 w-4 mr-2" />
                    Default
                  </EnhancedButton>
                  <EnhancedButton variant="primary" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Large
                  </EnhancedButton>
                  <EnhancedButton 
                    variant="primary" 
                    size="xl"
                    onClick={() => handleLoadingDemo('primary')}
                    disabled={loading === 'primary'}
                  >
                    {loading === 'primary' ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Extra Large
                      </>
                    )}
                  </EnhancedButton>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Secondary (9.37:1 - AAA)</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="secondary" size="sm">Small</EnhancedButton>
                  <EnhancedButton variant="secondary" size="default">Default</EnhancedButton>
                  <EnhancedButton variant="secondary" size="lg">Large</EnhancedButton>
                  <EnhancedButton variant="secondary" size="xl" disabled>
                    Disabled
                  </EnhancedButton>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Success (5.47:1 - AA)</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="success" size="sm">
                    <Check className="h-3 w-3 mr-1" />
                    Small
                  </EnhancedButton>
                  <EnhancedButton variant="success" size="default">
                    <Check className="h-4 w-4 mr-2" />
                    Default
                  </EnhancedButton>
                  <EnhancedButton variant="success" size="lg">
                    <Check className="h-4 w-4 mr-2" />
                    Large
                  </EnhancedButton>
                  <EnhancedButton variant="success" size="xl">
                    <Check className="h-5 w-5 mr-2" />
                    Extra Large
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destructive & Outline Variants */}
        <Card className="mb-8 bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-forest-green">Destructive & Outline Variants</CardTitle>
            <CardDescription className="text-charcoal">
              Warning actions and secondary buttons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Destructive (4.83:1 - AA)</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="destructive" size="sm">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </EnhancedButton>
                  <EnhancedButton variant="destructive" size="default">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </EnhancedButton>
                  <EnhancedButton variant="destructive" size="lg">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Remove
                  </EnhancedButton>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Outline (17.04:1 - AAA)</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="outline" size="sm">Small</EnhancedButton>
                  <EnhancedButton variant="outline" size="default">Default</EnhancedButton>
                  <EnhancedButton variant="outline" size="lg">Large</EnhancedButton>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Outline Primary</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="outline-primary" size="sm">Small</EnhancedButton>
                  <EnhancedButton variant="outline-primary" size="default">Default</EnhancedButton>
                  <EnhancedButton variant="outline-primary" size="lg">Large</EnhancedButton>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Outline Destructive</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="outline-destructive" size="sm">
                    <X className="h-3 w-3 mr-1" />
                    Small
                  </EnhancedButton>
                  <EnhancedButton variant="outline-destructive" size="default">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Default
                  </EnhancedButton>
                  <EnhancedButton variant="outline-destructive" size="lg">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Large
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minimal Variants */}
        <Card className="mb-8 bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-forest-green">Minimal Variants</CardTitle>
            <CardDescription className="text-charcoal">
              Ghost and link buttons for subtle actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Ghost (15.63:1 - AAA)</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="ghost" size="sm">Small Ghost</EnhancedButton>
                  <EnhancedButton variant="ghost" size="default">Default Ghost</EnhancedButton>
                  <EnhancedButton variant="ghost" size="lg">Large Ghost</EnhancedButton>
                  <EnhancedButton variant="ghost" size="xl">Extra Large Ghost</EnhancedButton>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-charcoal">Link</h4>
                <div className="space-y-2">
                  <EnhancedButton variant="link" size="sm">Small Link</EnhancedButton>
                  <EnhancedButton variant="link" size="default">Default Link</EnhancedButton>
                  <EnhancedButton variant="link" size="lg">Large Link</EnhancedButton>
                  <EnhancedButton variant="link" size="xl">Extra Large Link</EnhancedButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Icon Buttons */}
        <Card className="mb-8 bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-forest-green">Icon Buttons</CardTitle>
            <CardDescription className="text-charcoal">
              Square buttons for icon-only actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <EnhancedButton variant="primary" size="icon-sm">
                <Plus className="h-3 w-3" />
              </EnhancedButton>
              <EnhancedButton variant="primary" size="icon">
                <Settings className="h-4 w-4" />
              </EnhancedButton>
              <EnhancedButton variant="primary" size="icon-lg">
                <Download className="h-5 w-5" />
              </EnhancedButton>
              
              <EnhancedButton variant="outline" size="icon-sm">
                <RefreshCw className="h-3 w-3" />
              </EnhancedButton>
              <EnhancedButton variant="outline" size="icon">
                <Check className="h-4 w-4" />
              </EnhancedButton>
              <EnhancedButton variant="outline" size="icon-lg">
                <AlertCircle className="h-5 w-5" />
              </EnhancedButton>

              <EnhancedButton variant="destructive" size="icon-sm">
                <X className="h-3 w-3" />
              </EnhancedButton>
              <EnhancedButton variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </EnhancedButton>
              <EnhancedButton variant="destructive" size="icon-lg">
                <AlertCircle className="h-5 w-5" />
              </EnhancedButton>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Information */}
        <Card className="bg-blue-50 border-blue-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">Accessibility Features</CardTitle>
            <CardDescription className="text-blue-600">
              All buttons meet WCAG accessibility standards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-blue-800 mb-2">Contrast Ratios</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>✅ Primary: 11.62:1 (AAA)</li>
                  <li>✅ Secondary: 9.37:1 (AAA)</li>
                  <li>✅ Success: 5.47:1 (AA)</li>
                  <li>✅ Destructive: 4.83:1 (AA)</li>
                  <li>✅ Outline: 17.04:1 (AAA)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 mb-2">Features</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>✅ Keyboard navigation support</li>
                  <li>✅ Focus indicators</li>
                  <li>✅ Screen reader compatible</li>
                  <li>✅ Consistent typography</li>
                  <li>✅ State management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
