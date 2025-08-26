import { EquipmentCategory,PropertyAssessment } from '@/features/assessments/types';
import { LineItem } from '@/features/items/types';

export interface PricingAdjustment {
  factor: string;
  multiplier: number;
  reason: string;
  category: 'condition' | 'complexity' | 'access' | 'equipment' | 'material' | 'labor';
  impact: 'low' | 'medium' | 'high';
  costBasis?: number; // Base cost this adjustment applies to
}

export interface EquipmentCost {
  category: EquipmentCategory;
  equipmentType: string;
  dailyRate: number;
  daysNeeded: number;
  totalCost: number;
  reason: string;
  required: boolean;
}

export interface MaterialAdjustment {
  material: string;
  baseQuantity: number;
  adjustedQuantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
  category: 'soil_amendment' | 'seed_fertilizer' | 'mulch' | 'hardscape' | 'irrigation';
}

export interface LaborBreakdown {
  category: string;
  description: string;
  hours: number;
  hourlyRate: number;
  totalCost: number;
  complexity: 'basic' | 'intermediate' | 'advanced' | 'specialist';
  crewSize: number;
}

export interface PricingOverride {
  itemId: string;
  originalPrice: number;
  overridePrice: number;
  reason: string;
  approvedBy?: string;
  assessmentSuggested: boolean;
}

export interface AssessmentPricingResult {
  basePrice: number;
  adjustments: PricingAdjustment[];
  equipmentCosts: EquipmentCost[];
  materialAdjustments: MaterialAdjustment[];
  laborBreakdown: LaborBreakdown[];
  overrides: PricingOverride[];
  finalPrice: number;
  totalMultiplier: number;
  totalLaborHours: number;
  confidenceScore: number; // 0-100, how confident we are in the pricing
  pricingTransparency: {
    baseCostBreakdown: Record<string, number>;
    adjustmentBreakdown: Record<string, number>;
    finalBreakdown: Record<string, number>;
  };
  suggestedItems: Array<{
    item: LineItem;
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    assessmentBased: boolean;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
}

// Industry-standard pricing constants based on 2024/2025 lawn care research
const PRICING_CONSTANTS = {
  // Labor rates by complexity (per hour)
  LABOR_RATES: {
    basic: 50,      // Basic mowing, edging, cleanup
    intermediate: 65, // Landscaping, planting, mulching  
    advanced: 75,    // Tree work, hardscaping, irrigation
    specialist: 100  // Specialized equipment, hazardous work
  },
  // Base hours per 1000 sq ft by service type
  BASE_HOURS_PER_1000_SQFT: {
    mowing: 0.5,
    edging: 0.3,
    cleanup: 0.4,
    fertilization: 0.2,
    overseeding: 0.6,
    aeration: 0.4,
    renovation: 2.5,
    landscaping: 1.5,
    mulching: 1.0
  },
  // Equipment daily rental rates
  EQUIPMENT_RATES: {
    mowing: { basic: 150, commercial: 250, zero_turn: 300 },
    landscaping: { basic: 100, excavator: 400, bobcat: 350 },
    irrigation: { trencher: 200, boring: 300, specialty: 150 },
    soil_care: { aerator: 180, dethatcher: 120, tiller: 100 },
    tree_care: { chipper: 250, crane: 800, stump_grinder: 400 },
    cleanup: { debris_loader: 200, vacuum: 150, trailer: 50 },
    specialized: { laser_level: 300, compactor: 180, generator: 80 },
    safety: { traffic_control: 100, fencing: 50, signage: 25 }
  },
  // Material cost adjustments by condition
  MATERIAL_MULTIPLIERS: {
    soil_condition: {
      excellent: 1.0,
      good: 1.05,
      compacted: 1.25,
      sandy: 1.15,
      clay: 1.20,
      contaminated: 1.60
    },
    lawn_condition: {
      pristine: 1.0,
      healthy: 1.0,
      patchy: 1.15,
      poor: 1.35,
      dead: 1.50
    }
  },
  // Complexity impact on different cost categories
  COMPLEXITY_IMPACT: {
    labor: 0.15,      // 15% impact per complexity point above 5
    equipment: 0.10,  // 10% impact per complexity point above 5  
    material: 0.05    // 5% impact per complexity point above 5
  }
};

/**
 * Calculate comprehensive assessment-driven pricing with industry-standard formulas
 */
export function calculateAssessmentPricing(
  assessment: PropertyAssessment,
  baseItems: LineItem[],
  basePrice: number = 0
): AssessmentPricingResult {
  const adjustments: PricingAdjustment[] = [];
  const equipmentCosts: EquipmentCost[] = [];
  const materialAdjustments: MaterialAdjustment[] = [];
  const laborBreakdown: LaborBreakdown[] = [];
  const suggestedItems: AssessmentPricingResult['suggestedItems'] = [];
  const overrides: PricingOverride[] = [];

  // Calculate property metrics for pricing
  const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
  const areaInThousands = lawnArea / 1000;
  const complexityScore = assessment.complexity_score || 5;
  const complexityMultiplier = complexityScore > 5 ? 1 + ((complexityScore - 5) * 0.1) : 1;
  
  // Initialize pricing transparency tracking
  const baseCostBreakdown: Record<string, number> = {};
  const adjustmentBreakdown: Record<string, number> = {};
  const finalBreakdown: Record<string, number> = {};
  
  let confidenceScore = 85; // Start with high confidence, reduce for missing data

  // Lawn condition adjustments
  if (assessment.lawn_condition) {
    switch (assessment.lawn_condition) {
      case 'dead':
      case 'poor':
        adjustments.push({
          factor: 'Poor Lawn Condition',
          multiplier: 1.4,
          reason: 'Complete lawn renovation required with soil preparation',
          category: 'condition',
          impact: 'high'
        });
        break;
      case 'patchy':
        adjustments.push({
          factor: 'Patchy Lawn',
          multiplier: 1.2,
          reason: 'Additional overseeding and spot treatment needed',
          category: 'condition',
          impact: 'medium'
        });
        break;
      case 'healthy':
        // No adjustment needed for healthy lawns
        break;
    }
  }

  // Soil condition adjustments
  if (assessment.soil_condition) {
    switch (assessment.soil_condition) {
      case 'compacted':
        adjustments.push({
          factor: 'Compacted Soil',
          multiplier: 1.25,
          reason: 'Aeration and soil amendment required',
          category: 'condition',
          impact: 'medium'
        });
        break;
      case 'contaminated':
        adjustments.push({
          factor: 'Contaminated Soil',
          multiplier: 1.6,
          reason: 'Specialized handling and disposal required',
          category: 'condition',
          impact: 'high'
        });
        break;
      case 'clay':
        adjustments.push({
          factor: 'Clay Soil',
          multiplier: 1.2,
          reason: 'Clay soil requires additional amendments',
          category: 'condition',
          impact: 'medium'
        });
        break;
    }
  }

  // Weed coverage adjustments
  if (assessment.weed_coverage_percent) {
    if (assessment.weed_coverage_percent > 50) {
      adjustments.push({
        factor: 'Heavy Weed Infestation',
        multiplier: 1.3,
        reason: `${assessment.weed_coverage_percent}% weed coverage requires intensive treatment`,
        category: 'condition',
        impact: 'high'
      });
    } else if (assessment.weed_coverage_percent > 25) {
      adjustments.push({
        factor: 'Moderate Weed Coverage',
        multiplier: 1.15,
        reason: `${assessment.weed_coverage_percent}% weed coverage needs treatment`,
        category: 'condition',
        impact: 'medium'
      });
    }
  }

  // Complexity score adjustments
  if (assessment.complexity_score) {
    if (assessment.complexity_score >= 8) {
      adjustments.push({
        factor: 'High Complexity',
        multiplier: 1.25,
        reason: 'Complex site conditions require specialized approach',
        category: 'complexity',
        impact: 'high'
      });
    } else if (assessment.complexity_score >= 6) {
      adjustments.push({
        factor: 'Moderate Complexity',
        multiplier: 1.1,
        reason: 'Some site challenges increase labor requirements',
        category: 'complexity',
        impact: 'medium'
      });
    }
  }

  // Access and equipment adjustments
  if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
    adjustments.push({
      factor: 'Limited Vehicle Access',
      multiplier: 1.2,
      reason: `${assessment.vehicle_access_width_feet}ft access requires smaller equipment`,
      category: 'access',
      impact: 'medium'
    });
  }

