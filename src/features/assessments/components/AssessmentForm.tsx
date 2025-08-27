'use client';

import { FileText, Loader2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/features/clients/types';
import { ActionResponse } from '@/types/action-response';

import { createAssessment, updateAssessment } from '../actions/assessment-actions';
import {
  AssessmentOverallCondition,
  AssessmentStatus,
  CreateAssessmentData,
  IrrigationStatus,
  LawnCondition,
  PropertyAssessment,
  SoilCondition,
  UpdateAssessmentData,
} from '../types';
import {
  BasicInformationFields,
  CostEstimatesFields,
  LawnAssessmentFields,
  NotesQualityFields,
  OverallAssessmentFields,
  SoilInfrastructureFields,
} from './fields';
import { PropertyMeasurements } from './PropertyMeasurements';

interface AssessmentFormProps {
  mode: 'create' | 'edit';
  assessment?: PropertyAssessment;
  initialProperty?: Property | null;
  initialClientId?: string | null;
  onSubmit: (data: CreateAssessmentData | UpdateAssessmentData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface AssessmentFormData {
  // Basic Information
  property_id: string;
  assessor_name: string;
  assessor_contact: string;
  scheduled_date: string;
  assessment_status: AssessmentStatus;
  weather_conditions: string;
  temperature_f: number | '';
  
  // Overall Assessment
  overall_condition: AssessmentOverallCondition | '';
  priority_level: number;
  complexity_score: number | '';
  total_estimated_hours: number | '';
  
  // Lawn Assessment
  lawn_condition: LawnCondition | '';
  lawn_area_measured: number | '';
  lawn_area_estimated: number | '';
  grass_type: string;
  weed_coverage_percent: number | '';
  bare_spots_count: number | '';
  thatch_thickness_inches: number | '';
  
  // Property Measurements
  total_property_area: number | '';
  driveway_area: number | '';
  walkway_area: number | '';
  patio_area: number | '';
  garden_bed_area: number | '';
  tree_count: number | '';
  shrub_count: number | '';
  obstacle_count: number | '';
  access_width_feet: number | '';
  fence_height_feet: number | '';
  measurement_method: 'measured' | 'estimated' | 'satellite';
  measurement_notes: string;
  
  // Soil and Infrastructure
  soil_condition: SoilCondition | '';
  soil_ph: number | '';
  drainage_quality: number | '';
  slope_grade_percent: number | '';
  erosion_issues: boolean;
  compaction_level: number | '';
  irrigation_status: IrrigationStatus;
  irrigation_zones_count: number | '';
  electrical_outlets_available: number | '';
  water_source_access: boolean;
  utility_lines_marked: boolean;
  
  // Cost Estimates
  estimated_material_cost: number | '';
  estimated_labor_cost: number | '';
  estimated_equipment_cost: number | '';
  estimated_disposal_cost: number | '';
  profit_margin_percent: number;
  dump_truck_access: boolean;
  crane_access_needed: boolean;
  permit_required: boolean;
  hoa_restrictions: string;
  
  // Notes and Quality
  assessment_notes: string;
  recommendations: string;
  photos_taken_count: number | '';
  neighbor_considerations: string;
  measurements_verified: boolean;
  client_walkthrough_completed: boolean;
  follow_up_needed: boolean;
  follow_up_notes: string;
  internal_notes: string;
}

interface AssessmentFormErrors {
  [key: string]: string;
}

const tabs = [
  { id: 'basic', label: 'Basic', icon: '👤' },
  { id: 'overall', label: 'Overall', icon: '📊' },
  { id: 'lawn', label: 'Lawn', icon: '🌱' },
  { id: 'measurements', label: 'Measurements', icon: '📏' },
  { id: 'soil', label: 'Soil', icon: '🌍' },
  { id: 'costs', label: 'Costs', icon: '💰' },
  { id: 'notes', label: 'Notes', icon: '📝' },
];

export function AssessmentFormRefactored({ 
  mode,
  assessment, 
  initialProperty,
  initialClientId,
  onSubmit, 
  onCancel, 
  isSubmitting
}: AssessmentFormProps) {
  const [errors, setErrors] = useState<AssessmentFormErrors>({});
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = mode === 'edit';

  // Initialize form data
  const initializeFormData = (): AssessmentFormData => ({
    // Basic Information
    property_id: assessment?.property_id || initialProperty?.id || '',
    assessor_name: assessment?.assessor_name || '',
    assessor_contact: assessment?.assessor_contact || '',
    scheduled_date: assessment?.scheduled_date || '',
    assessment_status: assessment?.assessment_status || 'scheduled',
    weather_conditions: assessment?.weather_conditions || '',
    temperature_f: assessment?.temperature_f || '',
    
    // Overall Assessment
    overall_condition: assessment?.overall_condition || '',
    priority_level: assessment?.priority_level || 5,
    complexity_score: assessment?.complexity_score || '',
    total_estimated_hours: assessment?.total_estimated_hours || '',
    
    // Lawn Assessment
    lawn_condition: assessment?.lawn_condition || '',
    lawn_area_measured: assessment?.lawn_area_measured || '',
    lawn_area_estimated: assessment?.lawn_area_estimated || '',
    grass_type: assessment?.grass_type || '',
    weed_coverage_percent: assessment?.weed_coverage_percent || '',
    bare_spots_count: assessment?.bare_spots_count || '',
    thatch_thickness_inches: assessment?.thatch_thickness_inches || '',
    
    // Property Measurements
    total_property_area: (assessment as any)?.total_property_area || '',
    driveway_area: (assessment as any)?.driveway_area || '',
    walkway_area: (assessment as any)?.walkway_area || '',
    patio_area: (assessment as any)?.patio_area || '',
    garden_bed_area: (assessment as any)?.garden_bed_area || '',
    tree_count: (assessment as any)?.tree_count || '',
    shrub_count: (assessment as any)?.shrub_count || '',
    obstacle_count: (assessment as any)?.obstacle_count || '',
    access_width_feet: (assessment as any)?.access_width_feet || '',
    fence_height_feet: (assessment as any)?.fence_height_feet || '',
    measurement_method: (assessment as any)?.measurement_method || 'estimated',
    measurement_notes: (assessment as any)?.measurement_notes || '',
    
    // Soil and Infrastructure
    soil_condition: assessment?.soil_condition || '',
    soil_ph: assessment?.soil_ph || '',
    drainage_quality: assessment?.drainage_quality || '',
    slope_grade_percent: assessment?.slope_grade_percent || '',
    erosion_issues: assessment?.erosion_issues || false,
    compaction_level: assessment?.compaction_level || '',
    irrigation_status: assessment?.irrigation_status || 'none',
    irrigation_zones_count: assessment?.irrigation_zones_count || '',
    electrical_outlets_available: assessment?.electrical_outlets_available || '',
    water_source_access: assessment?.water_source_access || false,
    utility_lines_marked: assessment?.utility_lines_marked || false,
    
    // Cost Estimates
    estimated_material_cost: assessment?.estimated_material_cost || '',
    estimated_labor_cost: assessment?.estimated_labor_cost || '',
    estimated_equipment_cost: assessment?.estimated_equipment_cost || '',
    estimated_disposal_cost: assessment?.estimated_disposal_cost || '',
    profit_margin_percent: assessment?.profit_margin_percent || 20,
    dump_truck_access: assessment?.dump_truck_access || false,
    crane_access_needed: assessment?.crane_access_needed || false,
    permit_required: assessment?.permit_required || false,
    hoa_restrictions: assessment?.hoa_restrictions || '',
    
    // Notes and Quality
    assessment_notes: assessment?.assessment_notes || '',
    recommendations: assessment?.recommendations || '',
    photos_taken_count: assessment?.photos_taken_count || '',
    neighbor_considerations: assessment?.neighbor_considerations || '',
    measurements_verified: assessment?.measurements_verified || false,
    client_walkthrough_completed: assessment?.client_walkthrough_completed || false,
    follow_up_needed: assessment?.follow_up_needed || false,
    follow_up_notes: assessment?.follow_up_notes || '',
    internal_notes: assessment?.internal_notes || '',
  });

  const [formData, setFormData] = useState<AssessmentFormData>(initializeFormData());

  // Update form data when assessment changes
  useEffect(() => {
    setFormData(initializeFormData());
  }, [assessment]);

  const validateForm = (): boolean => {
    const newErrors: AssessmentFormErrors = {};

    // Basic validation
    if (!formData.assessor_name.trim()) {
      newErrors.assessor_name = 'Assessor name is required';
    }
    if (!formData.property_id) {
      newErrors.property_id = 'Property selection is required';
    }

    // Range validations
    if (formData.complexity_score !== '' && (formData.complexity_score < 1 || formData.complexity_score > 10)) {
      newErrors.complexity_score = 'Complexity score must be between 1 and 10';
    }
    if (formData.priority_level < 1 || formData.priority_level > 10) {
      newErrors.priority_level = 'Priority level must be between 1 and 10';
    }
    if (formData.weed_coverage_percent !== '' && (formData.weed_coverage_percent < 0 || formData.weed_coverage_percent > 100)) {
      newErrors.weed_coverage_percent = 'Weed coverage must be between 0 and 100%';
    }
    if (formData.soil_ph !== '' && (formData.soil_ph < 0 || formData.soil_ph > 14)) {
      newErrors.soil_ph = 'Soil pH must be between 0 and 14';
    }
    if (formData.drainage_quality !== '' && (formData.drainage_quality < 1 || formData.drainage_quality > 5)) {
      newErrors.drainage_quality = 'Drainage quality must be between 1 and 5';
    }
    if (formData.profit_margin_percent < 0 || formData.profit_margin_percent > 100) {
      newErrors.profit_margin_percent = 'Profit margin must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && assessment) {
        const updateData: UpdateAssessmentData = {
          assessor_name: formData.assessor_name,
          assessor_contact: formData.assessor_contact || undefined,
          scheduled_date: formData.scheduled_date || undefined,
          assessment_status: formData.assessment_status,
          weather_conditions: formData.weather_conditions || undefined,
          temperature_f: formData.temperature_f === '' ? undefined : Number(formData.temperature_f),
          overall_condition: formData.overall_condition || undefined,
          priority_level: formData.priority_level,
          complexity_score: formData.complexity_score === '' ? undefined : Number(formData.complexity_score),
          total_estimated_hours: formData.total_estimated_hours === '' ? undefined : Number(formData.total_estimated_hours),
          lawn_condition: formData.lawn_condition || undefined,
          lawn_area_measured: formData.lawn_area_measured === '' ? undefined : Number(formData.lawn_area_measured),
          lawn_area_estimated: formData.lawn_area_estimated === '' ? undefined : Number(formData.lawn_area_estimated),
          grass_type: formData.grass_type || undefined,
          weed_coverage_percent: formData.weed_coverage_percent === '' ? undefined : Number(formData.weed_coverage_percent),
          bare_spots_count: formData.bare_spots_count === '' ? 0 : Number(formData.bare_spots_count),
          thatch_thickness_inches: formData.thatch_thickness_inches === '' ? undefined : Number(formData.thatch_thickness_inches),
          soil_condition: formData.soil_condition || undefined,
          soil_ph: formData.soil_ph === '' ? undefined : Number(formData.soil_ph),
          drainage_quality: formData.drainage_quality === '' ? undefined : Number(formData.drainage_quality),
          slope_grade_percent: formData.slope_grade_percent === '' ? undefined : Number(formData.slope_grade_percent),
          erosion_issues: formData.erosion_issues,
          compaction_level: formData.compaction_level === '' ? undefined : Number(formData.compaction_level),
          irrigation_status: formData.irrigation_status,
          irrigation_zones_count: formData.irrigation_zones_count === '' ? 0 : Number(formData.irrigation_zones_count),
          electrical_outlets_available: formData.electrical_outlets_available === '' ? 0 : Number(formData.electrical_outlets_available),
          water_source_access: formData.water_source_access,
          utility_lines_marked: formData.utility_lines_marked,
          estimated_material_cost: formData.estimated_material_cost === '' ? undefined : Number(formData.estimated_material_cost),
          estimated_labor_cost: formData.estimated_labor_cost === '' ? undefined : Number(formData.estimated_labor_cost),
          estimated_equipment_cost: formData.estimated_equipment_cost === '' ? undefined : Number(formData.estimated_equipment_cost),
          estimated_disposal_cost: formData.estimated_disposal_cost === '' ? undefined : Number(formData.estimated_disposal_cost),
          profit_margin_percent: typeof formData.profit_margin_percent === 'string' ? 20 : formData.profit_margin_percent,
          assessment_notes: formData.assessment_notes || undefined,
          recommendations: formData.recommendations || undefined,
          follow_up_needed: formData.follow_up_needed,
          follow_up_notes: formData.follow_up_notes || undefined,
          internal_notes: formData.internal_notes || undefined,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateAssessmentData = {
          property_id: formData.property_id,
          assessor_name: formData.assessor_name,
          assessor_contact: formData.assessor_contact || undefined,
          scheduled_date: formData.scheduled_date || undefined,
          assessment_notes: formData.assessment_notes || undefined,
          priority_level: formData.priority_level,
        };
        await onSubmit(createData);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(value => 
      value !== '' && value !== false && value !== 0
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const FormContent = () => (
    <div className="assessment-form space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-charcoal font-semibold">Assessment Progress</span>
          <span className="text-charcoal font-medium">{calculateProgress()}% Complete</span>
        </div>
        <Progress value={calculateProgress()} className="h-3 bg-stone-gray/20" />
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 overflow-x-auto">
          <TabsList className="grid w-full min-w-max grid-cols-7 gap-1 md:grid-cols-7 lg:w-fit lg:min-w-0">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="text-xs px-2 py-2 min-w-0 flex-shrink-0 md:px-3 lg:text-sm"
                aria-label={`${tab.label} section`}
              >
                <span className="mr-1 text-base" role="img" aria-hidden="true">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="basic" className="space-y-6">
          <BasicInformationFields
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
            initialProperty={initialProperty}
            initialClientId={initialClientId}
          />
        </TabsContent>

        <TabsContent value="overall" className="space-y-6">
          <OverallAssessmentFields
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="lawn" className="space-y-6">
          <LawnAssessmentFields
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="measurements" className="space-y-6">
          <PropertyMeasurements
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="soil" className="space-y-6">
          <SoilInfrastructureFields
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <CostEstimatesFields
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <NotesQualityFields
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {errors.submit && (
        <div className="bg-error-red/5 border border-error-red/20 rounded-lg p-4" role="alert">
          <p className="text-error-red font-medium">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between pt-6 border-t border-stone-gray/30">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-paper-white border-stone-gray/50 text-charcoal hover:bg-stone-gray/10 hover:border-stone-gray font-semibold px-6 py-3 h-12 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-forest-green border-forest-green text-paper-white hover:bg-forest-green/90 disabled:opacity-60 disabled:cursor-not-allowed font-semibold px-6 py-3 h-12 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Assessment' : 'Create Assessment'
          )}
        </Button>
      </div>
    </div>
  );

  return <FormContent />;
}
