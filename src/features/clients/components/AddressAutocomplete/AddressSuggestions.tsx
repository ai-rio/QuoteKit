/**
 * Address Suggestions Component
 * Dropdown component for displaying Google Places API suggestions using Shadcn Command
 */

'use client';

import { AlertCircle,Loader2, MapPin } from 'lucide-react';
import React from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { AddressSuggestionsProps,GooglePlaceResult } from './types';

export function AddressSuggestions({
  query,
  suggestions,
  onSelect,
  onClose,
  loading = false,
  error,
  maxSuggestions = 5,
}: AddressSuggestionsProps) {
  
  if (!query || query.length < 3) {
    return null;
  }

  const handleSelect = (place: GooglePlaceResult) => {
    onSelect(place);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1">
      <Command 
        className="bg-paper-white border border-stone-gray/20 rounded-lg shadow-xl max-h-80"
        onKeyDown={handleKeyDown}
      >
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-4 px-3">
              <Loader2 className="h-4 w-4 animate-spin text-forest-green mr-2" />
              <span className="text-sm text-charcoal/70">Searching addresses...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center py-3 px-3 text-error-red bg-error-red/5">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && query.length >= 3 && (
            <CommandEmpty className="py-4 text-center">
              <div className="flex flex-col items-center justify-center text-charcoal/60">
                <MapPin className="h-6 w-6 mb-2" />
                <p className="text-sm font-medium">No addresses found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            </CommandEmpty>
          )}

          {suggestions.length > 0 && !loading && (
            <CommandGroup heading="Address Suggestions">
              {suggestions.slice(0, maxSuggestions).map((place) => (
                <CommandItem
                  key={place.place_id}
                  value={place.formatted_address}
                  onSelect={() => handleSelect(place)}
                  className="flex items-start py-3 px-3 cursor-pointer hover:bg-light-concrete/50 focus:bg-light-concrete/50 transition-colors duration-150 min-h-[44px] touch-manipulation"
                >
                  <MapPin className="h-4 w-4 text-forest-green mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      {place.name && place.name !== place.formatted_address && (
                        <p className="text-sm font-medium text-charcoal truncate">
                          {place.name}
                        </p>
                      )}
                      <p className="text-sm text-charcoal/80 leading-snug">
                        {place.formatted_address}
                      </p>
                      {place.vicinity && place.vicinity !== place.formatted_address && (
                        <p className="text-xs text-charcoal/60 mt-1">
                          {place.vicinity}
                        </p>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}

// Mobile-optimized version with larger touch targets
export function MobileAddressSuggestions({
  query,
  suggestions,
  onSelect,
  onClose,
  loading = false,
  error,
  maxSuggestions = 5,
}: AddressSuggestionsProps) {
  
  if (!query || query.length < 3) {
    return null;
  }

  const handleSelect = (place: GooglePlaceResult) => {
    onSelect(place);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-x-0 top-16 z-50 mx-2 sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:right-0 sm:mx-0 sm:mt-1">
      <Command 
        className="bg-paper-white border border-stone-gray/20 rounded-xl shadow-2xl max-h-96 sm:max-h-80"
        onKeyDown={handleKeyDown}
      >
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6 px-4 sm:py-4 sm:px-3">
              <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin text-forest-green mr-3 sm:mr-2" />
              <span className="text-base sm:text-sm text-charcoal/70">Searching addresses...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center py-4 px-4 sm:py-3 sm:px-3 text-error-red bg-error-red/5">
              <AlertCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2 flex-shrink-0" />
              <span className="text-base sm:text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && query.length >= 3 && (
            <CommandEmpty className="py-8 sm:py-4 text-center">
              <div className="flex flex-col items-center justify-center text-charcoal/60">
                <MapPin className="h-8 w-8 sm:h-6 sm:w-6 mb-3 sm:mb-2" />
                <p className="text-base sm:text-sm font-medium">No addresses found</p>
                <p className="text-sm sm:text-xs mt-1">Try a different search term</p>
              </div>
            </CommandEmpty>
          )}

          {suggestions.length > 0 && !loading && (
            <CommandGroup heading="Address Suggestions" className="[&_[cmdk-group-heading]]:text-base sm:[&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:px-4 sm:[&_[cmdk-group-heading]]:px-3">
              {suggestions.slice(0, maxSuggestions).map((place) => (
                <CommandItem
                  key={place.place_id}
                  value={place.formatted_address}
                  onSelect={() => handleSelect(place)}
                  className="flex items-start py-4 px-4 sm:py-3 sm:px-3 cursor-pointer hover:bg-light-concrete/50 focus:bg-light-concrete/50 active:bg-light-concrete/70 transition-colors duration-150 min-h-[60px] sm:min-h-[44px] touch-manipulation"
                >
                  <MapPin className="h-5 w-5 sm:h-4 sm:w-4 text-forest-green mr-4 sm:mr-3 mt-1 sm:mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      {place.name && place.name !== place.formatted_address && (
                        <p className="text-base sm:text-sm font-medium text-charcoal truncate mb-1">
                          {place.name}
                        </p>
                      )}
                      <p className="text-base sm:text-sm text-charcoal/80 leading-relaxed">
                        {place.formatted_address}
                      </p>
                      {place.vicinity && place.vicinity !== place.formatted_address && (
                        <p className="text-sm sm:text-xs text-charcoal/60 mt-2 sm:mt-1">
                          {place.vicinity}
                        </p>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}