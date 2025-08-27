/**
 * Address Autocomplete Hook
 * Manages Google Places API integration and autocomplete state
 */

'use client';

import { useCallback, useEffect, useRef,useState } from 'react';

import { 
  AddressErrorType, 
  GooglePlaceResult, 
  StructuredAddress, 
  UseAddressAutocompleteReturn} from './types';
import { 
  debounce, 
  handlePlacesAPIError, 
  isGoogleMapsLoaded, 
  loadGoogleMapsAPI,
  parseGooglePlaceResult} from './utils';

interface UseAddressAutocompleteOptions {
  apiKey?: string;
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  componentRestrictions?: {
    country?: string | string[];
  };
  types?: string[];
}

export function useAddressAutocomplete({
  apiKey,
  debounceMs = 300,
  minQueryLength = 3,
  maxSuggestions = 5,
  componentRestrictions,
  types = ['address'],
}: UseAddressAutocompleteOptions = {}): UseAddressAutocompleteReturn {
  
  const [suggestions, setSuggestions] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        if (!isGoogleMapsLoaded()) {
          if (!apiKey) {
            setError('Google Maps API key is required');
            return;
          }
          await loadGoogleMapsAPI(apiKey);
        }

        if (window.google?.maps?.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          
          // Create a temporary div for PlacesService if we don't have a map
          if (!mapRef.current) {
            mapRef.current = document.createElement('div');
          }
          
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 39.8283, lng: -98.5795 }, // Center of US
            zoom: 4,
          });
          
          placesService.current = new window.google.maps.places.PlacesService(map);
        }
      } catch (err) {
        setError('Failed to initialize address lookup service');
        console.error('Google Maps initialization error:', err);
      }
    };

    initializeServices();
  }, [apiKey]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!autocompleteService.current || searchQuery.length < minQueryLength) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        const request: google.maps.places.AutocompletionRequest = {
          input: searchQuery,
          types,
          componentRestrictions,
        };

        autocompleteService.current.getPlacePredictions(
          request,
          (predictions, status) => {
            setLoading(false);
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formattedResults = predictions.slice(0, maxSuggestions).map(prediction => ({
                place_id: prediction.place_id,
                formatted_address: prediction.description,
                geometry: {} as any, // Will be filled when place details are fetched
                address_components: [] as any,
                types: prediction.types || [],
                name: prediction.structured_formatting?.main_text,
                vicinity: prediction.structured_formatting?.secondary_text,
              }));
              
              setSuggestions(formattedResults);
              setError(null);
            } else {
              setSuggestions([]);
              if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                const errorInfo = handlePlacesAPIError(status);
                setError(errorInfo.message);
              } else {
                setError(null);
              }
            }
          }
        );
      } catch (err) {
        setLoading(false);
        setSuggestions([]);
        setError('Unable to search addresses. Please try again.');
        console.error('Autocomplete search error:', err);
      }
    }, debounceMs),
    [autocompleteService, minQueryLength, maxSuggestions, types, componentRestrictions, debounceMs]
  );

  // Search for places
  const searchPlaces = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < minQueryLength) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    debouncedSearch(searchQuery);
  }, [debouncedSearch, minQueryLength]);

  // Select a place and get detailed information
  const selectPlace = useCallback(async (place: GooglePlaceResult): Promise<StructuredAddress> => {
    return new Promise((resolve, reject) => {
      if (!placesService.current) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request = {
        placeId: place.place_id,
        fields: [
          'place_id',
          'formatted_address',
          'address_components',
          'geometry.location',
          'name',
          'types'
        ]
      };

      placesService.current.getDetails(request, (placeDetails, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
          try {
            const structuredAddress = parseGooglePlaceResult(placeDetails as any);
            resolve(structuredAddress);
          } catch (err) {
            reject(new Error('Failed to parse place details'));
          }
        } else {
          const errorInfo = handlePlacesAPIError(status);
          reject(new Error(errorInfo.message));
        }
      });
    });
  }, [placesService]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Update query without triggering search
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    suggestions,
    loading,
    error,
    query,
    setQuery: searchPlaces,
    selectPlace,
    clearSuggestions,
  };
}

// Environment variable hook for API key
export function useGoogleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
}