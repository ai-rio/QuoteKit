'use client';

import { Camera, FileText } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesQualityFieldsProps {
  formData: {
    assessment_notes: string;
    recommendations: string;
    photos_taken_count: number | '';
    neighbor_considerations: string;
    measurements_verified: boolean;
    client_walkthrough_completed: boolean;
    follow_up_needed: boolean;
    follow_up_notes: string;
    internal_notes: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function NotesQualityFields({ formData, errors, onChange }: NotesQualityFieldsProps) {
  return (
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
            onChange={(e) => onChange('assessment_notes', e.target.value)}
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
            onChange={(e) => onChange('recommendations', e.target.value)}
            placeholder="Recommended services and improvements"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="photos_taken_count" className="text-lg text-charcoal font-medium">
              Photos Taken Count
            </Label>
            <div className="relative">
              <Camera className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
              <Input
                id="photos_taken_count"
                type="number"
                min="0"
                value={formData.photos_taken_count}
                onChange={(e) => onChange('photos_taken_count', e.target.value ? Number(e.target.value) : '')}
                className="pl-10"
                placeholder="Number of photos taken"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighbor_considerations" className="text-lg text-charcoal font-medium">
              Neighbor Considerations
            </Label>
            <Input
              id="neighbor_considerations"
              value={formData.neighbor_considerations}
              onChange={(e) => onChange('neighbor_considerations', e.target.value)}
              placeholder="Special neighbor considerations"
            />
          </div>
        </div>

        {/* Quality Control Checkboxes */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quality Control Checklist
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.measurements_verified}
                onCheckedChange={(checked) => onChange('measurements_verified', checked)}
              />
              <Label htmlFor="measurements_verified" className="text-base text-charcoal">
                Measurements Verified
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.client_walkthrough_completed}
                onCheckedChange={(checked) => onChange('client_walkthrough_completed', checked)}
              />
              <Label htmlFor="client_walkthrough_completed" className="text-base text-charcoal">
                Client Walkthrough Completed
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.follow_up_needed}
                onCheckedChange={(checked) => onChange('follow_up_needed', checked)}
              />
              <Label htmlFor="follow_up_needed" className="text-base text-charcoal">
                Follow-up Needed
              </Label>
            </div>
          </div>
        </div>

        {/* Conditional Follow-up Notes */}
        {formData.follow_up_needed && (
          <div className="space-y-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Label htmlFor="follow_up_notes" className="text-lg text-charcoal font-medium">
              Follow-up Notes
            </Label>
            <Textarea
              id="follow_up_notes"
              value={formData.follow_up_notes}
              onChange={(e) => onChange('follow_up_notes', e.target.value)}
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
            onChange={(e) => onChange('internal_notes', e.target.value)}
            placeholder="Internal notes not shared with client"
            rows={3}
            className="bg-stone-50 border-stone-300"
          />
          <p className="text-sm text-stone-gray">These notes are private and will not be shared with the client.</p>
        </div>
      </div>
    </div>
  );
}
