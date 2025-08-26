'use client';

import { FileText } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AssessmentOverallCondition } from '../../types';

interface OverallAssessmentFieldsProps {
  formData: {
    overall_condition: AssessmentOverallCondition | '';
    priority_level: number;
    complexity_score: number | '';
    total_estimated_hours: number | '';
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function OverallAssessmentFields({ formData, errors, onChange }: OverallAssessmentFieldsProps) {
  return (
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
            onValueChange={(value) => onChange('overall_condition', value as AssessmentOverallCondition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Excellent
                </div>
              </SelectItem>
              <SelectItem value="good">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Good
                </div>
              </SelectItem>
              <SelectItem value="fair">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Fair
                </div>
              </SelectItem>
              <SelectItem value="poor">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Poor
                </div>
              </SelectItem>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Critical
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority_level" className="text-lg text-charcoal font-medium">
            Priority Level (1-10)
          </Label>
          <div className="relative">
            <Input
              id="priority_level"
              type="range"
              min="1"
              max="10"
              value={formData.priority_level}
              onChange={(e) => onChange('priority_level', Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-stone-gray mt-1">
              <span>Low (1)</span>
              <span className="font-medium text-charcoal">{formData.priority_level}</span>
              <span>High (10)</span>
            </div>
          </div>
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
            onChange={(e) => onChange('complexity_score', e.target.value ? Number(e.target.value) : '')}
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
            onChange={(e) => onChange('total_estimated_hours', e.target.value ? Number(e.target.value) : '')}
            placeholder="Estimated work hours"
          />
        </div>
      </div>
    </div>
  );
}
