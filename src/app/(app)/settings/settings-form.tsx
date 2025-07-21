'use client';

import { FormEvent, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { saveCompanySettings } from '@/features/settings/actions';
import { CompanySettings } from '@/features/settings/types';

interface SettingsFormProps {
  initialSettings: CompanySettings | null;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const response = await saveCompanySettings(formData);

    if (response.error) {
      setError(response.error.message || 'Failed to save settings');
    } else {
      toast({
        description: 'Settings saved successfully',
      });
    }

    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              name="company_name"
              placeholder="Your Company Name"
              defaultValue={initialSettings?.company_name || ''}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="company-address">Address</Label>
            <Input
              id="company-address"
              name="company_address"
              placeholder="123 Main St, City, State"
              defaultValue={initialSettings?.company_address || ''}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="company-phone">Phone Number</Label>
            <Input
              id="company-phone"
              name="company_phone"
              type="tel"
              placeholder="(555) 123-4567"
              defaultValue={initialSettings?.company_phone || ''}
            />
          </div>

          <div className="grid gap-3">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={initialSettings?.logo_url || ''} />
                <AvatarFallback>Logo</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" disabled>
                Upload Logo (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Quote Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
            <Input
              id="tax-rate"
              name="default_tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="8.25"
              defaultValue={initialSettings?.default_tax_rate || ''}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="markup-rate">Default Profit Markup (%)</Label>
            <Input
              id="markup-rate"
              name="default_markup_rate"
              type="number"
              step="0.01"
              min="0"
              max="1000"
              placeholder="20.00"
              defaultValue={initialSettings?.default_markup_rate || ''}
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}