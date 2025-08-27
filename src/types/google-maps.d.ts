/**
 * Google Maps Types Declaration
 * TypeScript declarations for Google Maps JavaScript API
 */

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => google.maps.places.AutocompleteService;
          PlacesService: new (
            attrContainer: HTMLDivElement | google.maps.Map
          ) => google.maps.places.PlacesService;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
            NOT_FOUND: string;
          };
        };
        Map: new (
          mapDiv: HTMLDivElement,
          opts?: google.maps.MapOptions
        ) => google.maps.Map;
        LatLng: new (lat: number, lng: number) => google.maps.LatLng;
      };
    };
    initGoogleMaps?: () => void;
  }

  namespace google {
    namespace maps {
      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
      }

      interface LatLng {
        lat(): number;
        lng(): number;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      interface Map {}

      namespace places {
        interface AutocompleteService {
          getPlacePredictions(
            request: AutocompletionRequest,
            callback: (
              predictions: AutocompletePrediction[] | null,
              status: PlacesServiceStatus
            ) => void
          ): void;
        }

        interface PlacesService {
          getDetails(
            request: PlaceDetailsRequest,
            callback: (
              place: PlaceResult | null,
              status: PlacesServiceStatus
            ) => void
          ): void;
        }

        interface AutocompletionRequest {
          input: string;
          componentRestrictions?: ComponentRestrictions;
          types?: string[];
        }

        interface ComponentRestrictions {
          country?: string | string[];
        }

        interface AutocompletePrediction {
          place_id: string;
          description: string;
          types: string[];
          structured_formatting?: {
            main_text: string;
            secondary_text: string;
          };
        }

        interface PlaceDetailsRequest {
          placeId: string;
          fields: string[];
        }

        interface PlaceResult {
          place_id: string;
          formatted_address: string;
          address_components: AddressComponent[];
          geometry?: PlaceGeometry;
          name?: string;
          types: string[];
        }

        interface AddressComponent {
          long_name: string;
          short_name: string;
          types: string[];
        }

        interface PlaceGeometry {
          location: LatLng;
          viewport?: LatLngBounds;
        }

        interface LatLngBounds {
          getNorthEast(): LatLng;
          getSouthWest(): LatLng;
        }

        enum PlacesServiceStatus {
          OK = 'OK',
          ZERO_RESULTS = 'ZERO_RESULTS',
          OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
          REQUEST_DENIED = 'REQUEST_DENIED',
          INVALID_REQUEST = 'INVALID_REQUEST',
          NOT_FOUND = 'NOT_FOUND',
        }
      }
    }
  }
}

export {};