  if (!assessment.dump_truck_access) {
    adjustments.push({
      factor: 'No Dump Truck Access',
      multiplier: 1.15,
      reason: 'Manual material transport increases labor costs',
      category: 'access',
      impact: 'medium'
    });
  }

  if (assessment.crane_access_needed) {
    adjustments.push({
      factor: 'Crane Access Required',
      multiplier: 1.3,
      reason: 'Specialized equipment rental and operation',
      category: 'equipment',
      impact: 'high'
    });
  }

  // Slope adjustments
  if (assessment.slope_grade_percent && assessment.slope_grade_percent > 15) {
    adjustments.push({
      factor: 'Steep Slope',
      multiplier: 1.2,
      reason: `${assessment.slope_grade_percent}% grade increases difficulty and safety requirements`,
      category: 'complexity',
      impact: 'medium'
    });
  }

  // Obstacle density adjustments
  const propertyLawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
  const treeCount = assessment.tree_count || 0;
  const shrubCount = assessment.shrub_count || 0;
  const totalObstacles = treeCount + shrubCount;
  const obstaclesDensity = totalObstacles / (propertyLawnArea / 1000); // obstacles per 1000 sq ft

  if (obstaclesDensity > 10) {
    adjustments.push({
      factor: 'High Obstacle Density',
      multiplier: 1.25,
      reason: `${totalObstacles} obstacles in ${propertyLawnArea} sq ft requires careful navigation`,
      category: 'complexity',
      impact: 'high'
    });
  } else if (obstaclesDensity > 5) {
    adjustments.push({
      factor: 'Moderate Obstacles',
      multiplier: 1.1,
      reason: `${totalObstacles} obstacles require additional care`,
      category: 'complexity',
      impact: 'medium'
    });
  }

  // Calculate equipment costs based on assessment requirements
  const calculatedEquipmentCosts = calculateEquipmentCosts(assessment);
  equipmentCosts.push(...calculatedEquipmentCosts);
  
  // Calculate material adjustments
  const calculatedMaterialAdjustments = calculateMaterialAdjustments(assessment, areaInThousands);
  materialAdjustments.push(...calculatedMaterialAdjustments);
  
  // Calculate labor breakdown with industry formulas
  const calculatedLaborBreakdown = calculateLaborBreakdown(assessment, areaInThousands, complexityScore);
  laborBreakdown.push(...calculatedLaborBreakdown);
  
  // Calculate total labor hours
  const totalLaborHours = laborBreakdown.reduce((sum, labor) => sum + labor.hours, 0);
  
  // Build cost breakdowns for transparency
  baseCostBreakdown['Base Service Cost'] = basePrice;
  baseCostBreakdown['Labor Hours'] = totalLaborHours;
  baseCostBreakdown['Equipment Daily Rates'] = equipmentCosts.reduce((sum, eq) => sum + eq.totalCost, 0);
  baseCostBreakdown['Material Adjustments'] = materialAdjustments.reduce((sum, mat) => sum + mat.totalCost, 0);
  
