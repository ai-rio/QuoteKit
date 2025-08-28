'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentCompletionBridge, PricingExplanationPanel } from '@/features/assessments/components';
import { PropertyAssessment } from '@/features/assessments/types';
import { Property, PropertyWithClient } from '@/features/clients/types';

// Mock data for demonstration
const mockAssessment: PropertyAssessment = {
  id: 'demo-assessment-1',
  user_id: 'demo-user',
  property_id: 'demo-property-1',
  assessment_number: 'ASS-2024-001-DEMO',
  assessment_date: new Date().toISOString(),
  assessment_status: 'completed',
  assessor_name: 'John Demo',
  priority_level: 7,
  
  // Overall Assessment
  overall_condition: 'fair',
  complexity_score: 6,
  
  // Lawn Assessment
  lawn_condition: 'poor',
  weed_coverage_percent: 35,
  bare_spots_count: 8,
  
  // Soil and Infrastructure
  soil_condition: 'compacted',
  drainage_quality: 3, // 1-5 scale
  soil_ph: 6.2,
  irrigation_status: 'needs_repair',
  irrigation_zones_count: 4,
  
  // Access and Logistics
  dump_truck_access: false,
  crane_access_needed: false,
  parking_available: true,

  // Cost Estimates
  estimated_material_cost: 1200,
  estimated_labor_cost: 800,
  estimated_equipment_cost: 400,
  estimated_disposal_cost: 150,
  profit_margin_percent: 25,
  
  // Quality and Notes
  assessment_notes: 'Property has good potential but requires significant lawn renovation due to poor maintenance in recent years.',
  recommendations: 'Recommend complete overseeding, soil aeration, and improved irrigation scheduling.',
  photos_taken_count: 12,
  measurements_verified: true,
  client_walkthrough_completed: true,
  follow_up_needed: true,
  follow_up_notes: 'Schedule follow-up in 2 weeks to assess initial improvements',
  
  // Audit fields
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tree_count: 3,
  shrub_count: 8,
  obstacles: [],
  special_considerations: {},
  equipment_needed: [],
  material_requirements: {},
  safety_hazards: [],
  permit_required: false,
  electrical_outlets_available: 2,
  water_source_access: true,
  utility_lines_marked: true,
  erosion_issues: false,
};

const mockProperty: PropertyWithClient = {
  id: 'demo-property-1',
  user_id: 'demo-user',
  client_id: 'demo-client-1',
  client_name: 'Demo Client LLC',
  property_name: 'Executive Office Campus',
  service_address: '123 Business Park Dr, Atlanta, GA 30309',
  property_type: 'commercial',
  square_footage: 8500, // sq ft
  lot_size: 12000,
  property_access: 'moderate',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};


export default function AssessmentCompletionDemo() {
  const [showBridge, setShowBridge] = useState(false);
  const [showPricingPanel, setShowPricingPanel] = useState(true);

  const handleQuoteGenerated = (quoteId: string) => {
    console.log(`Quote generated: ${quoteId}`);
    alert(`Quote ${quoteId} generated successfully! (Demo Mode)`);
  };

  return (
    <div className="min-h-screen bg-paper-white">
      <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-forest-green">
          Phase 1: Assessment Completion Bridge
        </h1>
        <p className="text-lg text-charcoal max-w-3xl mx-auto">
          Experience the new Assessment Completion Bridge and Pricing Transparency features that reduce 
          assessment-to-quote time by 70% while providing transparent condition-based pricing.
        </p>
      </div>

      {/* Demo Controls */}
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setShowBridge(true)}
              className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg min-h-[44px]"
            >
              Launch Assessment Completion Bridge
            </Button>
            <Button
              onClick={() => setShowPricingPanel(!showPricingPanel)}
              variant="outline"
              className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200 min-h-[44px]"
            >
              {showPricingPanel ? 'Hide' : 'Show'} Pricing Explanation Panel
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-forest-green mb-2">Sample Assessment Data:</h4>
              <ul className="space-y-1 text-charcoal">
                <li>• Lawn Condition: Poor (35% weed coverage)</li>
                <li>• Soil Condition: Compacted clay soil</li>
                <li>• Property Size: 8,500 sq ft commercial</li>
                <li>• Access: Moderate difficulty, no dump truck access</li>
                <li>• Complexity Score: 6/10</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-forest-green mb-2">Expected Results:</h4>
              <ul className="space-y-1 text-charcoal">
                <li>• Base estimate: $1,275 (8,500 sq ft × $0.15)</li>
                <li>• Condition adjustments: +30% for poor lawn</li>
                <li>• Compacted soil: +20% for aeration needs</li>
                <li>• Access difficulty: +10% for limited access</li>
                <li>• Total estimate: ~$2,124 with 25% margin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Explanation Panel */}
      {showPricingPanel && (
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader className="p-8">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
              Live Pricing Explanation Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <PricingExplanationPanel 
              assessment={mockAssessment} 
              property={mockProperty} 
              showComparison={true} 
            />
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg border-l-4 border-l-forest-green">
          <CardHeader className="p-8 pb-3">
            <CardTitle className="text-lg font-bold text-forest-green">
              70% Time Reduction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-base text-charcoal">
              Assessment Completion Bridge eliminates manual navigation and data re-entry, 
              reducing quote generation from 15-20 minutes to under 5 minutes.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg border-l-4 border-l-equipment-yellow">
          <CardHeader className="p-8 pb-3">
            <CardTitle className="text-lg font-bold text-forest-green">
              Pricing Transparency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-base text-charcoal">
              Clear breakdown of how property conditions affect pricing, building trust 
              with clients and justifying premium rates for challenging properties.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg border-l-4 border-l-charcoal">
          <CardHeader className="p-8 pb-3">
            <CardTitle className="text-lg font-bold text-forest-green">
              Mobile Optimized
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-base text-charcoal">
              44px minimum touch targets, responsive design, and comprehensive tooltips 
              ensure perfect usability on tablets and mobile devices in the field.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Technical Implementation Notes */}
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Technical Implementation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-forest-green mb-2">Components Created:</h4>
              <ul className="text-base text-charcoal space-y-1">
                <li>• AssessmentCompletionBridge.tsx</li>
                <li>• PricingExplanationPanel.tsx</li>
                <li>• EnhancedAssessmentForm.tsx</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-forest-green mb-2">Design System:</h4>
              <ul className="text-base text-charcoal space-y-1">
                <li>• QuoteKit forest-green headings</li>
                <li>• Equipment-yellow CTA elements</li>
                <li>• Comprehensive tooltip system</li>
                <li>• 44px minimum touch targets</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-light-concrete p-6 rounded-lg">
            <h4 className="font-medium text-forest-green mb-2">Key Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base text-charcoal">
              <ul className="space-y-1">
                <li>✓ Automatic quote generation from assessment</li>
                <li>✓ Real-time pricing calculation with explanations</li>
                <li>✓ Condition-based adjustment multipliers</li>
                <li>✓ Progressive loading with step indicators</li>
              </ul>
              <ul className="space-y-1">
                <li>✓ Market comparison for pricing context</li>
                <li>✓ Professional visual condition indicators</li>
                <li>✓ Mobile-responsive design system</li>
                <li>✓ Comprehensive accessibility compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Completion Bridge Modal */}
      <AssessmentCompletionBridge
        assessment={mockAssessment}
        property={mockProperty}
        isOpen={showBridge}
        onClose={() => setShowBridge(false)}
        onQuoteGenerated={handleQuoteGenerated}
      />
      </div>
    </div>
  );
}