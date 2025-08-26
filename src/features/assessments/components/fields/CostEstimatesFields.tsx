'use client';

import { DollarSign } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CostEstimatesFieldsProps {
  formData: {
    estimated_material_cost: number | '';
    estimated_labor_cost: number | '';
    estimated_equipment_cost: number | '';
    estimated_disposal_cost: number | '';
    profit_margin_percent: number;
    dump_truck_access: boolean;
    crane_access_needed: boolean;
    permit_required: boolean;
    hoa_restrictions: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function CostEstimatesFields({ formData, errors, onChange }: CostEstimatesFieldsProps) {
  const totalEstimatedCost = 
    (Number(formData.estimated_material_cost) || 0) +
    (Number(formData.estimated_labor_cost) || 0) +
    (Number(formData.estimated_equipment_cost) || 0) +
    (Number(formData.estimated_disposal_cost) || 0);

  const totalWithMargin = totalEstimatedCost * (1 + formData.profit_margin_percent / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Cost Estimates</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="estimated_material_cost" className="text-lg text-charcoal font-medium">
            Estimated Material Cost ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
            <Input
              id="estimated_material_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimated_material_cost}
              onChange={(e) => onChange('estimated_material_cost', e.target.value ? Number(e.target.value) : '')}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_labor_cost" className="text-lg text-charcoal font-medium">
            Estimated Labor Cost ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
            <Input
              id="estimated_labor_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimated_labor_cost}
              onChange={(e) => onChange('estimated_labor_cost', e.target.value ? Number(e.target.value) : '')}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_equipment_cost" className="text-lg text-charcoal font-medium">
            Estimated Equipment Cost ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
            <Input
              id="estimated_equipment_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimated_equipment_cost}
              onChange={(e) => onChange('estimated_equipment_cost', e.target.value ? Number(e.target.value) : '')}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_disposal_cost" className="text-lg text-charcoal font-medium">
            Estimated Disposal Cost ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
            <Input
              id="estimated_disposal_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimated_disposal_cost}
              onChange={(e) => onChange('estimated_disposal_cost', e.target.value ? Number(e.target.value) : '')}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profit_margin_percent" className="text-lg text-charcoal font-medium">
            Profit Margin (%)
          </Label>
          <div className="relative">
            <Input
              id="profit_margin_percent"
              type="number"
              min="0"
              max="100"
              value={formData.profit_margin_percent}
              onChange={(e) => onChange('profit_margin_percent', Number(e.target.value))}
              className={errors.profit_margin_percent ? 'border-red-500' : ''}
              placeholder="20"
            />
            <span className="absolute right-3 top-3 text-stone-gray">%</span>
          </div>
          {errors.profit_margin_percent && (
            <p className="text-sm text-red-600">{errors.profit_margin_percent}</p>
          )}
        </div>

        {/* Cost Summary */}
        <div className="space-y-2">
          <Label className="text-lg text-charcoal font-medium">Cost Summary</Label>
          <div className="bg-light-concrete rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-mono">${totalEstimatedCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Profit ({formData.profit_margin_percent}%):</span>
              <span className="font-mono">${(totalWithMargin - totalEstimatedCost).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-forest-green border-t pt-2">
              <span>Total:</span>
              <span className="font-mono">${totalWithMargin.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Access and Equipment Requirements */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-lg font-semibold text-charcoal">Equipment & Access Requirements</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.dump_truck_access}
                onCheckedChange={(checked) => onChange('dump_truck_access', checked)}
              />
              <Label htmlFor="dump_truck_access" className="text-base text-charcoal">
                Dump Truck Access Available
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.crane_access_needed}
                onCheckedChange={(checked) => onChange('crane_access_needed', checked)}
              />
              <Label htmlFor="crane_access_needed" className="text-base text-charcoal">
                Crane Access Needed
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.permit_required}
                onCheckedChange={(checked) => onChange('permit_required', checked)}
              />
              <Label htmlFor="permit_required" className="text-base text-charcoal">
                Permit Required
              </Label>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="hoa_restrictions" className="text-lg text-charcoal font-medium">
            HOA Restrictions
          </Label>
          <Textarea
            id="hoa_restrictions"
            value={formData.hoa_restrictions}
            onChange={(e) => onChange('hoa_restrictions', e.target.value)}
            placeholder="Any HOA restrictions or requirements"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
