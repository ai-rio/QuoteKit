// Structured address interface for enhanced address support
export interface ClientStructuredAddress {
  // Raw formatted address (backward compatibility)
  formatted_address: string;
  
  // Google Places data
  place_id?: string | null;
  
  // Parsed address components
  street_number?: string | null;
  route?: string | null;
  locality?: string | null; // City
  administrative_area_level_1?: string | null; // State
  administrative_area_level_2?: string | null; // County
  country?: string | null;
  postal_code?: string | null;
  
  // Constructed fields for easy access
  street_address?: string | null; // street_number + route
  city?: string | null; // locality
  state?: string | null; // administrative_area_level_1
  zip_code?: string | null; // postal_code
  
  // Geocoding data
  latitude?: number | null;
  longitude?: number | null;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null; // Legacy field for backward compatibility
  notes?: string | null;
  
  // Blueprint commercial fields
  company_name?: string | null;
  billing_address?: string | null;
  client_status?: 'lead' | 'active' | 'inactive' | 'archived';
  primary_contact_person?: string | null;
  client_type: 'residential' | 'commercial';
  tax_id?: string | null;
  business_license?: string | null;
  preferred_communication?: 'email' | 'phone' | 'text' | 'portal' | null;
  service_area?: string | null;
  credit_terms?: number | null;
  credit_limit?: number | null;
  
  // Enhanced address fields (new)
  structured_address?: ClientStructuredAddress | null;
  structured_billing_address?: ClientStructuredAddress | null;
  
  created_at: string;
  updated_at: string;
}

// Base client form data
interface BaseClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string; // Legacy field for backward compatibility
  notes: string;
  client_status: 'lead' | 'active' | 'inactive' | 'archived';
  preferred_communication: 'email' | 'phone' | 'text' | 'portal' | '';
  
  // Enhanced address fields (optional for forms)
  structured_address?: ClientStructuredAddress;
}

// Residential client form data
interface ResidentialClientFormData extends BaseClientFormData {
  client_type: 'residential';
}

// Commercial client form data
export interface CommercialClientFormData extends BaseClientFormData {
  client_type: 'commercial';
  company_name: string;
  billing_address: string; // Legacy field for backward compatibility
  primary_contact_person: string;
  tax_id: string;
  business_license: string;
  service_area: string;
  credit_terms: number;
  credit_limit: number;
  
  // Enhanced billing address field (optional for forms)
  structured_billing_address?: ClientStructuredAddress;
}

// Discriminated union for client form data
export type ClientFormData = ResidentialClientFormData | CommercialClientFormData;

export interface ClientWithAnalytics extends Client {
  total_quotes: number;
  accepted_quotes: number;
  declined_quotes: number;
  total_quote_value: number;
  accepted_value: number;
  average_quote_value: number;
  acceptance_rate_percent: number;
  last_quote_date: string | null;
}

export interface ClientSearchFilters {
  search: string;
  sortBy: 'name' | 'created_at' | 'last_quote_date' | 'total_quotes' | 'total_quote_value';
  sortOrder: 'asc' | 'desc';
  hasQuotes?: boolean;
}

export interface ClientValidation {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  notes: boolean;
}

// For client selector component
export interface ClientOption {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

// Form validation schema types
export type ClientFormErrors = Partial<Record<keyof CommercialClientFormData, string>>;

// =====================================================
// PROPERTY TYPES - Blueprint Implementation
// =====================================================

// Property types matching database enums
export type PropertyType = 'residential' | 'commercial' | 'municipal' | 'industrial';
export type PropertyAccess = 'easy' | 'moderate' | 'difficult' | 'gate_required';
export type ClientType = 'residential' | 'commercial';
export type ClientStatus = 'lead' | 'active' | 'inactive' | 'archived';

// Extended client interface with Blueprint fields
export interface ExtendedClient extends Client {
  client_type: ClientType;
}

// Property interface matching database schema
export interface Property {
  id: string;
  user_id: string;
  client_id: string;
  
  // Basic property information
  property_name?: string | null;
  service_address: string;
  billing_address?: string | null;
  property_type: PropertyType;
  