  // Apply adjustments to base price
  const totalMultiplier = adjustments.reduce((total, adj) => total * adj.multiplier, 1);
  const equipmentTotal = equipmentCosts.reduce((sum, eq) => sum + eq.totalCost, 0);
  const materialTotal = materialAdjustments.reduce((sum, mat) => sum + mat.totalCost, 0);
  const laborTotal = laborBreakdown.reduce((sum, labor) => sum + labor.totalCost, 0);
  
  // Calculate final price with all components
  const adjustedBasePrice = basePrice * totalMultiplier;
  const finalPrice = adjustedBasePrice + equipmentTotal + materialTotal + laborTotal;
  
  // Track final breakdown
  finalBreakdown['Adjusted Base Price'] = adjustedBasePrice;
  finalBreakdown['Equipment Costs'] = equipmentTotal;
  finalBreakdown['Material Costs'] = materialTotal;
  finalBreakdown['Labor Costs'] = laborTotal;
  finalBreakdown['Total'] = finalPrice;
  
  // Track adjustment breakdown
  adjustments.forEach(adj => {
    const adjustmentCost = (adj.costBasis || basePrice) * (adj.multiplier - 1);
    adjustmentBreakdown[adj.factor] = adjustmentCost;
  });
  
  // Adjust confidence score based on data quality
  if (!assessment.lawn_area_measured) confidenceScore -= 10;
  if (!assessment.complexity_score) confidenceScore -= 8;
  if (!assessment.soil_condition) confidenceScore -= 5;
  if (!assessment.total_estimated_hours) confidenceScore -= 7;
  
  return {
    basePrice,
    adjustments,
    equipmentCosts,
    materialAdjustments,
    laborBreakdown,
    overrides,
    finalPrice,
    totalMultiplier,
    totalLaborHours,
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    pricingTransparency: {
      baseCostBreakdown,
      adjustmentBreakdown,
      finalBreakdown
    },
    suggestedItems
  };
}

/**
 * Calculate equipment costs based on assessment requirements
 */
export function calculateEquipmentCosts(assessment: PropertyAssessment): EquipmentCost[] {
  const equipmentCosts: EquipmentCost[] = [];
  const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
  
  // Calculate days needed based on area and complexity
  const baseDaysNeeded = Math.ceil(lawnArea / 5000); // 5000 sq ft per day baseline
  const complexityDays = assessment.complexity_score ? Math.ceil(assessment.complexity_score / 3) : 1;
  
  // Process each equipment category needed
  if (assessment.equipment_needed && assessment.equipment_needed.length > 0) {
    assessment.equipment_needed.forEach(category => {
      const rates = PRICING_CONSTANTS.EQUIPMENT_RATES[category];
      if (!rates) return;
      
      let equipmentType = 'basic';
      let daysNeeded = baseDaysNeeded;
      let reason = `Required for ${category} work`;
      
      // Determine specific equipment type based on conditions
      switch (category) {
        case 'mowing':
          if (lawnArea > 10000) {
            equipmentType = 'zero_turn';
            reason = `Large area (${lawnArea} sq ft) requires zero-turn mower`;
          } else if (lawnArea > 5000) {
            equipmentType = 'commercial';
            reason = `Medium area (${lawnArea} sq ft) requires commercial mower`;
          }
          daysNeeded = Math.max(1, Math.ceil(lawnArea / 20000)); // 20k sq ft per day for mowing
          break;
          
        case 'landscaping':
          if (assessment.hardscape_area_measured && assessment.hardscape_area_measured > 500) {
            equipmentType = 'excavator';
            reason = `Hardscaping work (${assessment.hardscape_area_measured} sq ft) requires excavator`;
            daysNeeded = Math.ceil(assessment.hardscape_area_measured / 1000);
          } else if (assessment.tree_count > 10 || assessment.shrub_count > 20) {
            equipmentType = 'bobcat';
            reason = `Heavy landscaping (${assessment.tree_count} trees, ${assessment.shrub_count} shrubs) requires bobcat`;
            daysNeeded = complexityDays;
          }
          break;
          
        case 'soil_care':
          if (assessment.soil_condition === 'compacted') {
            equipmentType = 'aerator';
            reason = 'Compacted soil requires core aeration equipment';
            daysNeeded = Math.ceil(lawnArea / 10000); // 10k sq ft per day for aeration
          } else {
            equipmentType = 'tiller';
            reason = 'Soil preparation requires tilling equipment';
            daysNeeded = Math.ceil(lawnArea / 8000);
          }
          break;
          
        case 'tree_care':
          if (assessment.tree_count > 5) {
            equipmentType = 'chipper';
            reason = `Multiple trees (${assessment.tree_count}) require chipping equipment`;
            daysNeeded = Math.ceil(assessment.tree_count / 10);
          }
          if (assessment.crane_access_needed) {
            equipmentCosts.push({
              category,
              equipmentType: 'crane',
              dailyRate: 800, // Fixed rate for crane
              daysNeeded: 1,
              totalCost: 800,
              reason: 'Assessment indicates crane access needed for tree work',
              required: true
            });
          }
          break;
          
        case 'irrigation':
          if (assessment.irrigation_zones_count > 4) {
            equipmentType = 'boring';
            reason = `Multiple irrigation zones (${assessment.irrigation_zones_count}) require boring equipment`;
            daysNeeded = Math.ceil(assessment.irrigation_zones_count / 2);
          } else {
            equipmentType = 'trencher';
            reason = 'Irrigation installation requires trenching equipment';
            daysNeeded = Math.max(1, Math.ceil(lawnArea / 15000));
          }
          break;
          
        case 'cleanup':
          if (assessment.tree_count > 10) {
            equipmentType = 'debris_loader';
            reason = 'Large cleanup job requires debris loading equipment';
            daysNeeded = Math.ceil(assessment.tree_count / 15);
          }
          break;
          
        case 'specialized':
          if (assessment.slope_grade_percent && assessment.slope_grade_percent > 15) {
            equipmentType = 'laser_level';
            reason = `Steep slope (${assessment.slope_grade_percent}%) requires specialized leveling equipment`;
          }
          break;
      }
      
      const dailyRate = (rates as any)[equipmentType] || (rates as any).basic || 100;
      
      equipmentCosts.push({
        category,
        equipmentType,
        dailyRate,
        daysNeeded,
        totalCost: dailyRate * daysNeeded,
        reason,
        required: true
      });
    });
  }
  
  // Add access-based equipment requirements
  if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
    equipmentCosts.push({
      category: 'specialized' as EquipmentCategory,
      equipmentType: 'compact_equipment',
      dailyRate: 200,
      daysNeeded: baseDaysNeeded,
      totalCost: 200 * baseDaysNeeded,
      reason: `Narrow access (${assessment.vehicle_access_width_feet}ft) requires compact equipment`,
      required: true
    });
  }
  
  if (!assessment.dump_truck_access) {
    equipmentCosts.push({
      category: 'cleanup' as EquipmentCategory,
      equipmentType: 'trailer',
      dailyRate: 50,
      daysNeeded: baseDaysNeeded,
      totalCost: 50 * baseDaysNeeded,
      reason: 'No dump truck access requires trailer for material transport',
      required: true
    });
  }
  
  return equipmentCosts;
}

