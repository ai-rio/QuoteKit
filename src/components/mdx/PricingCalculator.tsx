/**
 * PricingCalculator Component for MDX Content
 * Interactive calculator for lawn care pricing demonstrations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorIcon, DollarSignIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';

interface PricingCalculatorProps {
  title?: string;
  className?: string;
  showBreakdown?: boolean;
}

interface ServiceType {
  id: string;
  name: string;
  baseRate: number;
  unit: string;
  description: string;
}

const serviceTypes: ServiceType[] = [
  {
    id: 'mowing',
    name: 'Lawn Mowing',
    baseRate: 0.05,
    unit: 'per sq ft',
    description: 'Basic lawn mowing service'
  },
  {
    id: 'edging',
    name: 'Edging & Trimming',
    baseRate: 0.02,
    unit: 'per linear ft',
    description: 'Edge trimming around walkways and beds'
  },
  {
    id: 'cleanup',
    name: 'Leaf Cleanup',
    baseRate: 0.08,
    unit: 'per sq ft',
    description: 'Seasonal leaf removal and cleanup'
  },
  {
    id: 'fertilizer',
    name: 'Fertilizer Application',
    baseRate: 0.12,
    unit: 'per sq ft',
    description: 'Professional fertilizer treatment'
  }
];

export function PricingCalculator({ 
  title = "Lawn Care Pricing Calculator",
  className,
  showBreakdown = true
}: PricingCalculatorProps) {
  const [selectedService, setSelectedService] = useState<ServiceType>(serviceTypes[0]);
  const [area, setArea] = useState<string>('1000');
  const [taxRate, setTaxRate] = useState<string>('8.25');
  const [results, setResults] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    const areaNum = parseFloat(area) || 0;
    const taxRateNum = parseFloat(taxRate) || 0;
    
    const subtotal = areaNum * selectedService.baseRate;
    const tax = subtotal * (taxRateNum / 100);
    const total = subtotal + tax;

    setResults({
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    });
  }, [selectedService, area, taxRate]);

  const handleServiceChange = (serviceId: string) => {
    const service = serviceTypes.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
    }
  };

  return (
    <Card className={cn('mb-6 border-forest-green/20', className)}>
      <CardHeader className="bg-forest-green/5">
        <CardTitle className="flex items-center gap-2 text-forest-green">
          <CalculatorIcon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-type" className="text-charcoal font-medium">
                Service Type
              </Label>
              <Select value={selectedService.id} onValueChange={handleServiceChange}>
                <SelectTrigger id="service-type" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-stone-gray">
                          ${service.baseRate.toFixed(3)} {service.unit}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-stone-gray mt-1">
                {selectedService.description}
              </p>
            </div>

            <div>
              <Label htmlFor="area" className="text-charcoal font-medium">
                Area ({selectedService.unit.includes('sq ft') ? 'Square Feet' : 'Linear Feet'})
              </Label>
              <Input
                id="area"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Enter area"
                className="mt-1"
                min="0"
                step="1"
              />
            </div>

            <div>
              <Label htmlFor="tax-rate" className="text-charcoal font-medium">
                Tax Rate (%)
              </Label>
              <Input
                id="tax-rate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="8.25"
                className="mt-1"
                min="0"
                max="20"
                step="0.01"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="bg-light-concrete rounded-lg p-4">
              <h4 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                <DollarSignIcon className="w-4 h-4" />
                Price Estimate
              </h4>
              
              {showBreakdown && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-gray">Subtotal:</span>
                    <span className="font-medium">${results.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-gray">Tax ({taxRate}%):</span>
                    <span className="font-medium">${results.tax.toFixed(2)}</span>
                  </div>
                  <hr className="border-stone-gray/30" />
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-charcoal">Total:</span>
                <span className="text-2xl font-bold text-forest-green">
                  ${results.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-equipment-yellow/10 rounded-lg p-4 border border-equipment-yellow/20">
              <p className="text-sm text-charcoal">
                <strong>Note:</strong> This is an estimate based on standard rates. 
                Actual pricing may vary based on property conditions, accessibility, 
                and additional services required.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Preset calculator variants for common use cases
export const MowingCalculator = (props: Omit<PricingCalculatorProps, 'title'>) => (
  <PricingCalculator 
    title="Lawn Mowing Price Calculator" 
    {...props} 
  />
);

export const SeasonalCalculator = (props: Omit<PricingCalculatorProps, 'title'>) => (
  <PricingCalculator 
    title="Seasonal Service Calculator" 
    {...props} 
  />
);
