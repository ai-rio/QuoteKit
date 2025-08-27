/**
 * Client Form Sections Component
 * Organized sections for different parts of the enhanced client form
 */

'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { ClientFormData, ClientStructuredAddress,CommercialClientFormData } from '../../types';
import { AddressSection, BillingAddressSection } from './AddressSection';

interface FormSectionProps {
  formData: ClientFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | number) => void;
  onStructuredAddressChange?: (field: string, address: ClientStructuredAddress) => void;
  clientType: 'residential' | 'commercial';
  onClientTypeChange: (type: 'residential' | 'commercial') => void;
}

// Client Type Selection Section
export function ClientTypeSection({
  clientType,
  onClientTypeChange,
}: {
  clientType: 'residential' | 'commercial';
  onClientTypeChange: (type: 'residential' | 'commercial') => void;
}) {
  return (
    <div className="grid gap-4">
      <Label className="text-xl font-bold text-forest-green">
        Client Type *
      </Label>
      <div className="flex gap-6">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="radio"
            name="client_type"
            value="residential"
            checked={clientType === 'residential'}
            onChange={(e) => onClientTypeChange(e.target.value as 'residential')}
            className="w-5 h-5 text-forest-green border-stone-gray focus:ring-forest-green focus:ring-2 min-h-[44px] min-w-[44px] touch-manipulation"
          />
          <span className="text-charcoal font-medium text-lg group-hover:text-forest-green transition-colors">
            Residential
          </span>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="radio"
            name="client_type"
            value="commercial"
            checked={clientType === 'commercial'}
            onChange={(e) => onClientTypeChange(e.target.value as 'commercial')}
            className="w-5 h-5 text-forest-green border-stone-gray focus:ring-forest-green focus:ring-2 min-h-[44px] min-w-[44px] touch-manipulation"
          />
          <span className="text-charcoal font-medium text-lg group-hover:text-forest-green transition-colors">
            Commercial
          </span>
        </label>
      </div>
    </div>
  );
}

// Commercial Company Information Section
export function CommercialInfoSection({
  formData,
  errors,
  onInputChange,
  onStructuredAddressChange,
}: FormSectionProps) {
  
  const commercialData = formData as CommercialClientFormData;

  return (
    <div className="bg-light-concrete/20 p-6 rounded-2xl border border-stone-gray/20 space-y-6">
      <h3 className="text-2xl font-bold text-forest-green">Company Information</h3>
      
      {/* Company Name - Required for commercial */}
      <div className="grid gap-3">
        <Label htmlFor="company-name" className="text-lg text-charcoal font-medium">
          Company Name *
        </Label>
        <Input
          id="company-name"
          name="company_name"
          value={commercialData.company_name || ''}
          onChange={(e) => onInputChange('company_name', e.target.value)}
          className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
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
          value={commercialData.primary_contact_person || ''}
          onChange={(e) => onInputChange('primary_contact_person', e.target.value)}
          className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
          placeholder="Enter primary contact name"
          required
        />
        {errors.primary_contact_person && (
          <p className="text-error-red text-sm font-medium">{errors.primary_contact_person}</p>
        )}
      </div>

      {/* Billing Address with Autocomplete */}
      <BillingAddressSection
        formData={formData}
        errors={errors}
        onInputChange={onInputChange}
        onStructuredAddressChange={onStructuredAddressChange}
      />

      {/* Tax ID and Business License - Side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid gap-3">
          <Label htmlFor="tax-id" className="text-lg text-charcoal font-medium">
            Tax ID / EIN
          </Label>
          <Input
            id="tax-id"
            name="tax_id"
            value={commercialData.tax_id || ''}
            onChange={(e) => onInputChange('tax_id', e.target.value)}
            className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
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
            value={commercialData.business_license || ''}
            onChange={(e) => onInputChange('business_license', e.target.value)}
            className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
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
          value={commercialData.service_area || ''}
          onChange={(e) => onInputChange('service_area', e.target.value)}
          className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
          placeholder="Geographic service area or coverage"
        />
        {errors.service_area && (
          <p className="text-error-red text-sm font-medium">{errors.service_area}</p>
        )}
      </div>

      {/* Credit Terms and Credit Limit - Side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            value={commercialData.credit_terms || 30}
            onChange={(e) => onInputChange('credit_terms', parseInt(e.target.value) || 30)}
            className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
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
            value={commercialData.credit_limit || 0}
            onChange={(e) => onInputChange('credit_limit', parseFloat(e.target.value) || 0)}
            className="border-stone-gray bg-paper-white text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
            placeholder="0.00"
          />
          {errors.credit_limit && (
            <p className="text-error-red text-sm font-medium">{errors.credit_limit}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Basic Client Information Section
export function BasicInfoSection({
  formData,
  errors,
  onInputChange,
  onStructuredAddressChange,
  clientType,
}: FormSectionProps) {
  
  return (
    <div className="space-y-6">
      {/* Client Name - Required */}
      <div className="grid gap-3">
        <Label htmlFor="client-name" className="text-lg text-charcoal font-medium">
          {clientType === 'commercial' ? 'Contact Name' : 'Client Name'} *
        </Label>
        <Input
          id="client-name"
          name="name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
          placeholder={clientType === 'commercial' ? 'Enter contact person name' : 'Enter client name'}
          required
        />
        {errors.name && (
          <p className="text-error-red text-sm font-medium">{errors.name}</p>
        )}
      </div>

      {/* Email and Phone - Side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid gap-3">
          <Label htmlFor="client-email" className="text-lg text-charcoal font-medium">
            Email
          </Label>
          <Input
            id="client-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
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
            onChange={(e) => onInputChange('phone', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="text-error-red text-sm font-medium">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Service Address with Enhanced Autocomplete */}
      <AddressSection
        formData={formData}
        errors={errors}
        onInputChange={onInputChange}
        onStructuredAddressChange={onStructuredAddressChange}
        label="Service Address"
        fieldName="address"
        structuredFieldName="structured_address"
        placeholder="Where will services be performed?"
        required={false}
      />

      {/* Client Status and Preferred Communication - Side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid gap-3">
          <Label htmlFor="client-status" className="text-lg text-charcoal font-medium">
            Client Status
          </Label>
          <Select
            name="client_status"
            value={formData.client_status}
            onValueChange={(value) => onInputChange('client_status', value)}
          >
            <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[44px] touch-manipulation data-[placeholder]:text-charcoal/60">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {errors.client_status && (
            <p className="text-error-red text-sm font-medium">{errors.client_status}</p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="preferred-communication" className="text-lg text-charcoal font-medium">
            Preferred Communication
          </Label>
          <Select
            name="preferred_communication"
            value={formData.preferred_communication}
            onValueChange={(value) => onInputChange('preferred_communication', value)}
          >
            <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[44px] touch-manipulation data-[placeholder]:text-charcoal/60">
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="text">Text Message</SelectItem>
              <SelectItem value="portal">Client Portal</SelectItem>
            </SelectContent>
          </Select>
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
          onChange={(e) => onInputChange('notes', e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[100px] resize-none touch-manipulation"
          placeholder="Additional notes about this client..."
        />
        {errors.notes && (
          <p className="text-error-red text-sm font-medium">{errors.notes}</p>
        )}
      </div>
    </div>
  );
}