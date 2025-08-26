// Assessment TypeScript types based on M2.1 database schema
export type AssessmentStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'reviewed' 
  | 'requires_followup';

export type AssessmentOverallCondition =
  | 'excellent'
  | 'good' 
  | 'fair'
  | 'poor'
  | 'critical';

export type LawnCondition =
  | 'pristine'
  | 'healthy'
  | 'patchy'
  | 'poor'
  | 'dead';

export type SoilCondition =
  | 'excellent'
  | 'good'
  | 'compacted'
  | 'sandy'
  | 'clay'
  | 'contaminated';

export type IrrigationStatus =
  | 'none'
  | 'excellent'
  | 'good'
  | 'needs_repair'
  | 'outdated'
  | 'broken';

export type AssessmentMediaType =
  | 'photo'
  | 'video'
  | 'document'
  | 'audio_note'
  | '360_photo';

export type EquipmentCategory =
  | 'mowing'
  | 'landscaping'
  | 'irrigation'
  | 'soil_care'
  | 'tree_care'
  | 'cleanup'
  | 'specialized'
  | 'safety';

// Core Property Assessment interface
export interface PropertyAssessment {
  id: string;
  user_id: string;
  property_id: string;
  quote_id?: string;
  
  // Assessment metadata
  assessment_number: string; // Auto-generated
  assessment_date: string;
  scheduled_date?: string;
  completed_date?: string;
  assessment_status: AssessmentStatus;
  
  // Assessor information
  assessor_name: string;
  assessor_contact?: string;
  weather_conditions?: string;
  temperature_f?: number;
  
  // Overall property assessment
  overall_condition?: AssessmentOverallCondition;
  total_estimated_hours?: number;
  complexity_score?: number; // 1-10
  priority_level: number; // 1-10, defaults to 5
  
  // Lawn and landscape assessment
  lawn_condition?: LawnCondition;
  lawn_area_measured?: number;
  lawn_area_estimated?: number;
  grass_type?: string;
  weed_coverage_percent?: number; // 0-100
  bare_spots_count: number;
  thatch_thickness_inches?: number;
  
  // Soil and drainage
  soil_condition?: SoilCondition;
  soil_ph?: number; // 0-14
  drainage_quality?: number; // 1-5
  slope_grade_percent?: number;
  erosion_issues: boolean;
  compaction_level?: number; // 1-5
  
  // Existing landscape features
  tree_count: number;
  shrub_count: number;
  flower_bed_area?: number;
  hardscape_area_measured?: number;
  existing_mulch_area?: number;
  fence_linear_feet?: number;
  
  // Infrastructure and utilities
  irrigation_status: IrrigationStatus;
  irrigation_zones_count: number;
  electrical_outlets_available: number;
  water_source_access: boolean;
  utility_lines_marked: boolean;
  
  // Access and logistics
  vehicle_access_width_feet?: number;
  gate_width_feet?: number;
  distance_to_disposal_feet?: number;
  parking_available: boolean;
  neighbor_considerations?: string;
  
  // Obstacles and challenges (JSONB in DB)
  obstacles: AssessmentObstacle[];
  special_considerations: Record<string, any>;
  
  // Equipment and material requirements
  equipment_needed: EquipmentCategory[];
  material_requirements: Record<string, any>;
  dump_truck_access: boolean;
  crane_access_needed: boolean;
  
  // Safety and compliance
  safety_hazards: string[];
  permit_required: boolean;
  hoa_restrictions?: string;
  environmental_considerations?: string;
  
  // Pricing and estimates
  estimated_material_cost?: number;
  estimated_labor_cost?: number;
  estimated_equipment_cost?: number;
  estimated_disposal_cost?: number;
  estimated_total_cost?: number;
  profit_margin_percent: number; // defaults to 20
  
  // Assessment notes and recommendations
  assessment_notes?: string;
  recommendations?: string;
  follow_up_needed: boolean;
  follow_up_notes?: string;
  internal_notes?: string; // Private notes not shared with client
  
  // Quality control
  photos_taken_count: number;
  measurements_verified: boolean;
  client_walkthrough_completed: boolean;
  assessment_reviewed_by?: string;
  review_date?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Assessment Obstacle structure for JSONB field
export interface AssessmentObstacle {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimated_cost?: number;
  requires_special_equipment?: boolean;
  notes?: string;
}

// Assessment Media interface
export interface AssessmentMedia {
  id: string;
  user_id: string;
  assessment_id: string;
  
