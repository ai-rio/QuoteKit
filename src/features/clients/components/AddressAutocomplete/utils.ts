/**
 * Address Autocomplete Utilities
 * Helper functions for parsing Google Places API results and address validation
 */

import { ClientStructuredAddress } from '../../types';
import { AddressErrorType,GooglePlaceResult, StructuredAddress } from './types';

/**
 * Parses a Google Place result into our structured address format
 */
export function parseGooglePlaceResult(place: GooglePlaceResult): StructuredAddress {
  const address: StructuredAddress = {
    place_id: place.place_id,
    formatted_address: place.formatted_address,
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
  };

  // Parse address components
  let streetNumber = '';
  let route = '';

  if (place.address_components) {
    place.address_components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
        address.street_number = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
        address.route = component.long_name;
      } else if (types.includes('locality')) {
        address.locality = component.long_name;
        address.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        address.administrative_area_level_1 = component.short_name;
        address.state = component.short_name;
      } else if (types.includes('administrative_area_level_2')) {
        address.administrative_area_level_2 = component.long_name;
      } else if (types.includes('country')) {
        address.country = component.short_name;
      } else if (types.includes('postal_code')) {
        address.postal_code = component.long_name;
        address.zip_code = component.long_name;
      }
    });
  }

  // Construct street address
  if (streetNumber && route) {
    address.street_address = `${streetNumber} ${route}`;
  } else if (route) {
    address.street_address = route;
  }

  // Extract coordinates
  if (place.geometry?.location) {
    address.latitude = place.geometry.location.lat();
    address.longitude = place.geometry.location.lng();
  }

  return address;
}

/**
 * Converts our StructuredAddress to ClientStructuredAddress format
 */
export function toClientStructuredAddress(address: StructuredAddress): ClientStructuredAddress {
  return {
    formatted_address: address.formatted_address,
    place_id: address.place_id || null,
    street_number: address.street_number || null,
    route: address.route || null,
    locality: address.locality || null,
    administrative_area_level_1: address.administrative_area_level_1 || null,
    administrative_area_level_2: address.administrative_area_level_2 || null,
    country: address.country || null,
    postal_code: address.postal_code || null,
    street_address: address.street_address || null,
    city: address.city || null,
    state: address.state || null,
    zip_code: address.zip_code || null,
    latitude: address.latitude || null,
    longitude: address.longitude || null,
  };
}

/**
 * Converts ClientStructuredAddress back to StructuredAddress format
 */
export function fromClientStructuredAddress(clientAddress: ClientStructuredAddress): StructuredAddress {
  return {
    place_id: clientAddress.place_id || undefined,
    formatted_address: clientAddress.formatted_address,
    street_number: clientAddress.street_number || undefined,
    route: clientAddress.route || undefined,
    locality: clientAddress.locality || undefined,
    administrative_area_level_1: clientAddress.administrative_area_level_1 || undefined,
    administrative_area_level_2: clientAddress.administrative_area_level_2 || undefined,
    country: clientAddress.country || undefined,
    postal_code: clientAddress.postal_code || undefined,
    street_address: clientAddress.street_address || '',
    city: clientAddress.city || '',
    state: clientAddress.state || '',
    zip_code: clientAddress.zip_code || '',
    latitude: clientAddress.latitude || undefined,
    longitude: clientAddress.longitude || undefined,
  };
}

/**
 * Validates if an address has minimum required information
 */
export function validateAddress(address: StructuredAddress): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!address.street_address?.trim()) {
    errors.street = 'Street address is required';
  }

  if (!address.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!address.state?.trim()) {
    errors.state = 'State is required';
  }

  if (!address.zip_code?.trim()) {
    errors.zipCode = 'ZIP code is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Formats an address for display
 */
export function formatAddressForDisplay(address: StructuredAddress | ClientStructuredAddress): string {
  if ('formatted_address' in address && address.formatted_address) {
    return address.formatted_address;
  }

  const parts: string[] = [];

  if (address.street_address) {
    parts.push(address.street_address);
  }

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state && address.zip_code) {
    parts.push(`${address.state} ${address.zip_code}`);
  } else if (address.state) {
    parts.push(address.state);
  } else if (address.zip_code) {
    parts.push(address.zip_code);
  }

  return parts.join(', ');
}

/**
 * Creates a debounced function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

/**
 * Handles Google Places API errors
 */
export function handlePlacesAPIError(status: string): { type: AddressErrorType; message: string } {
  switch (status) {
    case 'ZERO_RESULTS':
      return {
        type: AddressErrorType.NO_RESULTS,
        message: 'No addresses found for this search',
      };
    case 'OVER_QUERY_LIMIT':
      return {
        type: AddressErrorType.API_ERROR,
        message: 'Too many requests. Please try again in a moment',
      };
    case 'REQUEST_DENIED':
      return {
        type: AddressErrorType.PERMISSION_DENIED,
        message: 'Address lookup service is not available',
      };
    case 'INVALID_REQUEST':
      return {
        type: AddressErrorType.INVALID_QUERY,
        message: 'Invalid address search request',
      };
    default:
      return {
        type: AddressErrorType.API_ERROR,
        message: 'Unable to lookup address. Please try again',
      };
  }
}

/**
 * Checks if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return !!(typeof window !== 'undefined' && 
         window.google && 
         window.google.maps && 
         window.google.maps.places);
}

/**
 * Loads Google Maps API script dynamically
 */
export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // Script is already loading
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps API')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    (window as any).initGoogleMaps = () => {
      resolve();
      delete (window as any).initGoogleMaps;
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Extracts the main components from a formatted address string
 * Fallback for when structured data is not available
 */
export function parseFormattedAddress(formattedAddress: string): Partial<StructuredAddress> {
  const parts = formattedAddress.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    return {
      formatted_address: formattedAddress,
      street_address: formattedAddress,
      city: '',
      state: '',
      zip_code: '',
    };
  }

  const streetAddress = parts[0];
  const lastPart = parts[parts.length - 1];
  const secondLastPart = parts.length > 2 ? parts[parts.length - 2] : '';

  // Try to extract state and zip from the last part (e.g., "CA 90210" or "California 90210")
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
  let state = '';
  let zipCode = '';
  let city = '';

  if (stateZipMatch) {
    state = stateZipMatch[1];
    zipCode = stateZipMatch[2];
    city = secondLastPart;
  } else if (parts.length > 2) {
    // If no state/zip pattern found, assume last part is country/state, second last is city
    city = secondLastPart;
    state = lastPart;
  } else {
    city = parts[1];
  }

  return {
    formatted_address: formattedAddress,
    street_address: streetAddress,
    city: city,
    state: state,
    zip_code: zipCode,
  };
}