/**
 * Calculate material adjustments based on soil conditions and complexity
 */
export function calculateMaterialAdjustments(assessment: PropertyAssessment, areaInThousands: number): MaterialAdjustment[] {
  const materialAdjustments: MaterialAdjustment[] = [];
  
  // Soil amendment adjustments
  if (assessment.soil_condition) {
    const soilMultiplier = PRICING_CONSTANTS.MATERIAL_MULTIPLIERS.soil_condition[assessment.soil_condition] || 1.0;
    
    if (soilMultiplier > 1.0) {
      const baseQuantity = areaInThousands * 2; // 2 cubic yards per 1000 sq ft baseline
      const adjustedQuantity = baseQuantity * soilMultiplier;
      
      materialAdjustments.push({
        material: 'Soil Amendment',
        baseQuantity,
        adjustedQuantity,
        unitCost: 45, // $45 per cubic yard
        totalCost: adjustedQuantity * 45,
        reason: `${assessment.soil_condition} soil condition requires ${((soilMultiplier - 1) * 100).toFixed(0)}% more soil amendment`,
        category: 'soil_amendment'
      });
    }
  }
  
  // Seed and fertilizer adjustments based on lawn condition
  if (assessment.lawn_condition) {
    const lawnMultiplier = PRICING_CONSTANTS.MATERIAL_MULTIPLIERS.lawn_condition[assessment.lawn_condition] || 1.0;
    
    if (lawnMultiplier > 1.0) {
      const baseSeedQuantity = areaInThousands * 50; // 50 lbs per 1000 sq ft
      const adjustedSeedQuantity = baseSeedQuantity * lawnMultiplier;
      
      materialAdjustments.push({
        material: 'Grass Seed',
        baseQuantity: baseSeedQuantity,
        adjustedQuantity: adjustedSeedQuantity,
        unitCost: 3.50, // $3.50 per lb
        totalCost: adjustedSeedQuantity * 3.50,
        reason: `${assessment.lawn_condition} lawn condition requires ${((lawnMultiplier - 1) * 100).toFixed(0)}% more seed`,
        category: 'seed_fertilizer'
      });
    }
  }
  
  // Mulch adjustments for landscape beds
  if (assessment.flower_bed_area && assessment.flower_bed_area > 0) {
    const mulchQuantity = Math.ceil(assessment.flower_bed_area / 100); // 100 sq ft per cubic yard
    const complexityMultiplier = assessment.complexity_score && assessment.complexity_score > 6 ? 1.15 : 1.0;
    
    materialAdjustments.push({
      material: 'Premium Mulch',
      baseQuantity: mulchQuantity,
      adjustedQuantity: mulchQuantity * complexityMultiplier,
      unitCost: 85, // $85 per cubic yard from pricing research
      totalCost: mulchQuantity * complexityMultiplier * 85,
      reason: `Flower bed area (${assessment.flower_bed_area} sq ft) requires mulch application`,
      category: 'mulch'
    });
  }
  
  // Irrigation material adjustments
  if (assessment.irrigation_zones_count > 0) {
    const baseIrrigationCost = assessment.irrigation_zones_count * 150; // $150 per zone baseline
    const complexityMultiplier = 1 + ((assessment.complexity_score || 5) - 5) * 0.1;
    
    materialAdjustments.push({
      material: 'Irrigation Components',
      baseQuantity: assessment.irrigation_zones_count,
      adjustedQuantity: assessment.irrigation_zones_count,
      unitCost: 150 * complexityMultiplier,
      totalCost: baseIrrigationCost * complexityMultiplier,
      reason: `${assessment.irrigation_zones_count} irrigation zones with complexity adjustments`,
      category: 'irrigation'
    });
  }
  
  return materialAdjustments;
}

/**
 * Calculate detailed labor breakdown using industry-standard formulas
 */