  // Media information
  media_type: AssessmentMediaType;
  filename: string;
  original_filename?: string;
  file_size_bytes?: number;
  mime_type?: string;
  
  // Storage information
  storage_bucket: string;
  storage_path: string;
  public_url?: string;
  
  // Media metadata
  caption?: string;
  description?: string;
  taken_at: string;
  location_description?: string;
  metadata: Record<string, any>; // EXIF data, dimensions, etc.
  
  // Organization and tagging
  tags: string[];
  category?: string; // before, during, after, problem_area, solution, etc.
  sort_order: number;
  is_featured: boolean;
  
  // Client visibility
  visible_to_client: boolean;
  requires_approval: boolean;
  approved_at?: string;
  approved_by?: string;
  
  // Processing status
  processing_status: 'uploaded' | 'processing' | 'processed' | 'failed';
  thumbnail_generated: boolean;
  compressed_generated: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Extended assessment with property and client details
export interface PropertyAssessmentWithDetails extends PropertyAssessment {
  property_name?: string;
  service_address?: string;
  property_type?: string;
  client_id?: string;
  client_name?: string;
  company_name?: string;
  client_type?: string;
  media_count?: number;
  photo_count?: number;
  video_count?: number;
}

// Assessment with relationship data for UI components
export interface PropertyAssessmentWithDetails extends PropertyAssessment {
  properties?: {
    id: string;
    service_address: string;
    property_name?: string;
    property_type: string;
    clients?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    };
  };
  quotes?: Array<{
    id: string;
    quote_number: string;
    status: string;
    total: number;
    created_at: string;
  }>;
}

// Assessment form data types for server actions
export interface CreateAssessmentData {
  property_id: string;
  assessor_name: string;
  assessor_contact?: string;
  scheduled_date?: string;
  assessment_notes?: string;
  priority_level?: number;
}

export interface UpdateAssessmentData extends Partial<Omit<PropertyAssessment, 'id' | 'user_id' | 'assessment_number' | 'created_at' | 'updated_at'>> {}

// Media upload data
export interface UploadAssessmentMediaData {
  assessment_id: string;
  media_type: AssessmentMediaType;
  file: File;
  caption?: string;
  description?: string;
  location_description?: string;
  category?: string;
  tags?: string[];
  visible_to_client?: boolean;
}

// Assessment analytics types
export interface AssessmentAnalytics {
  user_id: string;
  total_assessments: number;
  scheduled_count: number;
  in_progress_count: number;
  completed_count: number;
  reviewed_count: number;
  followup_required_count: number;
  
  // Condition distribution
  excellent_condition_count: number;
  good_condition_count: number;
  fair_condition_count: number;
  poor_condition_count: number;
  critical_condition_count: number;
  
  // Metrics
  average_complexity: number;
  max_complexity: number;
  high_complexity_count: number;
  total_estimated_value: number;
  average_assessment_value: number;
  quoted_value: number;
  average_labor_hours: number;
  total_estimated_hours: number;
  
  // Conversion
  assessments_with_quotes: number;
  quote_conversion_rate_percent: number;
  
  // Activity
  assessments_this_week: number;
  assessments_this_month: number;
  most_recent_assessment?: string;
  total_media_files: number;
}

// Bulk operation types
export interface BulkAssessmentOperation {
  type: 'update_status' | 'delete' | 'update_priority' | 'assign_assessor';
  assessment_ids: string[];
  data?: {
    status?: AssessmentStatus;
    priority_level?: number;
    assessor_name?: string;
  };
}

// Assessment dashboard data
export interface AssessmentDashboardData {
  assessments: PropertyAssessmentWithDetails[];
  summary: AssessmentAnalytics;
  recent_activity: PropertyAssessmentWithDetails[];
  upcoming_assessments: PropertyAssessmentWithDetails[];
}

// Filter and search options
export interface AssessmentFilters {
  status?: AssessmentStatus[];
  condition?: AssessmentOverallCondition[];
  complexity_min?: number;
  complexity_max?: number;
  date_from?: string;
  date_to?: string;
  property_id?: string;
  assessor_name?: string;
  has_quote?: boolean;
  follow_up_needed?: boolean;
  search?: string; // Full-text search
}

// Assessment export data
export interface AssessmentExportData {
  format: 'csv' | 'pdf' | 'json';
  filters?: AssessmentFilters;
  include_media?: boolean;
  include_internal_notes?: boolean;
}