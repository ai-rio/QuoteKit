/**
 * Address Autocomplete Component
 * Main component that combines all address autocomplete functionality
 */

'use client';

import React, { useState } from 'react';

import { AddressInput } from './AddressInput';
import { AddressAutocompleteProps, StructuredAddress } from './types';

export function AddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  required = false,
  disabled = false,
  className = '',
  error,
  debounceMs = 300,
  minQueryLength = 3,
  maxSuggestions = 5,
  componentRestrictions,
  types = ['address'],
}: AddressAutocompleteProps) {
  
  const [selectedAddress, setSelectedAddress] = useState<StructuredAddress | null>(null);

  // Handle address input changes
  const handleAddressChange = (newValue: string, structuredAddress?: StructuredAddress) => {
    onChange(newValue, structuredAddress);
    
    if (structuredAddress) {
      setSelectedAddress(structuredAddress);
    } else if (!newValue) {
      setSelectedAddress(null);
    }
  };

  // Handle address selection from suggestions
  const handleAddressSelect = (address: StructuredAddress) => {
    setSelectedAddress(address);
    
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  return (
    <div className="w-full space-y-2">
      <AddressInput
        id={id}
        name={name}
        value={value}
        onChange={handleAddressChange}
        onAddressSelect={handleAddressSelect}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        error={error}
      />
      
      {/* Optional: Display selected address details for debugging */}
      {process.env.NODE_ENV === 'development' && selectedAddress && (
        <div className="mt-2 p-2 bg-light-concrete/30 rounded text-xs text-charcoal/70 border border-stone-gray/20">
          <p><strong>Structured Address:</strong></p>
          <p>Street: {selectedAddress.street_address}</p>
          <p>City: {selectedAddress.city}</p>
          <p>State: {selectedAddress.state}</p>
          <p>ZIP: {selectedAddress.zip_code}</p>
          {selectedAddress.latitude && selectedAddress.longitude && (
            <p>Coordinates: {selectedAddress.latitude.toFixed(6)}, {selectedAddress.longitude.toFixed(6)}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Export all related components and hooks
export { AddressInput, SimpleAddressInput } from './AddressInput';
export { AddressSuggestions, MobileAddressSuggestions } from './AddressSuggestions';
export * from './types';
export { useAddressAutocomplete, useGoogleMapsApiKey } from './useAddressAutocomplete';
export * from './utils';