export function calculateLaborBreakdown(assessment: PropertyAssessment, areaInThousands: number, complexityScore: number): LaborBreakdown[] {
  const laborBreakdown: LaborBreakdown[] = [];
  const complexityMultiplier = complexityScore > 5 ? 1 + ((complexityScore - 5) * PRICING_CONSTANTS.COMPLEXITY_IMPACT.labor) : 1;
  
  // Determine crew sizes based on area and complexity
  const baseCrewSize = areaInThousands > 3 ? 3 : 2;
  const complexCrewSize = complexityScore > 7 ? baseCrewSize + 1 : baseCrewSize;
  
  // Basic lawn care labor
  if (assessment.lawn_condition && assessment.lawn_condition !== 'dead') {
    const baseHours = areaInThousands * PRICING_CONSTANTS.BASE_HOURS_PER_1000_SQFT.mowing * complexityMultiplier;
    
    laborBreakdown.push({
      category: 'Lawn Maintenance',
      description: 'Mowing, edging, and basic lawn care',
      hours: baseHours,
      hourlyRate: PRICING_CONSTANTS.LABOR_RATES.basic,
      totalCost: baseHours * PRICING_CONSTANTS.LABOR_RATES.basic,
      complexity: 'basic',
      crewSize: baseCrewSize
    });
  }
  
  // Lawn renovation labor for poor/dead conditions
  if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
    const renovationHours = areaInThousands * PRICING_CONSTANTS.BASE_HOURS_PER_1000_SQFT.renovation * complexityMultiplier;
    
    laborBreakdown.push({
      category: 'Lawn Renovation',
      description: 'Complete lawn renovation including soil prep and seeding',
      hours: renovationHours,
      hourlyRate: PRICING_CONSTANTS.LABOR_RATES.advanced,
      totalCost: renovationHours * PRICING_CONSTANTS.LABOR_RATES.advanced,
      complexity: 'advanced',
      crewSize: complexCrewSize
    });
  }
  
  // Soil care labor
  if (assessment.soil_condition === 'compacted') {
    const aerationHours = areaInThousands * PRICING_CONSTANTS.BASE_HOURS_PER_1000_SQFT.aeration * complexityMultiplier;
    
    laborBreakdown.push({
      category: 'Soil Treatment',
      description: 'Core aeration and soil decompaction',
      hours: aerationHours,
      hourlyRate: PRICING_CONSTANTS.LABOR_RATES.intermediate,
      totalCost: aerationHours * PRICING_CONSTANTS.LABOR_RATES.intermediate,
      complexity: 'intermediate',
      crewSize: baseCrewSize
    });
  }
  
  // Landscaping labor
  if (assessment.tree_count > 0 || assessment.shrub_count > 0) {
    const landscapingHours = (assessment.tree_count * 0.5 + assessment.shrub_count * 0.25) * complexityMultiplier;
    
    laborBreakdown.push({
      category: 'Landscaping',
      description: `Tree and shrub maintenance (${assessment.tree_count} trees, ${assessment.shrub_count} shrubs)`,
      hours: landscapingHours,
      hourlyRate: PRICING_CONSTANTS.LABOR_RATES.intermediate,
      totalCost: landscapingHours * PRICING_CONSTANTS.LABOR_RATES.intermediate,
      complexity: 'intermediate',
      crewSize: baseCrewSize
    });
  }
  
  // Specialized labor for high complexity or difficult access
  if (complexityScore > 8 || (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 6)) {
    const specialistHours = areaInThousands * 0.5; // Additional specialist time
    
    laborBreakdown.push({
      category: 'Specialist Services',
      description: 'Complex site conditions requiring specialist expertise',
      hours: specialistHours,
      hourlyRate: PRICING_CONSTANTS.LABOR_RATES.specialist,
      totalCost: specialistHours * PRICING_CONSTANTS.LABOR_RATES.specialist,
      complexity: 'specialist',
      crewSize: 1 // Specialists typically work alone or with small teams
    });
  }
  
  // Tree care specialist labor
  if (assessment.crane_access_needed || (assessment.tree_count > 10)) {
    const treeSpecialistHours = assessment.tree_count * 0.75;
    
    laborBreakdown.push({
      category: 'Tree Care Specialist',
      description: 'Professional tree care requiring specialized skills',
      hours: treeSpecialistHours,
      hourlyRate: PRICING_CONSTANTS.LABOR_RATES.specialist,
      totalCost: treeSpecialistHours * PRICING_CONSTANTS.LABOR_RATES.specialist,
      complexity: 'specialist',
      crewSize: 2 // Tree work typically requires 2-person team for safety
    });
  }
  
  return laborBreakdown;
}

/**
 * Generate line item suggestions based on assessment conditions
 */
