'use client';

import { Leaf } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { LawnCondition } from '../../types';

interface LawnAssessmentFieldsProps {
  formData: {
    lawn_condition: LawnCondition | '';
    lawn_area_measured: number | '';
    lawn_area_estimated: number | '';
    grass_type: string;
    weed_coverage_percent: number | '';
    bare_spots_count: number | '';
    thatch_thickness_inches: number | '';
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function LawnAssessmentFields({ formData, errors, onChange }: LawnAssessmentFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Leaf className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Lawn Assessment</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="lawn_condition" className="text-lg text-charcoal font-medium">
            Lawn Condition
          </Label>
          <Select
            value={formData.lawn_condition}
            onValueChange={(value) => onChange('lawn_condition', value as LawnCondition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select lawn condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pristine">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  Pristine
                </div>
              </SelectItem>
              <SelectItem value="healthy">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Healthy
                </div>
              </SelectItem>
              <SelectItem value="patchy">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Patchy
                </div>
              </SelectItem>
              <SelectItem value="poor">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Poor
                </div>
              </SelectItem>
              <SelectItem value="dead">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Dead
                </div>
              </SelectItem>
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
            onChange={(e) => onChange('grass_type', e.target.value)}
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
            onChange={(e) => onChange('lawn_area_measured', e.target.value ? Number(e.target.value) : '')}
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
            onChange={(e) => onChange('lawn_area_estimated', e.target.value ? Number(e.target.value) : '')}
            placeholder="Estimated lawn area"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weed_coverage_percent" className="text-lg text-charcoal font-medium">
            Weed Coverage (%)
          </Label>
          <div className="relative">
            <Input
              id="weed_coverage_percent"
              type="number"
              min="0"
              max="100"
              value={formData.weed_coverage_percent}
              onChange={(e) => onChange('weed_coverage_percent', e.target.value ? Number(e.target.value) : '')}
              className={errors.weed_coverage_percent ? 'border-red-500' : ''}
              placeholder="Percentage of weed coverage"
            />
            <span className="absolute right-3 top-3 text-stone-gray">%</span>
          </div>
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
            onChange={(e) => onChange('bare_spots_count', e.target.value ? Number(e.target.value) : '')}
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
            onChange={(e) => onChange('thatch_thickness_inches', e.target.value ? Number(e.target.value) : '')}
            placeholder="Thatch layer thickness"
          />
        </div>
      </div>
    </div>
  );
}
