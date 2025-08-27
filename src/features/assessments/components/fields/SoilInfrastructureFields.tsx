'use client';

import { Droplets } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { IrrigationStatus, SoilCondition } from '../../types';

interface SoilInfrastructureFieldsProps {
  formData: {
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
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function SoilInfrastructureFields({ formData, errors, onChange }: SoilInfrastructureFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Droplets className="h-6 w-6 text-forest-green" />
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
            onValueChange={(value) => onChange('soil_condition', value as SoilCondition)}
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
            onChange={(e) => onChange('soil_ph', e.target.value ? Number(e.target.value) : '')}
            className={errors.soil_ph ? 'border-error-red' : ''}
            placeholder="Soil pH level"
          />
          {errors.soil_ph && (
            <p className="text-sm text-error-red font-medium" role="alert">{errors.soil_ph}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="drainage_quality" className="text-lg text-charcoal font-medium">
            Drainage Quality (1-5)
          </Label>
          <div className="relative">
            <Input
              id="drainage_quality"
              type="range"
              min="1"
              max="5"
              value={formData.drainage_quality || 3}
              onChange={(e) => onChange('drainage_quality', Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-charcoal mt-1">
              <span>Poor (1)</span>
              <span className="font-medium text-charcoal">{formData.drainage_quality || 3}</span>
              <span>Excellent (5)</span>
            </div>
          </div>
          {errors.drainage_quality && (
            <p className="text-sm text-error-red font-medium" role="alert">{errors.drainage_quality}</p>
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
            onChange={(e) => onChange('slope_grade_percent', e.target.value ? Number(e.target.value) : '')}
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
            onValueChange={(value) => onChange('irrigation_status', value as IrrigationStatus)}
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
            onChange={(e) => onChange('irrigation_zones_count', e.target.value ? Number(e.target.value) : '')}
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
            onChange={(e) => onChange('electrical_outlets_available', e.target.value ? Number(e.target.value) : '')}
            placeholder="Number of available outlets"
          />
        </div>

        {/* Boolean Fields */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.erosion_issues}
              onCheckedChange={(checked) => onChange('erosion_issues', checked)}
            />
            <Label htmlFor="erosion_issues" className="text-lg text-charcoal font-medium">
              Erosion Issues Present
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.water_source_access}
              onCheckedChange={(checked) => onChange('water_source_access', checked)}
            />
            <Label htmlFor="water_source_access" className="text-lg text-charcoal font-medium">
              Water Source Access Available
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.utility_lines_marked}
              onCheckedChange={(checked) => onChange('utility_lines_marked', checked)}
            />
            <Label htmlFor="utility_lines_marked" className="text-lg text-charcoal font-medium">
              Utility Lines Marked
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
