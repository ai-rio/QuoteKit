'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { createClient, updateClient } from '../actions';
import { Client, ClientFormData, ClientFormErrors } from '../types';

interface ClientFormProps {
  client?: Client;
  onSuccess?: (client: Client) => void;
  onCancel?: () => void;
  showCard?: boolean;
}

export function ClientForm({ client, onSuccess, onCancel, showCard = true }: ClientFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    notes: client?.notes || '',
  });

  const isEditing = !!client;

  const validateForm = (): boolean => {
    const newErrors: ClientFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name.trim());
      formDataObj.append('email', formData.email.trim());
      formDataObj.append('phone', formData.phone.trim());
      formDataObj.append('address', formData.address.trim());
      formDataObj.append('notes', formData.notes.trim());

      try {
        const result = isEditing 
          ? await updateClient(client.id, formDataObj)
          : await createClient(formDataObj);

        if (result?.error) {
          setErrors({ name: result.error.message });
        } else if (result?.data) {
          onSuccess?.(result.data);
        }
      } catch (error) {
        setErrors({ name: 'An unexpected error occurred' });
      }
    });
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client Name - Required */}
      <div className="grid gap-3">
        <Label htmlFor="client-name" className="text-label text-charcoal font-medium">
          Client Name *
        </Label>
        <Input
          id="client-name"
          name="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Enter client name"
          required
        />
        {errors.name && (
          <p className="text-error-red text-sm font-medium">{errors.name}</p>
        )}
      </div>

      {/* Email and Phone - Side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-3">
          <Label htmlFor="client-email" className="text-label text-charcoal font-medium">
            Email
          </Label>
          <Input
            id="client-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            placeholder="client@example.com"
          />
          {errors.email && (
            <p className="text-error-red text-sm font-medium">{errors.email}</p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="client-phone" className="text-label text-charcoal font-medium">
            Phone
          </Label>
          <Input
            id="client-phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="text-error-red text-sm font-medium">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="grid gap-3">
        <Label htmlFor="client-address" className="text-label text-charcoal font-medium">
          Address
        </Label>
        <Input
          id="client-address"
          name="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="123 Main St, City, State 12345"
        />
        {errors.address && (
          <p className="text-error-red text-sm font-medium">{errors.address}</p>
        )}
      </div>

      {/* Notes */}
      <div className="grid gap-3">
        <Label htmlFor="client-notes" className="text-label text-charcoal font-medium">
          Notes
        </Label>
        <Textarea
          id="client-notes"
          name="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[100px] resize-none"
          placeholder="Additional notes about this client..."
        />
        {errors.notes && (
          <p className="text-error-red text-sm font-medium">{errors.notes}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="bg-paper-white text-charcoal border-2 border-stone-gray hover:bg-stone-gray/20 font-bold px-6 py-3 rounded-lg transition-all duration-200"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending || !formData.name.trim()}
          className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Client' : 'Create Client'
          )}
        </Button>
      </div>
    </form>
  );

  if (showCard) {
    return (
      <Card className="bg-paper-white border border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            {isEditing ? 'Edit Client' : 'New Client'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormContent />
        </CardContent>
      </Card>
    );
  }

  return <FormContent />;
}