export function generateAssessmentLineItems(
  assessment: PropertyAssessment,
  availableItems: LineItem[]
): Array<{
  item: LineItem;
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  assessmentBased: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
}> {
  const suggestions: Array<{
    item: LineItem;
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    assessmentBased: boolean;
    confidenceLevel: 'high' | 'medium' | 'low';
  }> = [];

  const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
  const areaInThousands = Math.ceil(lawnArea / 1000);

  // Lawn renovation items
  if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
    const sodItem = availableItems.find(item => 
      item.name.toLowerCase().includes('sod') || 
      item.name.toLowerCase().includes('turf')
    );
    if (sodItem) {
      suggestions.push({
        item: sodItem,
        quantity: areaInThousands,
        reason: `Lawn condition is ${assessment.lawn_condition} - complete renovation needed`,
        priority: 'high',
        assessmentBased: true,
        confidenceLevel: assessment.lawn_area_measured ? 'high' : 'medium'
      });
    }

    const soilPrepItem = availableItems.find(item => 
      item.name.toLowerCase().includes('soil prep') || 
      item.name.toLowerCase().includes('tilling')
    );
    if (soilPrepItem) {
      suggestions.push({
        item: soilPrepItem,
        quantity: areaInThousands,
        reason: 'Soil preparation required for new lawn installation',
        priority: 'high',
        assessmentBased: true,
        confidenceLevel: 'high'
      });
    }
  }

  // Overseeding for patchy lawns
  if (assessment.lawn_condition === 'patchy') {
    const overseedItem = availableItems.find(item => 
      item.name.toLowerCase().includes('overseed') || 
      item.name.toLowerCase().includes('seed')
    );
    if (overseedItem) {
      suggestions.push({
        item: overseedItem,
        quantity: areaInThousands,
        reason: 'Patchy lawn requires overseeding treatment',
        priority: 'medium',
        assessmentBased: true,
        confidenceLevel: 'high'
      });
    }
  }

  // Aeration for compacted soil
  if (assessment.soil_condition === 'compacted') {
    const aerationItem = availableItems.find(item => 
      item.name.toLowerCase().includes('aerat')
    );
    if (aerationItem) {
      suggestions.push({
        item: aerationItem,
        quantity: areaInThousands,
        reason: 'Compacted soil requires core aeration',
        priority: 'high',
        assessmentBased: true,
        confidenceLevel: 'high'
      });
    }
  }

  // Weed control
  if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 25) {
    const weedControlItem = availableItems.find(item => 
      item.name.toLowerCase().includes('weed') || 
      item.name.toLowerCase().includes('herbicide')
    );
    if (weedControlItem) {
      suggestions.push({
        item: weedControlItem,
        quantity: areaInThousands,
        reason: `${assessment.weed_coverage_percent}% weed coverage requires treatment`,
        priority: assessment.weed_coverage_percent > 50 ? 'high' : 'medium',
        assessmentBased: true,
        confidenceLevel: 'high'
      });
    }
  }

  // Fertilization based on soil condition
  if (assessment.soil_condition === 'sandy' || assessment.soil_condition === 'clay') {
    const fertilizerItem = availableItems.find(item => 
      item.name.toLowerCase().includes('fertiliz') || 
      item.name.toLowerCase().includes('nutrient')
    );
    if (fertilizerItem) {
      suggestions.push({
        item: fertilizerItem,
        quantity: areaInThousands,
        reason: `${assessment.soil_condition} soil condition requires nutrient supplementation`,
        priority: 'medium',
        assessmentBased: true,
        confidenceLevel: 'medium'
      });
    }
  }

  // pH adjustment
  if (assessment.soil_ph) {
    if (assessment.soil_ph < 6.0) {
      const limeItem = availableItems.find(item => 
        item.name.toLowerCase().includes('lime')
      );
      if (limeItem) {
        suggestions.push({
          item: limeItem,
          quantity: areaInThousands,
          reason: `Soil pH of ${assessment.soil_ph} requires lime application`,
          priority: 'medium',
          assessmentBased: true,
          confidenceLevel: 'high'
        });
      }
    } else if (assessment.soil_ph > 7.5) {
      const sulfurItem = availableItems.find(item => 
        item.name.toLowerCase().includes('sulfur')
      );
      if (sulfurItem) {
        suggestions.push({
          item: sulfurItem,
          quantity: areaInThousands,
          reason: `Soil pH of ${assessment.soil_ph} requires sulfur application`,
          priority: 'medium',
          assessmentBased: true,
          confidenceLevel: 'high'
        });
      }
    }
  }

  // Drainage improvements
  if (assessment.drainage_quality && assessment.drainage_quality < 5) {
    const drainageItem = availableItems.find(item => 
      item.name.toLowerCase().includes('drain') || 
      item.name.toLowerCase().includes('french drain')
    );
    if (drainageItem) {
      suggestions.push({
        item: drainageItem,
        quantity: 1,
        reason: `Poor drainage quality (${assessment.drainage_quality}/10) needs improvement`,
        priority: 'medium',
        assessmentBased: true,
        confidenceLevel: 'medium'
      });
    }
  }

  return suggestions;
}

/**
 * Calculate labor hours based on assessment complexity
 */
export function calculateLaborHours(
  assessment: PropertyAssessment,
  baseHours: number = 0
): number {
  let totalHours = baseHours;

  // Use assessment's estimated hours if available
  if (assessment.total_estimated_hours) {
    totalHours = assessment.total_estimated_hours;
  } else {
    // Calculate based on area and complexity
    const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
    const baseHoursPerThousandSqFt = 4; // Base assumption
    
    totalHours = (lawnArea / 1000) * baseHoursPerThousandSqFt;

    // Adjust for complexity
    if (assessment.complexity_score) {
      const complexityMultiplier = 1 + (assessment.complexity_score - 5) * 0.1;
      totalHours *= complexityMultiplier;
    }

    // Adjust for conditions
    if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
      totalHours *= 1.5;
    } else if (assessment.lawn_condition === 'patchy') {
      totalHours *= 1.2;
    }

    if (assessment.soil_condition === 'compacted') {
      totalHours *= 1.3;
    }

    // Access adjustments
    if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
      totalHours *= 1.2;
    }

    if (!assessment.dump_truck_access) {
      totalHours *= 1.15;
    }
  }

  return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate assessment-based quote summary
 */
export function generateAssessmentQuoteSummary(
  assessment: PropertyAssessment,
  pricingResult: AssessmentPricingResult
): string {
  const sections = [];

  // Property overview
  sections.push('PROPERTY ASSESSMENT SUMMARY');
  sections.push('=' .repeat(30));
  sections.push(`Property: ${(assessment as any).properties?.service_address || 'Address not available'}`);
  sections.push(`Assessment Date: ${assessment.scheduled_date ? new Date(assessment.scheduled_date).toLocaleDateString() : 'Not scheduled'}`);
  sections.push(`Overall Condition: ${assessment.overall_condition || 'Not assessed'}`);
  sections.push(`Lawn Area: ${assessment.lawn_area_measured || assessment.lawn_area_estimated || 'Not measured'} sq ft`);
  sections.push('');

  // Condition details
  if (assessment.lawn_condition || assessment.soil_condition) {
    sections.push('CONDITION ANALYSIS');
    sections.push('-'.repeat(20));
    if (assessment.lawn_condition) {
      sections.push(`Lawn Condition: ${assessment.lawn_condition}`);
    }
    if (assessment.soil_condition) {
      sections.push(`Soil Condition: ${assessment.soil_condition}`);
    }
    if (assessment.weed_coverage_percent) {
      sections.push(`Weed Coverage: ${assessment.weed_coverage_percent}%`);
    }
    if (assessment.complexity_score) {
      sections.push(`Complexity Score: ${assessment.complexity_score}/10`);
    }
    sections.push('');
  }

  // Pricing adjustments
  if (pricingResult.adjustments.length > 0) {
    sections.push('PRICING ADJUSTMENTS');
    sections.push('-'.repeat(20));
    pricingResult.adjustments.forEach(adj => {
      const percentage = ((adj.multiplier - 1) * 100).toFixed(0);
      sections.push(`${adj.factor}: +${percentage}% - ${adj.reason}`);
    });
    sections.push('');
    sections.push(`Total Adjustment Factor: ${pricingResult.totalMultiplier.toFixed(2)}x`);
    sections.push('');
  }

  // Recommendations
  if (pricingResult.suggestedItems.length > 0) {
    sections.push('RECOMMENDED SERVICES');
    sections.push('-'.repeat(20));
    pricingResult.suggestedItems.forEach(suggestion => {
      sections.push(`• ${suggestion.item.name} (${suggestion.quantity} ${suggestion.item.unit}) - ${suggestion.reason}`);
    });
  }

  return sections.join('\n');
}

