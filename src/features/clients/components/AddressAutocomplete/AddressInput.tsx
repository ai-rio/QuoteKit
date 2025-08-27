/**
 * Address Input Component
 * Enhanced input field with built-in address autocomplete functionality
 */

'use client';

import { MapPin, X } from 'lucide-react';
import React, { useEffect,useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { AddressSuggestions, MobileAddressSuggestions } from './AddressSuggestions';
import { AddressInputProps } from './types';
import { useAddressAutocomplete, useGoogleMapsApiKey } from './useAddressAutocomplete';
import { parseGooglePlaceResult, toClientStructuredAddress } from './utils';

export function AddressInput({
  id,
  name,
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter address...',
  required = false,
  disabled = false,
  className = '',
  error,
}: AddressInputProps) {
  
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const apiKey = useGoogleMapsApiKey();
  
  const {
    suggestions,
    loading,
    error: autocompleteError,
    setQuery,
    selectPlace,
    clearSuggestions,
  } = useAddressAutocomplete({
    apiKey,
    debounceMs: 300,
    minQueryLength: 3,
    maxSuggestions: 5,
    componentRestrictions: {
      country: ['us'], // Restrict to US addresses
    },
    types: ['address'],
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setQuery(newValue);
    
    if (newValue.length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      clearSuggestions();
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (value.length >= 3) {
      setShowSuggestions(true);
    }
  };

  // Handle blur with delay to allow for suggestion clicks
  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle place selection
  const handlePlaceSelect = async (place: any) => {
    try {
      const structuredAddress = await selectPlace(place);
      const formattedAddress = structuredAddress.formatted_address;
      
      onChange(formattedAddress, structuredAddress);
      
      if (onAddressSelect) {
        onAddressSelect(structuredAddress);
      }
      
      setShowSuggestions(false);
      inputRef.current?.blur();
    } catch (err) {
      console.error('Error selecting address:', err);
    }
  };

  // Handle clear button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    clearSuggestions();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Close suggestions
  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    clearSuggestions();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasError = error || autocompleteError;
  const showClearButton = value && !disabled;
  const SuggestionsComponent = isMobile ? MobileAddressSuggestions : AddressSuggestions;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <MapPin className="h-4 w-4 text-charcoal/60" />
        </div>
        
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="street-address"
          className={`
            pl-10 pr-12
            ${hasError ? 'border-error-red focus:border-error-red focus:ring-error-red' : ''}
            ${isFocused ? 'border-forest-green ring-1 ring-forest-green' : ''}
            border-stone-gray bg-light-concrete text-charcoal 
            focus:border-forest-green focus:ring-forest-green 
            placeholder:text-charcoal/60
            min-h-[44px] touch-manipulation
            ${className}
          `}
        />
        
        {showClearButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-stone-gray/20 min-h-[44px] touch-manipulation"
            tabIndex={-1}
          >
            <X className="h-3 w-3 text-charcoal/60" />
            <span className="sr-only">Clear address</span>
          </Button>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-error-red text-sm mt-2 font-medium">
          {error || autocompleteError}
        </p>
      )}

      {/* Address suggestions */}
      {showSuggestions && (suggestions.length > 0 || loading || autocompleteError) && (
        <SuggestionsComponent
          query={value}
          suggestions={suggestions}
          onSelect={handlePlaceSelect}
          onClose={handleCloseSuggestions}
          loading={loading}
          error={autocompleteError || undefined}
          maxSuggestions={5}
        />
      )}
    </div>
  );
}

// Lightweight version without suggestions for simple use cases
export function SimpleAddressInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter address...',
  required = false,
  disabled = false,
  className = '',
  error,
}: Omit<AddressInputProps, 'onAddressSelect'>) {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <MapPin className="h-4 w-4 text-charcoal/60" />
        </div>
        
        <Input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="street-address"
          className={`
            pl-10
            ${error ? 'border-error-red focus:border-error-red focus:ring-error-red' : ''}
            border-stone-gray bg-light-concrete text-charcoal 
            focus:border-forest-green focus:ring-forest-green 
            placeholder:text-charcoal/60
            min-h-[44px] touch-manipulation
            ${className}
          `}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-error-red text-sm mt-2 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}