'use client';

import { Calendar, FileText, MapPin, Ruler, TrendingUp, User } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Property } from '@/features/clients/types';

import { generateAssessmentReport } from '../actions/assessment-report';
import { PropertyAssessment } from '../types';

interface AssessmentReportProps {
  assessment: PropertyAssessment;
  property?: Property;
  showActions?: boolean;
}

interface AssessmentReportData {
  summary: {
    overallScore: number;
    priorityLevel: string;
    estimatedHours: number;
    recommendedActions: string[];
  };
  conditions: {
    lawn: {
      condition: string;
      area: number;
      issues: string[];
      recommendations: string[];
    };
    soil: {
      condition: string;
      ph: number | null;
      drainage: number;
      issues: string[];
      recommendations: string[];
    };
    infrastructure: {
      irrigation: string;
      access: string;
      obstacles: number;
      recommendations: string[];
    };
  };
  measurements: {
    totalArea: number;
    lawnArea: number;
    hardscapeArea: number;
    obstacles: {
      trees: number;
      shrubs: number;
      other: number;
    };
  };
  costEstimates: {
    materials: number;
    labor: number;
    equipment: number;
    total: number;
    profitMargin: number;
  };
}

export function AssessmentReport({ assessment, property, showActions = true }: AssessmentReportProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportData, setReportData] = useState<AssessmentReportData | null>(null);

  // Generate report data from assessment
  const generateReportData = (): AssessmentReportData => {
    const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 0;
    const totalArea = (assessment as any).total_property_area || lawnArea;
    const hardscapeArea = Math.max(0, totalArea - lawnArea);

    // Calculate overall score based on conditions
    let overallScore = 5; // Start with neutral
    if (assessment.overall_condition === 'excellent') overallScore = 9;
    else if (assessment.overall_condition === 'good') overallScore = 7;
    else if (assessment.overall_condition === 'fair') overallScore = 5;
    else if (assessment.overall_condition === 'poor') overallScore = 3;
    else if (assessment.overall_condition === 'critical') overallScore = 1;

    // Generate recommendations based on conditions
    const lawnRecommendations: string[] = [];
    const soilRecommendations: string[] = [];
    const infrastructureRecommendations: string[] = [];
    const lawnIssues: string[] = [];
    const soilIssues: string[] = [];

    // Lawn condition analysis
    if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
      lawnIssues.push('Lawn requires complete renovation');
      lawnRecommendations.push('Full lawn renovation with new sod or seeding');
      lawnRecommendations.push('Soil preparation and amendment');
    } else if (assessment.lawn_condition === 'patchy') {
      lawnIssues.push('Patchy grass coverage');
      lawnRecommendations.push('Overseeding and fertilization program');
    }

    if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 30) {
      lawnIssues.push(`High weed coverage (${assessment.weed_coverage_percent}%)`);
      lawnRecommendations.push('Pre-emergent and post-emergent weed control');
    }

    if (assessment.bare_spots_count && assessment.bare_spots_count > 5) {
      lawnIssues.push(`Multiple bare spots (${assessment.bare_spots_count})`);
      lawnRecommendations.push('Spot seeding and soil amendment');
    }

    // Soil condition analysis
    if (assessment.soil_condition === 'compacted') {
      soilIssues.push('Soil compaction detected');
      soilRecommendations.push('Core aeration treatment');
      soilRecommendations.push('Organic matter incorporation');
    }

    if (assessment.soil_ph && (assessment.soil_ph < 6.0 || assessment.soil_ph > 7.5)) {
      soilIssues.push(`pH imbalance (${assessment.soil_ph})`);
      if (assessment.soil_ph < 6.0) {
        soilRecommendations.push('Lime application to raise pH');
      } else {
        soilRecommendations.push('Sulfur application to lower pH');
      }
    }

    if (assessment.drainage_quality && assessment.drainage_quality < 5) {
      soilIssues.push('Poor drainage quality');
      soilRecommendations.push('Drainage improvement system');
      soilRecommendations.push('French drain installation consideration');
    }

    // Infrastructure recommendations
    if (assessment.irrigation_status === 'none') {
      infrastructureRecommendations.push('Consider irrigation system installation');
    } else if (assessment.irrigation_status === 'needs_repair') {
      infrastructureRecommendations.push('Irrigation system repair and maintenance');
    }

    if (!assessment.dump_truck_access) {
      infrastructureRecommendations.push('Plan for manual material transport');
    }

    // Priority level determination
    let priorityLevel = 'Medium';
    if (overallScore <= 3) priorityLevel = 'High';
    else if (overallScore >= 7) priorityLevel = 'Low';

    return {
      summary: {
        overallScore,
        priorityLevel,
        estimatedHours: assessment.total_estimated_hours || 0,
        recommendedActions: [
          ...lawnRecommendations.slice(0, 2),
          ...soilRecommendations.slice(0, 1),
          ...infrastructureRecommendations.slice(0, 1)
        ].filter(Boolean)
      },
      conditions: {
        lawn: {
          condition: assessment.lawn_condition || 'Not assessed',
          area: lawnArea,
          issues: lawnIssues,
          recommendations: lawnRecommendations
        },
        soil: {
          condition: assessment.soil_condition || 'Not assessed',
          ph: assessment.soil_ph || null,
          drainage: assessment.drainage_quality || 0,
          issues: soilIssues,
          recommendations: soilRecommendations
        },
        infrastructure: {
          irrigation: assessment.irrigation_status || 'none',
          access: assessment.dump_truck_access ? 'Good' : 'Limited',
          obstacles: (assessment.tree_count || 0) + (assessment.shrub_count || 0) + ((assessment as any).obstacle_count || 0),
          recommendations: infrastructureRecommendations
        }
      },
      measurements: {
        totalArea,
        lawnArea,
        hardscapeArea,
        obstacles: {
          trees: assessment.tree_count || 0,
          shrubs: assessment.shrub_count || 0,
          other: (assessment as any).obstacle_count || 0
        }
      },
      costEstimates: {
        materials: assessment.estimated_material_cost || 0,
        labor: assessment.estimated_labor_cost || 0,
        equipment: assessment.estimated_equipment_cost || 0,
        total: (assessment.estimated_material_cost || 0) + 
               (assessment.estimated_labor_cost || 0) + 
               (assessment.estimated_equipment_cost || 0),
        profitMargin: assessment.profit_margin_percent || 20
      }
    };
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const data = generateReportData();
      setReportData(data);

      const result = await generateAssessmentReport({
        assessmentId: assessment.id,
        reportData: data,
        includePhotos: true
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message || 'Failed to generate assessment report',
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        // Download the PDF
        const link = document.createElement('a');
        link.href = result.data.pdfUrl;
        link.download = `Assessment-Report-${assessment.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Success',
          description: 'Assessment report generated successfully',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': case 'dead': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Generate report data for display
  const displayData = reportData || generateReportData();

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <FileText className="h-5 w-5" />
            Property Assessment Report
          </CardTitle>
          {showActions && (
            <Button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="ml-auto bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal"
            >
              {isGeneratingPDF ? 'Generating...' : 'Generate PDF Report'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-forest-green">
                {displayData.summary.overallScore}/10
              </div>
              <div className="text-sm text-charcoal-600">Overall Score</div>
            </div>
            <div className="text-center">
              <Badge className={getPriorityColor(displayData.summary.priorityLevel)}>
                {displayData.summary.priorityLevel} Priority
              </Badge>
              <div className="text-sm text-charcoal-600 mt-1">Priority Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                {displayData.summary.estimatedHours}h
              </div>
              <div className="text-sm text-charcoal-600">Estimated Hours</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <MapPin className="h-5 w-5" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-charcoal-600">Assessment Date</div>
              <div className="font-medium">
                {assessment.scheduled_date ? new Date(assessment.scheduled_date).toLocaleDateString() : 'Not scheduled'}
              </div>
            </div>
            <div>
              <div className="text-sm text-charcoal-600">Assessor</div>
              <div className="font-medium">{assessment.assessor_name || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-sm text-charcoal-600">Weather Conditions</div>
              <div className="font-medium">{assessment.weather_conditions || 'Not recorded'}</div>
            </div>
            <div>
              <div className="text-sm text-charcoal-600">Temperature</div>
              <div className="font-medium">
                {assessment.temperature_f ? `${assessment.temperature_f}°F` : 'Not recorded'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Measurements Summary */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <Ruler className="h-5 w-5" />
            Property Measurements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                {displayData.measurements.totalArea.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Total Area (sq ft)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                {displayData.measurements.lawnArea.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Lawn Area (sq ft)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                {displayData.measurements.hardscapeArea.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Hardscape (sq ft)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                {displayData.measurements.obstacles.trees + displayData.measurements.obstacles.shrubs + displayData.measurements.obstacles.other}
              </div>
              <div className="text-sm text-charcoal-600">Total Obstacles</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condition Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lawn Condition */}
        <Card className="bg-paper-white">
          <CardHeader>
            <CardTitle className="text-forest-green">Lawn Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge className={getConditionColor(displayData.conditions.lawn.condition)}>
                {displayData.conditions.lawn.condition}
              </Badge>
            </div>
            
            {displayData.conditions.lawn.issues.length > 0 && (
              <div>
                <div className="text-sm font-medium text-charcoal mb-2">Issues Identified:</div>
                <ul className="text-sm text-charcoal-600 space-y-1">
                  {displayData.conditions.lawn.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {displayData.conditions.lawn.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium text-charcoal mb-2">Recommendations:</div>
                <ul className="text-sm text-charcoal-600 space-y-1">
                  {displayData.conditions.lawn.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soil Condition */}
        <Card className="bg-paper-white">
          <CardHeader>
            <CardTitle className="text-forest-green">Soil Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge className={getConditionColor(displayData.conditions.soil.condition)}>
                {displayData.conditions.soil.condition}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-charcoal-600">pH Level:</span>
                <div className="font-medium">{displayData.conditions.soil.ph || 'Not tested'}</div>
              </div>
              <div>
                <span className="text-charcoal-600">Drainage:</span>
                <div className="font-medium">{displayData.conditions.soil.drainage}/10</div>
              </div>
            </div>

            {displayData.conditions.soil.issues.length > 0 && (
              <div>
                <div className="text-sm font-medium text-charcoal mb-2">Issues:</div>
                <ul className="text-sm text-charcoal-600 space-y-1">
                  {displayData.conditions.soil.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {displayData.conditions.soil.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium text-charcoal mb-2">Recommendations:</div>
                <ul className="text-sm text-charcoal-600 space-y-1">
                  {displayData.conditions.soil.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Infrastructure */}
        <Card className="bg-paper-white">
          <CardHeader>
            <CardTitle className="text-forest-green">Infrastructure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-charcoal-600">Irrigation:</span>
                <div className="font-medium capitalize">{displayData.conditions.infrastructure.irrigation}</div>
              </div>
              <div>
                <span className="text-charcoal-600">Access:</span>
                <div className="font-medium">{displayData.conditions.infrastructure.access}</div>
              </div>
              <div>
                <span className="text-charcoal-600">Obstacles:</span>
                <div className="font-medium">{displayData.conditions.infrastructure.obstacles} total</div>
              </div>
            </div>

            {displayData.conditions.infrastructure.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium text-charcoal mb-2">Recommendations:</div>
                <ul className="text-sm text-charcoal-600 space-y-1">
                  {displayData.conditions.infrastructure.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Estimates */}
      <Card className="bg-paper-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <TrendingUp className="h-5 w-5" />
            Cost Estimates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-forest-green">
                ${displayData.costEstimates.materials.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Materials</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-forest-green">
                ${displayData.costEstimates.labor.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Labor</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-forest-green">
                ${displayData.costEstimates.equipment.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Equipment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                ${displayData.costEstimates.total.toLocaleString()}
              </div>
              <div className="text-sm text-charcoal-600">Total Estimate</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center">
            <div className="text-sm text-charcoal-600 mb-1">Profit Margin</div>
            <Badge variant="outline">{displayData.costEstimates.profitMargin}%</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Recommendations */}
      {displayData.summary.recommendedActions.length > 0 && (
        <Card className="bg-forest-green/5 border-forest-green/20">
          <CardHeader>
            <CardTitle className="text-forest-green">Key Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {displayData.summary.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-forest-green rounded-full mt-2 flex-shrink-0" />
                  <span className="text-charcoal">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
