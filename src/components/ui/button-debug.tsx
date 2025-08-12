'use client';

import { Check } from 'lucide-react';

import { EnhancedButton } from './enhanced-button';

/**
 * Debug component to test button visibility issues
 * This component tests different button variants to identify styling problems
 */
export function ButtonDebug() {
  return (
    <div className="p-8 space-y-4 bg-paper-white">
      <h2 className="text-2xl font-bold text-charcoal mb-4">Button Debug Test</h2>
      
      <div className="space-y-2">
        <h3 className="font-bold text-charcoal">Set Default Button Variants</h3>
        
        {/* Original problematic variant */}
        <div className="flex items-center space-x-4">
          <span className="w-32 text-sm">outline-primary:</span>
          <EnhancedButton size="sm" variant="outline-primary">
            <Check className="h-3 w-3 mr-1" />
            Set Default
          </EnhancedButton>
        </div>
        
        {/* Secondary variant */}
        <div className="flex items-center space-x-4">
          <span className="w-32 text-sm">secondary:</span>
          <EnhancedButton size="sm" variant="secondary">
            <Check className="h-3 w-3 mr-1" />
            Set Default
          </EnhancedButton>
        </div>
        
        {/* Primary variant */}
        <div className="flex items-center space-x-4">
          <span className="w-32 text-sm">primary:</span>
          <EnhancedButton size="sm" variant="primary">
            <Check className="h-3 w-3 mr-1" />
            Set Default
          </EnhancedButton>
        </div>
        
        {/* Outline variant */}
        <div className="flex items-center space-x-4">
          <span className="w-32 text-sm">outline:</span>
          <EnhancedButton size="sm" variant="outline">
            <Check className="h-3 w-3 mr-1" />
            Set Default
          </EnhancedButton>
        </div>
        
        {/* Success variant */}
        <div className="flex items-center space-x-4">
          <span className="w-32 text-sm">success:</span>
          <EnhancedButton size="sm" variant="success">
            <Check className="h-3 w-3 mr-1" />
            Set Default
          </EnhancedButton>
        </div>
        
        {/* Explicit styling test */}
        <div className="flex items-center space-x-4">
          <span className="w-32 text-sm">explicit:</span>
          <EnhancedButton 
            size="sm" 
            variant="secondary"
            className="!bg-yellow-400 !text-black !border-yellow-400 hover:!bg-yellow-500"
          >
            <Check className="h-3 w-3 mr-1" />
            Set Default
          </EnhancedButton>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-light-concrete rounded-lg">
        <h3 className="font-bold text-charcoal mb-2">CSS Variable Values</h3>
        <div className="space-y-1 text-sm font-mono">
          <div>--forest-green: <span className="inline-block w-4 h-4 bg-forest-green border"></span> hsl(147, 21%, 20%)</div>
          <div>--equipment-yellow: <span className="inline-block w-4 h-4 bg-equipment-yellow border"></span> hsl(47, 95%, 49%)</div>
          <div>--charcoal: <span className="inline-block w-4 h-4 bg-charcoal border"></span> hsl(0, 0%, 11%)</div>
          <div>--paper-white: <span className="inline-block w-4 h-4 bg-paper-white border"></span> hsl(0, 0%, 100%)</div>
        </div>
      </div>
    </div>
  );
}
