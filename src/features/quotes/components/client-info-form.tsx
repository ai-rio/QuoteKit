'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClientInfoFormProps {
  clientName: string;
  clientContact: string;
  onClientNameChange: (value: string) => void;
  onClientContactChange: (value: string) => void;
}

export function ClientInfoForm({ 
  clientName, 
  clientContact, 
  onClientNameChange, 
  onClientContactChange 
}: ClientInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <Label htmlFor="client-name">Client Name *</Label>
          <Input
            id="client-name"
            placeholder="John Smith"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="client-contact">Contact Information</Label>
          <Input
            id="client-contact"
            placeholder="john@example.com or (555) 123-4567"
            value={clientContact}
            onChange={(e) => onClientContactChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}