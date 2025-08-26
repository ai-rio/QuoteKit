'use client';

import { Calendar, Camera, FileText, Loader2, MapPin, Users } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

interface AssessmentFormProps {
  assessment?: PropertyAssessment;
  propertyId?: string;
  onSuccess?: (assessment: PropertyAssessment) => void;
  onCancel?: () => void;
  showCard?: boolean;
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
  
  // Soil and Drainage
  soil_condition: SoilCondition | '';
  soil_ph: number | '';
  drainage_quality: number | '';
  slope_grade_percent: number | '';
  erosion_issues: boolean;
  compaction_level: number | '';
  
  // Infrastructure
  irrigation_status: IrrigationStatus;
  irrigation_zones_count: number | '';
  electrical_outlets_available: number | '';
  water_source_access: boolean;
  utility_lines_marked: boolean;
  
  // Access and Logistics
  vehicle_access_width_feet: number | '';
  gate_width_feet: number | '';
  distance_to_disposal_feet: number | '';
  parking_available: boolean;
  neighbor_considerations: string;
  
  // Equipment Requirements
  dump_truck_access: boolean;
  crane_access_needed: boolean;
  
  // Safety and Compliance
  permit_required: boolean;
  hoa_restrictions: string;
  environmental_considerations: string;
  
  // Estimates
  estimated_material_cost: number | '';
  estimated_labor_cost: number | '';
  estimated_equipment_cost: number | '';
  estimated_disposal_cost: number | '';
  profit_margin_percent: number;
  
  // Notes
  assessment_notes: string;
  recommendations: string;
  follow_up_needed: boolean;
  follow_up_notes: string;
  internal_notes: string;
  
  // Quality Control
  photos_taken_count: number | '';
  measurements_verified: boolean;
  client_walkthrough_completed: boolean;
}

interface AssessmentFormErrors {
  [key: string]: string;
}