  // Property details for service planning
  square_footage?: number | null;
  lot_size?: number | null;
  property_access: PropertyAccess;
  access_instructions?: string | null;
  gate_code?: string | null;
  parking_location?: string | null;
  
  // Service-specific information
  lawn_area?: number | null;
  landscape_area?: number | null;
  hardscape_area?: number | null;
  special_equipment_needed?: string[] | null;
  safety_considerations?: string | null;
  pet_information?: string | null;
  
  // GPS and location data
  latitude?: number | null;
  longitude?: number | null;
  location_verified?: boolean;
  
  // Property status and management
  is_active: boolean;
  service_frequency?: string | null;
  preferred_service_time?: string | null;
  season_start_date?: string | null;
  season_end_date?: string | null;
  
  // Client-specific notes and requirements
  property_notes?: string | null;
  client_requirements?: string | null;
  billing_notes?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Optional relationship (for joins)
  clients?: {
    id: string;
    name: string;
    company_name?: string | null;
    client_status?: ClientStatus;
    email?: string | null;
    phone?: string | null;
  };
}

// Property with client details for display
export interface PropertyWithClient extends Property {
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  company_name?: string | null;
}

// Property form data for creation/editing
export interface PropertyFormData {
  property_name: string;
  service_address: string;
  billing_address: string;
  property_type: PropertyType;
  square_footage: string;
  lot_size: string;
  property_access: PropertyAccess;
  access_instructions: string;
  gate_code: string;
  parking_location: string;
  lawn_area: string;
  landscape_area: string;
  hardscape_area: string;
  special_equipment_needed: string[];
  safety_considerations: string;
  pet_information: string;
  latitude: string;
  longitude: string;
  service_frequency: string;
  preferred_service_time: string;
  season_start_date: string;
  season_end_date: string;
  property_notes: string;
  client_requirements: string;
  billing_notes: string;
}

// Property form validation errors
export type PropertyFormErrors = {
  [K in keyof PropertyFormData]?: string;
};

// Property search and filtering
export interface PropertySearchFilters {
  search: string;
  client_id?: string;
  property_type?: PropertyType;
  property_access?: PropertyAccess;
  is_active?: boolean;
  service_frequency?: string;
  sortBy: 'property_name' | 'service_address' | 'created_at' | 'client_name' | 'property_type';
  sortOrder: 'asc' | 'desc';
}

// Property analytics interface
export interface PropertyWithAnalytics extends Property {
  client_name: string;
  company_name?: string | null;
  total_quotes: number;
  sent_quotes: number;
  accepted_quotes: number;
  declined_quotes: number;
  total_quote_value: number;
  accepted_value: number;
  average_quote_value: number;
  acceptance_rate_percent: number;
  last_quote_date?: string | null;
  property_since: string;
}

// Property selector for bulk operations
export interface PropertyOption {
  id: string;
  property_name?: string | null;
  service_address: string;
  client_name: string;
  property_type: PropertyType;
  is_active: boolean;
}

// Property validation interface
export interface PropertyValidation {
  property_name: boolean;
  service_address: boolean;
  billing_address: boolean;
  property_type: boolean;
  property_access: boolean;
  client_id: boolean;
}

// Property manager component modes
export type PropertyManagerMode = 'list' | 'create' | 'edit' | 'view' | 'bulk';

// Property manager props with discriminated union
export interface PropertyManagerProps {
  mode: PropertyManagerMode;
  clientId?: string;
  propertyId?: string;
  onClose?: () => void;
  onPropertyCreated?: (property: Property) => void;
  onPropertyUpdated?: (property: Property) => void;
  onPropertyDeleted?: (propertyId: string) => void;
}

// Bulk property operations
export interface BulkPropertyOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'export';
  propertyIds: string[];
  confirm?: boolean;
}

// Property import data structure
export interface PropertyImportData {
  client_name: string;
  property_name?: string;
  service_address: string;
  billing_address?: string;
  property_type: PropertyType;
  square_footage?: number;
  lot_size?: number;
  property_access: PropertyAccess;
  lawn_area?: number;
  landscape_area?: number;
  hardscape_area?: number;
  property_notes?: string;
}