/**
 * Performance-optimized pricing calculation with caching and minimal database calls
 */
export function calculateOptimizedAssessmentPricing(
  assessment: PropertyAssessment,
  baseItems: LineItem[],
  basePrice: number = 0,
  options: {
    useCache?: boolean;
    skipEquipmentCalculation?: boolean;
    skipMaterialCalculation?: boolean;
    skipLaborBreakdown?: boolean;
  } = {}
): AssessmentPricingResult {
  const startTime = performance.now();
  
  // Use cached calculations if available and requested
  const cacheKey = `pricing_${assessment.id}_${basePrice}_${baseItems.length}`;
  
  if (options.useCache && typeof window !== 'undefined' && window.sessionStorage) {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedResult = JSON.parse(cached);
        // Validate cache is less than 15 minutes old
        if (cachedResult.timestamp && (Date.now() - cachedResult.timestamp) < 900000) {
          return cachedResult.data;
        }
      } catch (e) {
        // Invalid cache, continue with calculation
      }
    }
  }
  
  // Perform optimized calculation with selective components
  const adjustments: PricingAdjustment[] = [];
  const equipmentCosts: EquipmentCost[] = options.skipEquipmentCalculation ? [] : calculateEquipmentCosts(assessment);
  const materialAdjustments: MaterialAdjustment[] = options.skipMaterialCalculation ? [] : calculateMaterialAdjustments(assessment, (assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000) / 1000);
  const laborBreakdown: LaborBreakdown[] = options.skipLaborBreakdown ? [] : calculateLaborBreakdown(assessment, (assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000) / 1000, assessment.complexity_score || 5);
  
  // Fast condition-based adjustments (core logic only)
  const lawnConditionMultiplier = getLawnConditionMultiplier(assessment.lawn_condition);
  const soilConditionMultiplier = getSoilConditionMultiplier(assessment.soil_condition);
  const complexityMultiplier = getComplexityMultiplier(assessment.complexity_score);
  const accessMultiplier = getAccessMultiplier(assessment);
  
  // Build adjustments array efficiently
  if (lawnConditionMultiplier > 1) {
    adjustments.push({
      factor: 'Lawn Condition',
      multiplier: lawnConditionMultiplier,
      reason: `${assessment.lawn_condition} lawn requires additional work`,
      category: 'condition',
      impact: lawnConditionMultiplier > 1.3 ? 'high' : lawnConditionMultiplier > 1.1 ? 'medium' : 'low',
      costBasis: basePrice
    });
  }
  
  if (soilConditionMultiplier > 1) {
    adjustments.push({
      factor: 'Soil Condition',
      multiplier: soilConditionMultiplier,
      reason: `${assessment.soil_condition} soil requires specialized treatment`,
      category: 'condition',
      impact: soilConditionMultiplier > 1.4 ? 'high' : soilConditionMultiplier > 1.2 ? 'medium' : 'low',
      costBasis: basePrice
    });
  }
  
  if (complexityMultiplier > 1) {
    adjustments.push({
      factor: 'Site Complexity',
      multiplier: complexityMultiplier,
      reason: `Complexity score ${assessment.complexity_score}/10 increases labor requirements`,
      category: 'complexity',
      impact: complexityMultiplier > 1.25 ? 'high' : complexityMultiplier > 1.1 ? 'medium' : 'low',
      costBasis: basePrice
    });
  }
  
  if (accessMultiplier > 1) {
    adjustments.push({
      factor: 'Access Limitations',
      multiplier: accessMultiplier,
      reason: 'Limited access increases labor and equipment costs',
      category: 'access',
      impact: accessMultiplier > 1.2 ? 'high' : 'medium',
      costBasis: basePrice
    });
  }
  
  // Quick calculation of totals
  const totalMultiplier = adjustments.reduce((total, adj) => total * adj.multiplier, 1);
  const equipmentTotal = equipmentCosts.reduce((sum, eq) => sum + eq.totalCost, 0);
  const materialTotal = materialAdjustments.reduce((sum, mat) => sum + mat.totalCost, 0);
  const laborTotal = laborBreakdown.reduce((sum, labor) => sum + labor.totalCost, 0);
  const totalLaborHours = laborBreakdown.reduce((sum, labor) => sum + labor.hours, 0);
  
  const finalPrice = (basePrice * totalMultiplier) + equipmentTotal + materialTotal + laborTotal;
  
  // Calculate confidence score based on data quality
  let confidenceScore = 85;
  if (!assessment.lawn_area_measured) confidenceScore -= 10;
  if (!assessment.complexity_score) confidenceScore -= 8;
  if (!assessment.soil_condition) confidenceScore -= 5;
  if (!assessment.total_estimated_hours) confidenceScore -= 7;
  
  const result: AssessmentPricingResult = {
    basePrice,
    adjustments,
    equipmentCosts,
    materialAdjustments,
    laborBreakdown,
    overrides: [],
    finalPrice,
    totalMultiplier,
    totalLaborHours,
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    pricingTransparency: generatePricingTransparency(basePrice, adjustments, equipmentTotal, materialTotal, laborTotal, finalPrice),
    suggestedItems: [] // Skip for performance if not needed
  };
  
  // Cache result if requested
  if (options.useCache && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Storage full or unavailable, continue without caching
    }
  }
  
  const endTime = performance.now();
  console.log(`Pricing calculation completed in ${(endTime - startTime).toFixed(2)}ms`);
  
  return result;
}

