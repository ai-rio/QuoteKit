'use client';

import { Loader2 } from 'lucide-react';
import { useEffect,useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { createClient, updateClient } from '../actions';
import { Client, ClientFormData, ClientFormErrors, CommercialClientFormData } from '../types';

interface ClientFormProps {
  client?: Client;
  onSuccess?: (client: Client) => void;
  onCancel?: () => void;
  showCard?: boolean;
}

export function ClientForm({ client, onSuccess, onCancel, showCard = true }: ClientFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [clientType, setClientType] = useState<'residential' | 'commercial'>(
    client?.client_type || 'residential'
  );

  // Initialize form data based on client type
  const initializeFormData = (): ClientFormData => {
    const baseData = {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      notes: client?.notes || '',
      client_status: client?.client_status || 'lead' as const,
      preferred_communication: client?.preferred_communication || '' as const,
    };

    if (clientType === 'commercial') {
      return {
        ...baseData,
        client_type: 'commercial',
        company_name: client?.company_name || '',
        billing_address: client?.billing_address || '',
        primary_contact_person: client?.primary_contact_person || '',
        tax_id: client?.tax_id || '',
        business_license: client?.business_license || '',
        service_area: client?.service_area || '',
        credit_terms: Number(client?.credit_terms ?? 30),
        credit_limit: Number(client?.credit_limit ?? 0),
      };
    }

    return {
      ...baseData,
      client_type: 'residential',
    };
  };

  const [formData, setFormData] = useState<ClientFormData>(initializeFormData());

  // Update form data when client type changes
  useEffect(() => {
    setFormData(initializeFormData());
  }, [clientType]);

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

    // Commercial client validation
    if (clientType === 'commercial') {
      const commercialData = formData as CommercialClientFormData;
      
      if (!commercialData.company_name.trim()) {
        newErrors.company_name = 'Company name is required for commercial clients';
      }
      
      if (!commercialData.primary_contact_person.trim()) {
        newErrors.primary_contact_person = 'Primary contact person is required for commercial clients';
      }

      const creditTerms = Number(commercialData.credit_terms);
      const creditLimit = Number(commercialData.credit_limit);

      if (isNaN(creditTerms) || creditTerms < 0 || creditTerms > 365) {
        newErrors.credit_terms = 'Credit terms must be between 0 and 365 days';
      }

      if (isNaN(creditLimit) || creditLimit < 0) {
        newErrors.credit_limit = 'Credit limit cannot be negative';
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
      
      // Base fields
      formDataObj.append('name', formData.name.trim());
      formDataObj.append('email', formData.email.trim());
      formDataObj.append('phone', formData.phone.trim());
      formDataObj.append('address', formData.address.trim());
      formDataObj.append('notes', formData.notes.trim());
      formDataObj.append('client_type', formData.client_type);
      formDataObj.append('client_status', formData.client_status);
      formDataObj.append('preferred_communication', formData.preferred_communication);

      // Commercial fields
      if (formData.client_type === 'commercial') {
        const commercialData = formData as CommercialClientFormData;
        formDataObj.append('company_name', commercialData.company_name.trim());
        formDataObj.append('billing_address', commercialData.billing_address.trim());
        formDataObj.append('primary_contact_person', commercialData.primary_contact_person.trim());
        formDataObj.append('tax_id', commercialData.tax_id.trim());
        formDataObj.append('business_license', commercialData.business_license.trim());
        formDataObj.append('service_area', commercialData.service_area.trim());
        formDataObj.append('credit_terms', commercialData.credit_terms.toString());
        formDataObj.append('credit_limit', commercialData.credit_limit.toString());
      }

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

  const handleInputChange = (field: keyof ClientFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClientTypeChange = (newType: 'residential' | 'commercial') => {
    setClientType(newType);
    setErrors({}); // Clear all errors when switching types
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Type Selection */}
      <div className="grid gap-3">
        <Label className="text-lg font-bold text-forest-green">
          Client Type *
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="client_type"
              value="residential"
              checked={clientType === 'residential'}
              onChange={(e) => handleClientTypeChange(e.target.value as 'residential')}
              className="w-4 h-4 text-forest-green border-stone-gray focus:ring-forest-green"
            />
            <span className="text-charcoal font-medium">Residential</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="client_type"
              value="commercial"
              checked={clientType === 'commercial'}
              onChange={(e) => handleClientTypeChange(e.target.value as 'commercial')}
              className="w-4 h-4 text-forest-green border-stone-gray focus:ring-forest-green"
            />
            <span className="text-charcoal font-medium">Commercial</span>
          </label>
        </div>
      </div>

      {/* Commercial Company Information */}
      {clientType === 'commercial' && (
        <div className="bg-light-concrete/30 p-6 rounded-2xl border border-stone-gray/20 space-y-4">
          <h3 className="text-xl font-bold text-forest-green">Company Information</h3>
          
          {/* Company Name - Required for commercial */}
          <div className="grid gap-3">
            <Label htmlFor="company-name" className="text-lg text-charcoal font-medium">
              Company Name *
            </Label>
            <Input
              id="company-name"
              name="company_name"
              value={(formData as CommercialClientFormData).company_name || ''}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="Enter company name"
              required
            />
            {errors.company_name && (
              <p className="text-error-red text-sm font-medium">{errors.company_name}</p>
            )}
          </div>

          {/* Primary Contact Person - Required for commercial */}
          <div className="grid gap-3">
            <Label htmlFor="primary-contact" className="text-lg text-charcoal font-medium">
              Primary Contact Person *
            </Label>
            <Input
              id="primary-contact"
              name="primary_contact_person"
              value={(formData as CommercialClientFormData).primary_contact_person || ''}
              onChange={(e) => handleInputChange('primary_contact_person', e.target.value)}
              className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="Enter primary contact name"
              required
            />
            {errors.primary_contact_person && (
              <p className="text-error-red text-sm font-medium">{errors.primary_contact_person}</p>
            )}
          </div>

          {/* Billing Address */}
          <div className="grid gap-3">
            <Label htmlFor="billing-address" className="text-lg text-charcoal font-medium">
              Billing Address
            </Label>
            <Textarea
              id="billing-address"
              name="billing_address"
              value={(formData as CommercialClientFormData).billing_address || ''}
              onChange={(e) => handleInputChange('billing_address', e.target.value)}
              className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[80px] resize-none"
              placeholder="Enter billing address (if different from service address)"
            />
            {errors.billing_address && (
              <p className="text-error-red text-sm font-medium">{errors.billing_address}</p>
            )}
          </div>

          {/* Tax ID and Business License - Side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="tax-id" className="text-lg text-charcoal font-medium">
                Tax ID / EIN
              </Label>
              <Input
                id="tax-id"
                name="tax_id"
                value={(formData as CommercialClientFormData).tax_id || ''}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                placeholder="XX-XXXXXXX"
              />
              {errors.tax_id && (
                <p className="text-error-red text-sm font-medium">{errors.tax_id}</p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="business-license" className="text-lg text-charcoal font-medium">
                Business License
              </Label>
              <Input
                id="business-license"
                name="business_license"
                value={(formData as CommercialClientFormData).business_license || ''}
                onChange={(e) => handleInputChange('business_license', e.target.value)}
                className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                placeholder="License number"
              />
              {errors.business_license && (
                <p className="text-error-red text-sm font-medium">{errors.business_license}</p>
              )}
            </div>
          </div>

          {/* Service Area */}
          <div className="grid gap-3">
            <Label htmlFor="service-area" className="text-lg text-charcoal font-medium">
              Service Area
            </Label>
            <Input
              id="service-area"
              name="service_area"
              value={(formData as CommercialClientFormData).service_area || ''}
              onChange={(e) => handleInputChange('service_area', e.target.value)}
              className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="Geographic service area or coverage"
            />
            {errors.service_area && (
              <p className="text-error-red text-sm font-medium">{errors.service_area}</p>
            )}
          </div>

          {/* Credit Terms and Credit Limit - Side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="credit-terms" className="text-lg text-charcoal font-medium">
                Credit Terms (Days)
              </Label>
              <Input
                id="credit-terms"
                name="credit_terms"
                type="number"
                min="0"
                max="365"
                value={(formData as CommercialClientFormData).credit_terms || 30}
                onChange={(e) => handleInputChange('credit_terms', parseInt(e.target.value) || 30)}
                className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                placeholder="30"
              />
              {errors.credit_terms && (
                <p className="text-error-red text-sm font-medium">{errors.credit_terms}</p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="credit-limit" className="text-lg text-charcoal font-medium">
                Credit Limit ($)
              </Label>
              <Input
                id="credit-limit"
                name="credit_limit"
                type="number"
                min="0"
                step="0.01"
                value={(formData as CommercialClientFormData).credit_limit || 0}
                onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                placeholder="0.00"
              />
              {errors.credit_limit && (
                <p className="text-error-red text-sm font-medium">{errors.credit_limit}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Name - Required */}
      <div className="grid gap-3">
        <Label htmlFor="client-name" className="text-lg text-charcoal font-medium">
          {clientType === 'commercial' ? 'Contact Name' : 'Client Name'} *
        </Label>
        <Input
          id="client-name"
          name="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder={clientType === 'commercial' ? 'Enter contact person name' : 'Enter client name'}
          required
        />
        {errors.name && (
          <p className="text-error-red text-sm font-medium">{errors.name}</p>
        )}
      </div>

      {/* Email and Phone - Side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-3">
          <Label htmlFor="client-email" className="text-lg text-charcoal font-medium">
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
          <Label htmlFor="client-phone" className="text-lg text-charcoal font-medium">
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

      {/* Service Address */}
      <div className="grid gap-3">
        <Label htmlFor="client-address" className="text-lg text-charcoal font-medium">
          Service Address
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

      {/* Client Status and Preferred Communication - Side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-3">
          <Label htmlFor="client-status" className="text-lg text-charcoal font-medium">
            Client Status
          </Label>
          <select
            id="client-status"
            name="client_status"
            value={formData.client_status}
            onChange={(e) => handleInputChange('client_status', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green rounded-md px-3 py-2"
          >
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          {errors.client_status && (
            <p className="text-error-red text-sm font-medium">{errors.client_status}</p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="preferred-communication" className="text-lg text-charcoal font-medium">
            Preferred Communication
          </Label>
          <select
            id="preferred-communication"
            name="preferred_communication"
            value={formData.preferred_communication}
            onChange={(e) => handleInputChange('preferred_communication', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green rounded-md px-3 py-2"
          >
            <option value="">Select preference</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="text">Text Message</option>
            <option value="portal">Client Portal</option>
          </select>
          {errors.preferred_communication && (
            <p className="text-error-red text-sm font-medium">{errors.preferred_communication}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-3">
        <Label htmlFor="client-notes" className="text-lg text-charcoal font-medium">
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
          className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl md:text-3xl font-bold text-forest-green">
            {isEditing ? 'Edit Client' : 'New Client'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <FormContent />
        </CardContent>
      </Card>
    );
  }

  return <FormContent />;
}