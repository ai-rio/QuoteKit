/**
 * Address Section Component
 * Enhanced address input section with autocomplete for client forms
 */

'use client';

import React from 'react';

import { Label } from '@/components/ui/label';

import { ClientFormData, ClientStructuredAddress,CommercialClientFormData } from '../../types';
import { AddressAutocomplete } from '../AddressAutocomplete';
import { StructuredAddress } from '../AddressAutocomplete/types';
import { toClientStructuredAddress } from '../AddressAutocomplete/utils';

interface AddressSectionProps {
  formData: ClientFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string | number) => void;
  onStructuredAddressChange?: (field: string, address: ClientStructuredAddress) => void;
  label?: string;
  fieldName?: string;
  structuredFieldName?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function AddressSection({
  formData,
  errors,
  onInputChange,
  onStructuredAddressChange,
  label = 'Service Address',
  fieldName = 'address',
  structuredFieldName = 'structured_address',
  placeholder = 'Start typing an address...',
  required = false,
  className = '',
}: AddressSectionProps) {
  
  const currentValue = (formData as any)[fieldName] || '';
  const currentError = errors[fieldName];

  // Handle address input changes
  const handleAddressChange = (value: string, structuredAddress?: StructuredAddress) => {
    onInputChange(fieldName, value);
    
    if (structuredAddress && onStructuredAddressChange) {
      const clientStructuredAddress = toClientStructuredAddress(structuredAddress);
      onStructuredAddressChange(structuredFieldName, clientStructuredAddress);
    }
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: StructuredAddress) => {
    if (onStructuredAddressChange) {
      const clientStructuredAddress = toClientStructuredAddress(address);
      onStructuredAddressChange(structuredFieldName, clientStructuredAddress);
    }
  };

  return (
    <div className={`grid gap-3 ${className}`}>
      <Label htmlFor={fieldName} className="text-lg text-charcoal font-medium">
        {label} {required && '*'}
      </Label>
      
      <AddressAutocomplete
        id={fieldName}
        name={fieldName}
        value={currentValue}
        onChange={handleAddressChange}
        onAddressSelect={handleAddressSelect}
        placeholder={placeholder}
        required={required}
        error={currentError}
        className="w-full"
        debounceMs={300}
        minQueryLength={3}
        maxSuggestions={5}
        componentRestrictions={{
          country: ['us'], // Restrict to US addresses
        }}
        types={['address']}
      />
      
      {currentError && (
        <p className="text-error-red text-sm font-medium">{currentError}</p>
      )}
    </div>
  );
}

// Specialized component for billing addresses
export function BillingAddressSection({
  formData,
  errors,
  onInputChange,
  onStructuredAddressChange,
}: Omit<AddressSectionProps, 'label' | 'fieldName' | 'structuredFieldName' | 'placeholder'>) {
  
  return (
    <AddressSection
      formData={formData}
      errors={errors}
      onInputChange={onInputChange}
      onStructuredAddressChange={onStructuredAddressChange}
      label="Billing Address"
      fieldName="billing_address"
      structuredFieldName="structured_billing_address"
      placeholder="Enter billing address (if different from service address)"
      required={false}
    />
  );
}

// Service address section specifically for residential clients
export function ServiceAddressSection({
  formData,
  errors,
  onInputChange,
  onStructuredAddressChange,
}: Omit<AddressSectionProps, 'label' | 'fieldName' | 'structuredFieldName' | 'placeholder' | 'required'>) {
  
  return (
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
  );
}

// Address display component for showing selected structured address
export function AddressDisplay({ 
  address, 
  title = 'Selected Address' 
}: { 
  address?: ClientStructuredAddress | null; 
  title?: string; 
}) {
  
  if (!address?.formatted_address) {
    return null;
  }

  return (
    <div className="bg-light-concrete/30 rounded-lg p-4 border border-stone-gray/20">
      <h4 className="font-medium text-charcoal mb-2">{title}</h4>
      <p className="text-sm text-charcoal/80 mb-2">{address.formatted_address}</p>
      
      {/* Show structured components if available */}
      {(address.street_address || address.city || address.state || address.zip_code) && (
        <div className="text-xs text-charcoal/60 space-y-1">
          {address.street_address && (
            <p><span className="font-medium">Street:</span> {address.street_address}</p>
          )}
          {address.city && (
            <p><span className="font-medium">City:</span> {address.city}</p>
          )}
          {address.state && address.zip_code && (
            <p><span className="font-medium">State & ZIP:</span> {address.state} {address.zip_code}</p>
          )}
          {address.latitude && address.longitude && (
            <p><span className="font-medium">Coordinates:</span> {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}</p>
          )}
        </div>
      )}
    </div>
  );
}