/**
 * Apply custom pricing overrides while maintaining assessment-based suggestions
 */
export function applyPricingOverrides(
  pricingResult: AssessmentPricingResult,
  overrides: PricingOverride[]
): AssessmentPricingResult {
  if (!overrides || overrides.length === 0) {
    return pricingResult;
  }
  
  // Create a copy of the result to avoid mutation
  const updatedResult = { ...pricingResult };
  updatedResult.overrides = [...overrides];
  
  // Calculate the impact of overrides on final price
  let overrideAdjustment = 0;
  overrides.forEach(override => {
    const difference = override.overridePrice - override.originalPrice;
    overrideAdjustment += difference;
  });
  
  updatedResult.finalPrice = pricingResult.finalPrice + overrideAdjustment;
  
  // Update transparency breakdown to show overrides
  updatedResult.pricingTransparency = {
    ...pricingResult.pricingTransparency,
    finalBreakdown: {
      ...pricingResult.pricingTransparency.finalBreakdown,
      'Override Adjustments': overrideAdjustment,
      'Final Total': updatedResult.finalPrice
    }
  };
  
  // Reduce confidence score if there are many overrides
  const overrideImpact = Math.min(20, overrides.length * 5);
  updatedResult.confidenceScore = Math.max(0, pricingResult.confidenceScore - overrideImpact);
  
  return updatedResult;
}

/**
 * Generate detailed pricing transparency breakdown
 */
export function generatePricingTransparency(
  basePrice: number,
  adjustments: PricingAdjustment[],
  equipmentTotal: number,
  materialTotal: number,
  laborTotal: number,
  finalPrice: number
): {
  baseCostBreakdown: Record<string, number>;
  adjustmentBreakdown: Record<string, number>;
  finalBreakdown: Record<string, number>;
} {
  const baseCostBreakdown: Record<string, number> = {
    'Base Service Cost': basePrice,
    'Equipment Costs': equipmentTotal,
    'Material Costs': materialTotal,
    'Labor Costs': laborTotal
  };
  
  const adjustmentBreakdown: Record<string, number> = {};
  adjustments.forEach(adj => {
    const adjustmentCost = (adj.costBasis || basePrice) * (adj.multiplier - 1);
    adjustmentBreakdown[adj.factor] = adjustmentCost;
  });
  
  const finalBreakdown: Record<string, number> = {
    'Subtotal Before Adjustments': basePrice + equipmentTotal + materialTotal + laborTotal,
    ...adjustmentBreakdown,
    'Final Total': finalPrice
  };
  
  return {
    baseCostBreakdown,
    adjustmentBreakdown,
    finalBreakdown
  };
}

/**
 * Performance helper functions for quick multiplier calculations
 */
function getLawnConditionMultiplier(lawnCondition?: string): number {
  switch (lawnCondition) {
    case 'dead':
    case 'poor': return 1.4;
    case 'patchy': return 1.2;
    case 'healthy':
    case 'pristine': return 1.0;
    default: return 1.0;
  }
}

function getSoilConditionMultiplier(soilCondition?: string): number {
  switch (soilCondition) {
    case 'contaminated': return 1.6;
    case 'compacted': return 1.25;
    case 'clay': return 1.2;
    case 'sandy': return 1.15;
    case 'excellent':
    case 'good': return 1.0;
    default: return 1.0;
  }
}

function getComplexityMultiplier(complexityScore?: number): number {
  if (!complexityScore) return 1.0;
  if (complexityScore >= 8) return 1.25;
  if (complexityScore >= 6) return 1.1;
  return 1.0;
}

function getAccessMultiplier(assessment: PropertyAssessment): number {
  let multiplier = 1.0;
  
  if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
    multiplier *= 1.2;
  }
  
  if (!assessment.dump_truck_access) {
    multiplier *= 1.15;
  }
  
  if (assessment.crane_access_needed) {
    multiplier *= 1.3;
  }
  
  return multiplier;
}

/**
 * Validate pricing calculation results for accuracy and reasonableness
 */
export function validatePricingResult(result: AssessmentPricingResult): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check for unreasonable final prices
  if (result.finalPrice < 50) {
    warnings.push('Final price seems unusually low - verify calculations');
  }
  
  if (result.finalPrice > 50000) {
    warnings.push('Final price is very high - consider reviewing adjustments');
  }
  
  // Check for excessive multipliers
  if (result.totalMultiplier > 2.5) {
    warnings.push(`Total multiplier of ${result.totalMultiplier.toFixed(2)} is very high`);
  }
  
  // Validate confidence score
  if (result.confidenceScore < 50) {
    warnings.push('Low confidence score - missing critical assessment data');
  }
  
  // Check for missing labor hours on complex jobs
  if (result.totalLaborHours === 0 && result.finalPrice > 1000) {
    errors.push('No labor hours calculated for significant project');
  }
  
  // Validate equipment costs are reasonable
  const equipmentPercentage = (result.equipmentCosts.reduce((sum, eq) => sum + eq.totalCost, 0) / result.finalPrice) * 100;
  if (equipmentPercentage > 50) {
    warnings.push(`Equipment costs are ${equipmentPercentage.toFixed(0)}% of total price`);
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}
