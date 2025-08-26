'use client';

import { Calendar, Users } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AssessmentStatus } from '../../types';

interface BasicInformationFieldsProps {
  formData: {
    assessor_name: string;
    assessor_contact: string;
    scheduled_date: string;
    assessment_status: AssessmentStatus;
    weather_conditions: string;
    temperature_f: number | '';
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function BasicInformationFields({ formData, errors, onChange }: BasicInformationFieldsProps) {
  return (
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
            onChange={(e) => onChange('assessor_name', e.target.value)}
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
            onChange={(e) => onChange('assessor_contact', e.target.value)}
            placeholder="Phone or email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_date" className="text-lg text-charcoal font-medium">
            Scheduled Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
            <Input
              id="scheduled_date"
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => onChange('scheduled_date', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessment_status" className="text-lg text-charcoal font-medium">
            Assessment Status
          </Label>
          <Select
            value={formData.assessment_status}
            onValueChange={(value) => onChange('assessment_status', value as AssessmentStatus)}
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
            onChange={(e) => onChange('weather_conditions', e.target.value)}
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
            onChange={(e) => onChange('temperature_f', e.target.value ? Number(e.target.value) : '')}
            placeholder="Temperature in Fahrenheit"
          />
        </div>
      </div>
    </div>
  );
}