export function AssessmentForm({ 
  assessment, 
  propertyId, 
  onSuccess, 
  onCancel, 
  showCard = true 
}: AssessmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<AssessmentFormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const isEditing = !!assessment;

  // Initialize form data
  const initializeFormData = (): AssessmentFormData => ({
    // Basic Information
    property_id: assessment?.property_id || propertyId || '',
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
    
    // Soil and Drainage
    soil_condition: assessment?.soil_condition || '',
    soil_ph: assessment?.soil_ph || '',
    drainage_quality: assessment?.drainage_quality || '',
    slope_grade_percent: assessment?.slope_grade_percent || '',
    erosion_issues: assessment?.erosion_issues || false,
    compaction_level: assessment?.compaction_level || '',
    
    // Infrastructure
    irrigation_status: assessment?.irrigation_status || 'none',
    irrigation_zones_count: assessment?.irrigation_zones_count || '',
    electrical_outlets_available: assessment?.electrical_outlets_available || '',
    water_source_access: assessment?.water_source_access || false,
    utility_lines_marked: assessment?.utility_lines_marked || false,
    
    // Access and Logistics
    vehicle_access_width_feet: assessment?.vehicle_access_width_feet || '',
    gate_width_feet: assessment?.gate_width_feet || '',
    distance_to_disposal_feet: assessment?.distance_to_disposal_feet || '',
    parking_available: assessment?.parking_available || false,
    neighbor_considerations: assessment?.neighbor_considerations || '',
    
    // Equipment Requirements
    dump_truck_access: assessment?.dump_truck_access || false,
    crane_access_needed: assessment?.crane_access_needed || false,
    
    // Safety and Compliance
    permit_required: assessment?.permit_required || false,
    hoa_restrictions: assessment?.hoa_restrictions || '',
    environmental_considerations: assessment?.environmental_considerations || '',
    
    // Estimates
    estimated_material_cost: assessment?.estimated_material_cost || '',
    estimated_labor_cost: assessment?.estimated_labor_cost || '',
    estimated_equipment_cost: assessment?.estimated_equipment_cost || '',
    estimated_disposal_cost: assessment?.estimated_disposal_cost || '',
    profit_margin_percent: assessment?.profit_margin_percent || 20,
    
    // Notes
    assessment_notes: assessment?.assessment_notes || '',
    recommendations: assessment?.recommendations || '',
    follow_up_needed: assessment?.follow_up_needed || false,
    follow_up_notes: assessment?.follow_up_notes || '',
    internal_notes: assessment?.internal_notes || '',
    
    // Quality Control
    photos_taken_count: assessment?.photos_taken_count || '',
    measurements_verified: assessment?.measurements_verified || false,
    client_walkthrough_completed: assessment?.client_walkthrough_completed || false,
  });

  const [formData, setFormData] = useState<AssessmentFormData>(initializeFormData());

  // Update form data when assessment changes
  useEffect(() => {
    setFormData(initializeFormData());
  }, [assessment]);

  const validateCurrentStep = (): boolean => {
    const newErrors: AssessmentFormErrors = {};

    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.assessor_name.trim()) {
          newErrors.assessor_name = 'Assessor name is required';
        }
        if (!formData.property_id) {
          newErrors.property_id = 'Property selection is required';
        }
        break;
      
      case 2: // Overall Assessment
        if (formData.complexity_score !== '' && (formData.complexity_score < 1 || formData.complexity_score > 10)) {
          newErrors.complexity_score = 'Complexity score must be between 1 and 10';
        }
        if (formData.priority_level < 1 || formData.priority_level > 10) {
          newErrors.priority_level = 'Priority level must be between 1 and 10';
        }
        break;
      
      case 3: // Lawn Assessment
        if (formData.weed_coverage_percent !== '' && (formData.weed_coverage_percent < 0 || formData.weed_coverage_percent > 100)) {
          newErrors.weed_coverage_percent = 'Weed coverage must be between 0 and 100%';
        }
        break;
      
      case 4: // Soil and Infrastructure
        if (formData.soil_ph !== '' && (formData.soil_ph < 0 || formData.soil_ph > 14)) {
          newErrors.soil_ph = 'Soil pH must be between 0 and 14';
        }
        if (formData.drainage_quality !== '' && (formData.drainage_quality < 1 || formData.drainage_quality > 5)) {
          newErrors.drainage_quality = 'Drainage quality must be between 1 and 5';
        }
        break;
      
      case 5: // Estimates
        if (formData.profit_margin_percent < 0 || formData.profit_margin_percent > 100) {
          newErrors.profit_margin_percent = 'Profit margin must be between 0 and 100%';
        }
        break;
      
      case 6: // Notes and Quality Control
        // No required fields in this step
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AssessmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    startTransition(async () => {
      try {
        let result: ActionResponse<PropertyAssessment>;

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
            vehicle_access_width_feet: formData.vehicle_access_width_feet === '' ? undefined : Number(formData.vehicle_access_width_feet),
            gate_width_feet: formData.gate_width_feet === '' ? undefined : Number(formData.gate_width_feet),
            distance_to_disposal_feet: formData.distance_to_disposal_feet === '' ? undefined : Number(formData.distance_to_disposal_feet),
            parking_available: formData.parking_available,
            neighbor_considerations: formData.neighbor_considerations || undefined,
            dump_truck_access: formData.dump_truck_access,
            crane_access_needed: formData.crane_access_needed,
            permit_required: formData.permit_required,
            hoa_restrictions: formData.hoa_restrictions || undefined,
            environmental_considerations: formData.environmental_considerations || undefined,
            estimated_material_cost: formData.estimated_material_cost === '' ? undefined : Number(formData.estimated_material_cost),
            estimated_labor_cost: formData.estimated_labor_cost === '' ? undefined : Number(formData.estimated_labor_cost),
            estimated_equipment_cost: formData.estimated_equipment_cost === '' ? undefined : Number(formData.estimated_equipment_cost),
            estimated_disposal_cost: formData.estimated_disposal_cost === '' ? undefined : Number(formData.estimated_disposal_cost),
            profit_margin_percent: formData.profit_margin_percent,
            assessment_notes: formData.assessment_notes || undefined,
            recommendations: formData.recommendations || undefined,
            follow_up_needed: formData.follow_up_needed,
            follow_up_notes: formData.follow_up_notes || undefined,
            internal_notes: formData.internal_notes || undefined,
            photos_taken_count: formData.photos_taken_count === '' ? 0 : Number(formData.photos_taken_count),
            measurements_verified: formData.measurements_verified,
            client_walkthrough_completed: formData.client_walkthrough_completed,
          };
          result = await updateAssessment(assessment.id, updateData);
        } else {
          const createData: CreateAssessmentData = {
            property_id: formData.property_id,
            assessor_name: formData.assessor_name,
            assessor_contact: formData.assessor_contact || undefined,
            scheduled_date: formData.scheduled_date || undefined,
            assessment_notes: formData.assessment_notes || undefined,
            priority_level: formData.priority_level,
          };
          result = await createAssessment(createData);
        }

        if (result && !result.error && result.data) {
          onSuccess?.(result.data);
        } else {
          setErrors({ submit: result?.error || 'An error occurred while saving the assessment' });
        }
      } catch (error) {
        setErrors({ submit: 'An unexpected error occurred' });
      }
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderOverallAssessment();
      case 3:
        return renderLawnAssessment();
      case 4:
        return renderSoilAndInfrastructure();
      case 5:
        return renderEstimates();
      case 6:
        return renderNotesAndQuality();
      default:
        return null;
    }
  };

  // Step content rendering functions will be added in the next part
  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Basic Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="assessor_name" className="text-lg text-charcoal font-medium">
            Assessor Name *
          </Label>
          <Input
            id="assessor_name"
            value={formData.assessor_name}
            onChange={(e) => handleInputChange('assessor_name', e.target.value)}
            className={errors.assessor_name ? 'border-red-500' : ''}
            placeholder="Enter assessor name"
          />
          {errors.assessor_name && (
            <p className="text-sm text-red-600">{errors.assessor_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessor_contact" className="text-lg text-charcoal font-medium">
            Assessor Contact
          </Label>
          <Input
            id="assessor_contact"
            value={formData.assessor_contact}
            onChange={(e) => handleInputChange('assessor_contact', e.target.value)}
            placeholder="Phone or email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_date" className="text-lg text-charcoal font-medium">
            Scheduled Date
          </Label>
          <Input
            id="scheduled_date"
            type="datetime-local"
            value={formData.scheduled_date}
            onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessment_status" className="text-lg text-charcoal font-medium">
            Assessment Status
          </Label>
          <Select
            value={formData.assessment_status}
            onValueChange={(value) => handleInputChange('assessment_status', value as AssessmentStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="requires_followup">Requires Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weather_conditions" className="text-lg text-charcoal font-medium">
            Weather Conditions
          </Label>
          <Input
            id="weather_conditions"
            value={formData.weather_conditions}
            onChange={(e) => handleInputChange('weather_conditions', e.target.value)}
            placeholder="e.g., Sunny, Cloudy, Light rain"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature_f" className="text-lg text-charcoal font-medium">
            Temperature (°F)
          </Label>
          <Input
            id="temperature_f"
            type="number"
            value={formData.temperature_f}
            onChange={(e) => handleInputChange('temperature_f', e.target.value ? Number(e.target.value) : '')}
            placeholder="Temperature in Fahrenheit"
          />
        </div>
      </div>
    </div>
  );

  const renderLawnAssessment = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Lawn Assessment</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="lawn_condition" className="text-lg text-charcoal font-medium">
            Lawn Condition
          </Label>
          <Select
            value={formData.lawn_condition}
            onValueChange={(value) => handleInputChange('lawn_condition', value as LawnCondition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select lawn condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pristine">Pristine</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="patchy">Patchy</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="dead">Dead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grass_type" className="text-lg text-charcoal font-medium">
            Grass Type
          </Label>
          <Input
            id="grass_type"
            value={formData.grass_type}
            onChange={(e) => handleInputChange('grass_type', e.target.value)}
            placeholder="e.g., Bermuda, Zoysia, St. Augustine"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lawn_area_measured" className="text-lg text-charcoal font-medium">
            Lawn Area Measured (sq ft)
          </Label>
          <Input
            id="lawn_area_measured"
            type="number"
            min="0"
            value={formData.lawn_area_measured}
            onChange={(e) => handleInputChange('lawn_area_measured', e.target.value ? Number(e.target.value) : '')}
            placeholder="Measured lawn area"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lawn_area_estimated" className="text-lg text-charcoal font-medium">
            Lawn Area Estimated (sq ft)
          </Label>
          <Input
            id="lawn_area_estimated"
            type="number"
            min="0"
            value={formData.lawn_area_estimated}
            onChange={(e) => handleInputChange('lawn_area_estimated', e.target.value ? Number(e.target.value) : '')}
            placeholder="Estimated lawn area"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weed_coverage_percent" className="text-lg text-charcoal font-medium">
            Weed Coverage (%)
          </Label>
          <Input
            id="weed_coverage_percent"
            type="number"
            min="0"
            max="100"
            value={formData.weed_coverage_percent}
            onChange={(e) => handleInputChange('weed_coverage_percent', e.target.value ? Number(e.target.value) : '')}
            className={errors.weed_coverage_percent ? 'border-red-500' : ''}
            placeholder="Percentage of weed coverage"
          />
          {errors.weed_coverage_percent && (
            <p className="text-sm text-red-600">{errors.weed_coverage_percent}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bare_spots_count" className="text-lg text-charcoal font-medium">
            Bare Spots Count
          </Label>
          <Input
            id="bare_spots_count"
            type="number"
            min="0"
            value={formData.bare_spots_count}
            onChange={(e) => handleInputChange('bare_spots_count', e.target.value ? Number(e.target.value) : '')}
            placeholder="Number of bare spots"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thatch_thickness_inches" className="text-lg text-charcoal font-medium">
            Thatch Thickness (inches)
          </Label>
          <Input
            id="thatch_thickness_inches"
            type="number"
            step="0.1"
            min="0"
            value={formData.thatch_thickness_inches}
            onChange={(e) => handleInputChange('thatch_thickness_inches', e.target.value ? Number(e.target.value) : '')}
            placeholder="Thatch layer thickness"
          />
        </div>
      </div>
    </div>
  );

  const renderSoilAndInfrastructure = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Soil & Infrastructure</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Soil Conditions */}
        <div className="space-y-2">
          <Label htmlFor="soil_condition" className="text-lg text-charcoal font-medium">
            Soil Condition
          </Label>
          <Select
            value={formData.soil_condition}
            onValueChange={(value) => handleInputChange('soil_condition', value as SoilCondition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select soil condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="compacted">Compacted</SelectItem>
              <SelectItem value="sandy">Sandy</SelectItem>
              <SelectItem value="clay">Clay</SelectItem>
              <SelectItem value="contaminated">Contaminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="soil_ph" className="text-lg text-charcoal font-medium">
            Soil pH (0-14)
          </Label>
          <Input
            id="soil_ph"
            type="number"
            step="0.1"
            min="0"
            max="14"
            value={formData.soil_ph}
            onChange={(e) => handleInputChange('soil_ph', e.target.value ? Number(e.target.value) : '')}
            className={errors.soil_ph ? 'border-red-500' : ''}
            placeholder="Soil pH level"
          />
          {errors.soil_ph && (
            <p className="text-sm text-red-600">{errors.soil_ph}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="drainage_quality" className="text-lg text-charcoal font-medium">
            Drainage Quality (1-5)
          </Label>
          <Input
            id="drainage_quality"
            type="number"
            min="1"
            max="5"
            value={formData.drainage_quality}
            onChange={(e) => handleInputChange('drainage_quality', e.target.value ? Number(e.target.value) : '')}
            className={errors.drainage_quality ? 'border-red-500' : ''}
            placeholder="Rate drainage quality"
          />
          {errors.drainage_quality && (
            <p className="text-sm text-red-600">{errors.drainage_quality}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slope_grade_percent" className="text-lg text-charcoal font-medium">
            Slope Grade (%)
          </Label>
          <Input
            id="slope_grade_percent"
            type="number"
            step="0.1"
            value={formData.slope_grade_percent}
            onChange={(e) => handleInputChange('slope_grade_percent', e.target.value ? Number(e.target.value) : '')}
            placeholder="Slope percentage"
          />
        </div>

        {/* Infrastructure */}
        <div className="space-y-2">
          <Label htmlFor="irrigation_status" className="text-lg text-charcoal font-medium">
            Irrigation Status
          </Label>
          <Select
            value={formData.irrigation_status}
            onValueChange={(value) => handleInputChange('irrigation_status', value as IrrigationStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select irrigation status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="needs_repair">Needs Repair</SelectItem>
              <SelectItem value="outdated">Outdated</SelectItem>
              <SelectItem value="broken">Broken</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="irrigation_zones_count" className="text-lg text-charcoal font-medium">
            Irrigation Zones Count
          </Label>
          <Input
            id="irrigation_zones_count"
            type="number"
            min="0"
            value={formData.irrigation_zones_count}
            onChange={(e) => handleInputChange('irrigation_zones_count', e.target.value ? Number(e.target.value) : '')}
            placeholder="Number of irrigation zones"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="electrical_outlets_available" className="text-lg text-charcoal font-medium">
            Electrical Outlets Available
          </Label>
          <Input
            id="electrical_outlets_available"
            type="number"
            min="0"
            value={formData.electrical_outlets_available}
            onChange={(e) => handleInputChange('electrical_outlets_available', e.target.value ? Number(e.target.value) : '')}
            placeholder="Number of available outlets"
          />
        </div>

        {/* Boolean Fields */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="erosion_issues"
              type="checkbox"
              checked={formData.erosion_issues}
              onChange={(e) => handleInputChange('erosion_issues', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="erosion_issues" className="text-lg text-charcoal font-medium">
              Erosion Issues Present
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="water_source_access"
              type="checkbox"
              checked={formData.water_source_access}
              onChange={(e) => handleInputChange('water_source_access', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="water_source_access" className="text-lg text-charcoal font-medium">
              Water Source Access Available
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="utility_lines_marked"
              type="checkbox"
              checked={formData.utility_lines_marked}
              onChange={(e) => handleInputChange('utility_lines_marked', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="utility_lines_marked" className="text-lg text-charcoal font-medium">
              Utility Lines Marked
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverallAssessment = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Overall Assessment</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="overall_condition" className="text-lg text-charcoal font-medium">
            Overall Property Condition
          </Label>
          <Select
            value={formData.overall_condition}
            onValueChange={(value) => handleInputChange('overall_condition', value as AssessmentOverallCondition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority_level" className="text-lg text-charcoal font-medium">
            Priority Level (1-10)
          </Label>
          <Input
            id="priority_level"
            type="number"
            min="1"
            max="10"
            value={formData.priority_level}
            onChange={(e) => handleInputChange('priority_level', Number(e.target.value))}
            className={errors.priority_level ? 'border-red-500' : ''}
          />
          {errors.priority_level && (
            <p className="text-sm text-red-600">{errors.priority_level}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="complexity_score" className="text-lg text-charcoal font-medium">
            Complexity Score (1-10)
          </Label>
          <Input
            id="complexity_score"
            type="number"
            min="1"
            max="10"
            value={formData.complexity_score}
            onChange={(e) => handleInputChange('complexity_score', e.target.value ? Number(e.target.value) : '')}
            className={errors.complexity_score ? 'border-red-500' : ''}
            placeholder="Rate job complexity"
          />
          {errors.complexity_score && (
            <p className="text-sm text-red-600">{errors.complexity_score}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_estimated_hours" className="text-lg text-charcoal font-medium">
            Total Estimated Hours
          </Label>
          <Input
            id="total_estimated_hours"
            type="number"
            step="0.5"
            min="0"
            value={formData.total_estimated_hours}
            onChange={(e) => handleInputChange('total_estimated_hours', e.target.value ? Number(e.target.value) : '')}
            placeholder="Estimated work hours"
          />
        </div>
      </div>
    </div>
  );

  const renderEstimates = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Cost Estimates</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="estimated_material_cost" className="text-lg text-charcoal font-medium">
            Estimated Material Cost ($)
          </Label>
          <Input
            id="estimated_material_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.estimated_material_cost}
            onChange={(e) => handleInputChange('estimated_material_cost', e.target.value ? Number(e.target.value) : '')}
            placeholder="Material costs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_labor_cost" className="text-lg text-charcoal font-medium">
            Estimated Labor Cost ($)
          </Label>
          <Input
            id="estimated_labor_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.estimated_labor_cost}
            onChange={(e) => handleInputChange('estimated_labor_cost', e.target.value ? Number(e.target.value) : '')}
            placeholder="Labor costs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_equipment_cost" className="text-lg text-charcoal font-medium">
            Estimated Equipment Cost ($)
          </Label>
          <Input
            id="estimated_equipment_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.estimated_equipment_cost}
            onChange={(e) => handleInputChange('estimated_equipment_cost', e.target.value ? Number(e.target.value) : '')}
            placeholder="Equipment costs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_disposal_cost" className="text-lg text-charcoal font-medium">
            Estimated Disposal Cost ($)
          </Label>
          <Input
            id="estimated_disposal_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.estimated_disposal_cost}
            onChange={(e) => handleInputChange('estimated_disposal_cost', e.target.value ? Number(e.target.value) : '')}
            placeholder="Disposal costs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profit_margin_percent" className="text-lg text-charcoal font-medium">
            Profit Margin (%)
          </Label>
          <Input
            id="profit_margin_percent"
            type="number"
            min="0"
            max="100"
            value={formData.profit_margin_percent}
            onChange={(e) => handleInputChange('profit_margin_percent', Number(e.target.value))}
            className={errors.profit_margin_percent ? 'border-red-500' : ''}
            placeholder="Profit margin percentage"
          />
          {errors.profit_margin_percent && (
            <p className="text-sm text-red-600">{errors.profit_margin_percent}</p>
          )}
        </div>

        {/* Access and Equipment */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="dump_truck_access"
              type="checkbox"
              checked={formData.dump_truck_access}
              onChange={(e) => handleInputChange('dump_truck_access', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="dump_truck_access" className="text-lg text-charcoal font-medium">
              Dump Truck Access Available
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="crane_access_needed"
              type="checkbox"
              checked={formData.crane_access_needed}
              onChange={(e) => handleInputChange('crane_access_needed', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="crane_access_needed" className="text-lg text-charcoal font-medium">
              Crane Access Needed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="permit_required"
              type="checkbox"
              checked={formData.permit_required}
              onChange={(e) => handleInputChange('permit_required', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="permit_required" className="text-lg text-charcoal font-medium">
              Permit Required
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hoa_restrictions" className="text-lg text-charcoal font-medium">
            HOA Restrictions
          </Label>
          <Textarea
            id="hoa_restrictions"
            value={formData.hoa_restrictions}
            onChange={(e) => handleInputChange('hoa_restrictions', e.target.value)}
            placeholder="Any HOA restrictions or requirements"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderNotesAndQuality = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Notes & Quality Control</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="assessment_notes" className="text-lg text-charcoal font-medium">
            Assessment Notes
          </Label>
          <Textarea
            id="assessment_notes"
            value={formData.assessment_notes}
            onChange={(e) => handleInputChange('assessment_notes', e.target.value)}
            placeholder="General assessment observations and notes"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendations" className="text-lg text-charcoal font-medium">
            Recommendations
          </Label>
          <Textarea
            id="recommendations"
            value={formData.recommendations}
            onChange={(e) => handleInputChange('recommendations', e.target.value)}
            placeholder="Recommended services and improvements"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="photos_taken_count" className="text-lg text-charcoal font-medium">
              Photos Taken Count
            </Label>
            <Input
              id="photos_taken_count"
              type="number"
              min="0"
              value={formData.photos_taken_count}
              onChange={(e) => handleInputChange('photos_taken_count', e.target.value ? Number(e.target.value) : '')}
              placeholder="Number of photos taken"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighbor_considerations" className="text-lg text-charcoal font-medium">
              Neighbor Considerations
            </Label>
            <Input
              id="neighbor_considerations"
              value={formData.neighbor_considerations}
              onChange={(e) => handleInputChange('neighbor_considerations', e.target.value)}
              placeholder="Special neighbor considerations"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="measurements_verified"
              type="checkbox"
              checked={formData.measurements_verified}
              onChange={(e) => handleInputChange('measurements_verified', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="measurements_verified" className="text-lg text-charcoal font-medium">
              Measurements Verified
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="client_walkthrough_completed"
              type="checkbox"
              checked={formData.client_walkthrough_completed}
              onChange={(e) => handleInputChange('client_walkthrough_completed', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="client_walkthrough_completed" className="text-lg text-charcoal font-medium">
              Client Walkthrough Completed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="follow_up_needed"
              type="checkbox"
              checked={formData.follow_up_needed}
              onChange={(e) => handleInputChange('follow_up_needed', e.target.checked)}
              className="rounded border-stone-gray"
            />
            <Label htmlFor="follow_up_needed" className="text-lg text-charcoal font-medium">
              Follow-up Needed
            </Label>
          </div>
        </div>

        {formData.follow_up_needed && (
          <div className="space-y-2">
            <Label htmlFor="follow_up_notes" className="text-lg text-charcoal font-medium">
              Follow-up Notes
            </Label>
            <Textarea
              id="follow_up_notes"
              value={formData.follow_up_notes}
              onChange={(e) => handleInputChange('follow_up_notes', e.target.value)}
              placeholder="Details about required follow-up"
              rows={3}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="internal_notes" className="text-lg text-charcoal font-medium">
            Internal Notes (Private)
          </Label>
          <Textarea
            id="internal_notes"
            value={formData.internal_notes}
            onChange={(e) => handleInputChange('internal_notes', e.target.value)}
            placeholder="Internal notes not shared with client"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const FormContent = () => (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 <= currentStep
                  ? 'bg-forest-green text-paper-white'
                  : 'bg-stone-gray/20 text-stone-gray'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <span className="text-lg text-charcoal font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Error Display */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-stone-gray/20">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
        >
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex gap-3">
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-6 py-3 rounded-lg transition-all duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Assessment' : 'Create Assessment'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center gap-3">
            <FileText className="h-6 w-6" />
            {isEditing ? 'Edit Property Assessment' : 'New Property Assessment'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <FormContent />
        </CardContent>
      </Card>
    );
  }

  return <FormContent />;
}
