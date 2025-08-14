/**
 * PricingCalculator Component for MDX Content
 * Interactive calculator for lawn care pricing demonstrations
 */

'use client';

import { CalculatorIcon, DollarSignIcon } from 'lucide-react';
import React, { useEffect,useState } from 'react';

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
    <Card className={cn('mb-6 border-forest-green/20 shadow-lg', className)}>
      <CardHeader className="bg-light-concrete border-b border-stone-gray/20">
        <CardTitle className="flex items-center gap-2 text-forest-green text-2xl font-bold">
          <CalculatorIcon className="w-6 h-6" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 bg-paper-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <Label 
                htmlFor="service-type" 
                className="text-lg font-semibold text-charcoal mb-2 block"
              >
                Service Type
              </Label>
              <Select value={selectedService.id} onValueChange={handleServiceChange}>
                <SelectTrigger 
                  id="service-type" 
                  className="
                    mt-2 
                    h-12 
                    text-lg 
                    bg-paper-white 
                    border-2 
                    border-stone-gray 
                    text-charcoal
                    focus:border-forest-green 
                    focus:ring-2 
                    focus:ring-forest-green/20
                    hover:border-forest-green/50
                  "
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-paper-white border-2 border-stone-gray">
                  {serviceTypes.map((service) => (
                    <SelectItem 
                      key={service.id} 
                      value={service.id}
                      className="
                        text-charcoal 
                        hover:bg-light-concrete 
                        focus:bg-light-concrete
                        cursor-pointer
                        p-4
                      "
                    >
                      <div>
                        <div className="font-semibold text-lg text-charcoal">
                          {service.name}
                        </div>
                        <div className="text-base text-charcoal/80 mt-1">
                          ${service.baseRate.toFixed(3)} {service.unit}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-base text-charcoal/80 mt-2 leading-relaxed">
                {selectedService.description}
              </p>
            </div>

            <div>
              <Label 
                htmlFor="area" 
                className="text-lg font-semibold text-charcoal mb-2 block"
              >
                Area ({selectedService.unit.includes('sq ft') ? 'Square Feet' : 'Linear Feet'})
              </Label>
              <Input
                id="area"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Enter area"
                className="
                  mt-2 
                  h-12 
                  text-lg 
                  bg-paper-white 
                  border-2 
                  border-stone-gray 
                  text-charcoal
                  placeholder:text-charcoal/60
                  focus:border-forest-green 
                  focus:ring-2 
                  focus:ring-forest-green/20
                  hover:border-forest-green/50
                "
                min="0"
                step="1"
              />
            </div>

            <div>
              <Label 
                htmlFor="tax-rate" 
                className="text-lg font-semibold text-charcoal mb-2 block"
              >
                Tax Rate (%)
              </Label>
              <Input
                id="tax-rate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="8.25"
                className="
                  mt-2 
                  h-12 
                  text-lg 
                  bg-paper-white 
                  border-2 
                  border-stone-gray 
                  text-charcoal
                  placeholder:text-charcoal/60
                  focus:border-forest-green 
                  focus:ring-2 
                  focus:ring-forest-green/20
                  hover:border-forest-green/50
                "
                min="0"
                max="20"
                step="0.01"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-light-concrete rounded-2xl p-6 border-2 border-stone-gray/20 shadow-sm">
              <h4 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
                <DollarSignIcon className="w-5 h-5" />
                Price Estimate
              </h4>
              
              {showBreakdown && (
                <div className="space-y-3 text-lg mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal/80 font-medium">Subtotal:</span>
                    <span className="font-semibold text-charcoal">
                      ${results.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal/80 font-medium">Tax ({taxRate}%):</span>
                    <span className="font-semibold text-charcoal">
                      ${results.tax.toFixed(2)}
                    </span>
                  </div>
                  <hr className="border-stone-gray/50 my-3" />
                </div>
              )}
              
              <div className="flex justify-between items-center bg-paper-white rounded-xl p-4 border-2 border-forest-green/20">
                <span className="text-xl font-bold text-charcoal">Total:</span>
                <span className="text-3xl font-black text-forest-green">
                  ${results.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-light-concrete rounded-2xl p-6 border-2 border-equipment-yellow/30 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-equipment-yellow flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-charcoal font-bold text-sm">!</span>
                </div>
                <div>
                  <p className="text-lg text-charcoal leading-relaxed">
                    <strong className="font-semibold">Note:</strong> This is an estimate based on standard rates. 
                    Actual pricing may vary based on property conditions, accessibility, 
                    and additional services required.
                  </p>
                </div>
              </div>
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
