/**
 * Address Autocomplete Components - Main Export
 * Enhanced client modal with Google Places API integration
 */

// Main components
export { AddressAutocomplete } from './AddressAutocomplete';
export { AddressInput, SimpleAddressInput } from './AddressInput';
export { AddressSuggestions, MobileAddressSuggestions } from './AddressSuggestions';

// Hooks
export { useAddressAutocomplete, useGoogleMapsApiKey } from './useAddressAutocomplete';

// Types
export type {
  AddressAutocompleteProps,
  AddressInputProps,
  AddressParser,
  AddressSuggestionsProps,
  AddressValidationState,
  GooglePlaceResult,
  PlaceAddressComponent,
  PlaceGeometry,
  StructuredAddress,
  UseAddressAutocompleteReturn,
} from './types';
export { AddressErrorType } from './types';

// Utilities
export {
  debounce,
  formatAddressForDisplay,
  fromClientStructuredAddress,
  handlePlacesAPIError,
  isGoogleMapsLoaded,
  loadGoogleMapsAPI,
  parseFormattedAddress,
  parseGooglePlaceResult,
  toClientStructuredAddress,
  validateAddress,
} from './utils';