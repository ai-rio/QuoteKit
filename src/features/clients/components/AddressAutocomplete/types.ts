/**
 * Address Autocomplete Types and Interfaces
 * Enhanced client modal with Google Places API integration
 */

// Google Places API types
export interface PlaceGeometry {
  location: {
    lat: () => number;
    lng: () => number;
  };
  viewport?: {
    getNorthEast: () => { lat: () => number; lng: () => number };
    getSouthWest: () => { lat: () => number; lng: () => number };
  };
}

export interface PlaceAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GooglePlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: PlaceGeometry;
  address_components: PlaceAddressComponent[];
  name?: string;
  vicinity?: string;
  types: string[];
}

// Structured address data matching our needs
export interface StructuredAddress {
  // Raw Google data
  place_id?: string;
  formatted_address: string;
  
  // Parsed components
  street_number?: string;
  route?: string;
  locality?: string; // City
  administrative_area_level_1?: string; // State
  administrative_area_level_2?: string; // County
  country?: string;
  postal_code?: string;
  
  // Constructed fields
  street_address: string; // street_number + route
  city: string; // locality
  state: string; // administrative_area_level_1
  zip_code: string; // postal_code
  
  // Geocoding data
  latitude?: number;
  longitude?: number;
}

// Address input component props
export interface AddressInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string, structuredAddress?: StructuredAddress) => void;
  onAddressSelect?: (address: StructuredAddress) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

// Address suggestions dropdown props
export interface AddressSuggestionsProps {
  query: string;
  suggestions: GooglePlaceResult[];
  onSelect: (place: GooglePlaceResult) => void;
  onClose: () => void;
  loading?: boolean;
  error?: string;
  maxSuggestions?: number;
}

// Main AddressAutocomplete component props
export interface AddressAutocompleteProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string, structuredAddress?: StructuredAddress) => void;
  onAddressSelect?: (address: StructuredAddress) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  
  // Autocomplete behavior
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  
  // Google Places API options
  componentRestrictions?: {
    country?: string | string[];
  };
  types?: string[];
}

// Address autocomplete hook return type
export interface UseAddressAutocompleteReturn {
  suggestions: GooglePlaceResult[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  selectPlace: (place: GooglePlaceResult) => Promise<StructuredAddress>;
  clearSuggestions: () => void;
}

// Google Places service interface
export interface PlacesService {
  findPlaceFromQuery: (
    request: { query: string; fields: string[] },
    callback: (results: GooglePlaceResult[] | null, status: string) => void
  ) => void;
  getDetails: (
    request: { placeId: string; fields: string[] },
    callback: (place: GooglePlaceResult | null, status: string) => void
  ) => void;
}

// Address validation states
export interface AddressValidationState {
  isValid: boolean;
  errors: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: string;
  };
}

// Address parser utility function type
export type AddressParser = (place: GooglePlaceResult) => StructuredAddress;

// Error types for address operations
export enum AddressErrorType {
  INVALID_QUERY = 'INVALID_QUERY',
  NO_RESULTS = 'NO_RESULTS',
  API_ERROR = 'API_ERROR',
  GEOCODING_ERROR = 'GEOCODING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface AddressError {
  type: AddressErrorType;
  message: string;
  details?: unknown;
}