import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobalItemsManagement } from '@/features/admin/components/GlobalItemsManagement';

export default function GlobalItemsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-charcoal">Global Items Library</h1>
        <p className="text-charcoal/70 mt-2">
          Manage prepopulated categories and items available to users based on their subscription tier
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-paper-white border-stone-gray">
          <CardHeader>
            <CardTitle className="text-charcoal">Tiered Access System</CardTitle>
            <CardDescription className="text-charcoal/60">
              Control which items are available to free vs paid customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-light-concrete rounded-lg">
                <h3 className="font-semibold text-charcoal">Free Tier</h3>
                <p className="text-sm text-charcoal/60 mt-1">
                  Basic lawn maintenance items and general labor
                </p>
              </div>
              <div className="p-4 bg-light-concrete rounded-lg">
                <h3 className="font-semibold text-charcoal">Paid Tier</h3>
                <p className="text-sm text-charcoal/60 mt-1">
                  Professional services, materials, and treatments
                </p>
              </div>
              <div className="p-4 bg-light-concrete rounded-lg">
                <h3 className="font-semibold text-charcoal">Premium Tier</h3>
                <p className="text-sm text-charcoal/60 mt-1">
                  Advanced hardscaping, irrigation, and installation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Suspense fallback={
          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-forest-green" />
            </CardContent>
          </Card>
        }>
          <GlobalItemsManagement />
        </Suspense>
      </div>
    </div>
  );
}