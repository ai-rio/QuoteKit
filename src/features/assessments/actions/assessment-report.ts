'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

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

interface GenerateAssessmentReportData {
  assessmentId: string;
  reportData: AssessmentReportData;
  includePhotos?: boolean;
}

interface AssessmentReportResult {
  pdfUrl: string;
  reportId: string;
}

/**
 * Generate a comprehensive PDF assessment report
 */
export async function generateAssessmentReport(
  data: GenerateAssessmentReportData
): Promise<ActionResponse<AssessmentReportResult>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Get assessment with property and client details
    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner (
          *,
          clients!inner (*)
        )
      `)
      .eq('id', data.assessmentId)
      .eq('user_id', user.id)
      .single();

    if (assessmentError || !assessment) {
      return { 
        data: null, 
        error: { message: 'Assessment not found or access denied' } 
      };
    }

    // Get company information for branding
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Generate HTML content for the report
    const htmlContent = generateReportHTML(assessment, data.reportData, company);

    // For now, we'll return a mock PDF URL since we don't have PDF generation set up
    // In a real implementation, you would use a service like Puppeteer, jsPDF, or a PDF API
    const reportId = `report_${data.assessmentId}_${Date.now()}`;
    const mockPdfUrl = `/api/reports/${reportId}.pdf`;

    // Store report metadata in database
    const { error: reportError } = await supabase
      .from('assessment_reports')
      .insert({
        id: reportId,
        assessment_id: data.assessmentId,
        user_id: user.id,
        report_data: data.reportData,
        html_content: htmlContent,
        created_at: new Date().toISOString()
      });

    if (reportError) {
      console.warn('Failed to store report metadata:', reportError);
      // Don't fail the entire operation for this
    }

    return {
      data: {
        pdfUrl: mockPdfUrl,
        reportId
      },
      error: null
    };

  } catch (error) {
    console.error('Error generating assessment report:', error);
    return { 
      data: null, 
      error: { message: 'Failed to generate assessment report' } 
    };
  }
}

/**
 * Generate HTML content for the assessment report
 */
function generateReportHTML(
  assessment: any, 
  reportData: AssessmentReportData, 
  company: any
): string {
  const currentDate = new Date().toLocaleDateString();
  const assessmentDate = assessment.scheduled_date 
    ? new Date(assessment.scheduled_date).toLocaleDateString() 
    : 'Not scheduled';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Property Assessment Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #27ae60;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-logo {
          max-height: 80px;
          margin-bottom: 10px;
        }
        .report-title {
          color: #27ae60;
          font-size: 28px;
          font-weight: bold;
          margin: 10px 0;
        }
        .property-address {
          font-size: 18px;
          color: #7f8c8d;
          margin-bottom: 10px;
        }
        .report-date {
          color: #95a5a6;
          font-size: 14px;
        }
        .section {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
        }
        .section-title {
          color: #27ae60;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 2px solid #27ae60;
          padding-bottom: 5px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .summary-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #27ae60;
        }
        .summary-label {
          font-size: 14px;
          color: #7f8c8d;
          margin-top: 5px;
        }
        .condition-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .condition-card {
          padding: 15px;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          background: #fdfdfd;
        }
        .condition-title {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .condition-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .status-excellent { background: #d4edda; color: #155724; }
        .status-good { background: #cce5ff; color: #004085; }
        .status-fair { background: #fff3cd; color: #856404; }
        .status-poor { background: #f8d7da; color: #721c24; }
        .status-critical { background: #f5c6cb; color: #721c24; }
        .recommendations {
          margin-top: 15px;
        }
        .recommendations ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .recommendations li {
          margin: 5px 0;
          color: #495057;
        }
        .cost-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .cost-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .cost-value {
          font-size: 20px;
          font-weight: bold;
          color: #27ae60;
        }
        .cost-label {
          font-size: 14px;
          color: #7f8c8d;
          margin-top: 5px;
        }
        .total-cost {
          background: #27ae60;
          color: white;
        }
        .key-recommendations {
          background: #e8f5e8;
          border-left: 4px solid #27ae60;
          padding: 20px;
          margin: 20px 0;
        }
        .key-recommendations ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .key-recommendations li {
          margin: 8px 0;
          font-weight: 500;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ecf0f1;
          text-align: center;
          color: #7f8c8d;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        ${company?.logo_url ? `<img src="${company.logo_url}" alt="Company Logo" class="company-logo">` : ''}
        <h1 class="report-title">Property Assessment Report</h1>
        <div class="property-address">${assessment.properties.service_address}</div>
        <div class="report-date">Generated on ${currentDate} | Assessment Date: ${assessmentDate}</div>
      </div>

      <!-- Executive Summary -->
      <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${reportData.summary.overallScore}/10</div>
            <div class="summary-label">Overall Score</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${reportData.summary.priorityLevel}</div>
            <div class="summary-label">Priority Level</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${reportData.summary.estimatedHours}h</div>
            <div class="summary-label">Estimated Hours</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${reportData.measurements.lawnArea.toLocaleString()}</div>
            <div class="summary-label">Lawn Area (sq ft)</div>
          </div>
        </div>
      </div>

      <!-- Property Information -->
      <div class="section">
        <h2 class="section-title">Property Information</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${assessment.assessor_name || 'Not specified'}</div>
            <div class="summary-label">Assessor</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${assessment.weather_conditions || 'Not recorded'}</div>
            <div class="summary-label">Weather</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${assessment.temperature_f ? assessment.temperature_f + '°F' : 'Not recorded'}</div>
            <div class="summary-label">Temperature</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${reportData.measurements.totalArea.toLocaleString()}</div>
            <div class="summary-label">Total Area (sq ft)</div>
          </div>
        </div>
      </div>

      <!-- Condition Analysis -->
      <div class="section">
        <h2 class="section-title">Condition Analysis</h2>
        <div class="condition-grid">
          <!-- Lawn Condition -->
          <div class="condition-card">
            <div class="condition-title">Lawn Condition</div>
            <span class="condition-status status-${reportData.conditions.lawn.condition.toLowerCase()}">${reportData.conditions.lawn.condition}</span>
            ${reportData.conditions.lawn.issues.length > 0 ? `
              <div class="recommendations">
                <strong>Issues Identified:</strong>
                <ul>
                  ${reportData.conditions.lawn.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${reportData.conditions.lawn.recommendations.length > 0 ? `
              <div class="recommendations">
                <strong>Recommendations:</strong>
                <ul>
                  ${reportData.conditions.lawn.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- Soil Condition -->
          <div class="condition-card">
            <div class="condition-title">Soil Condition</div>
            <span class="condition-status status-${reportData.conditions.soil.condition.toLowerCase()}">${reportData.conditions.soil.condition}</span>
            <div style="margin: 10px 0;">
              <strong>pH Level:</strong> ${reportData.conditions.soil.ph || 'Not tested'}<br>
              <strong>Drainage:</strong> ${reportData.conditions.soil.drainage}/10
            </div>
            ${reportData.conditions.soil.issues.length > 0 ? `
              <div class="recommendations">
                <strong>Issues:</strong>
                <ul>
                  ${reportData.conditions.soil.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${reportData.conditions.soil.recommendations.length > 0 ? `
              <div class="recommendations">
                <strong>Recommendations:</strong>
                <ul>
                  ${reportData.conditions.soil.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- Infrastructure -->
          <div class="condition-card">
            <div class="condition-title">Infrastructure</div>
            <div style="margin: 10px 0;">
              <strong>Irrigation:</strong> ${reportData.conditions.infrastructure.irrigation}<br>
              <strong>Access:</strong> ${reportData.conditions.infrastructure.access}<br>
              <strong>Obstacles:</strong> ${reportData.conditions.infrastructure.obstacles} total
            </div>
            ${reportData.conditions.infrastructure.recommendations.length > 0 ? `
              <div class="recommendations">
                <strong>Recommendations:</strong>
                <ul>
                  ${reportData.conditions.infrastructure.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Cost Estimates -->
      <div class="section">
        <h2 class="section-title">Cost Estimates</h2>
        <div class="cost-breakdown">
          <div class="cost-item">
            <div class="cost-value">$${reportData.costEstimates.materials.toLocaleString()}</div>
            <div class="cost-label">Materials</div>
          </div>
          <div class="cost-item">
            <div class="cost-value">$${reportData.costEstimates.labor.toLocaleString()}</div>
            <div class="cost-label">Labor</div>
          </div>
          <div class="cost-item">
            <div class="cost-value">$${reportData.costEstimates.equipment.toLocaleString()}</div>
            <div class="cost-label">Equipment</div>
          </div>
          <div class="cost-item total-cost">
            <div class="cost-value">$${reportData.costEstimates.total.toLocaleString()}</div>
            <div class="cost-label">Total Estimate</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
          <strong>Profit Margin: ${reportData.costEstimates.profitMargin}%</strong>
        </div>
      </div>

      <!-- Key Recommendations -->
      ${reportData.summary.recommendedActions.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Key Recommendations</h2>
          <div class="key-recommendations">
            <ul>
              ${reportData.summary.recommendedActions.map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <p>This assessment report was generated by ${company?.name || 'QuoteKit'} on ${currentDate}</p>
        <p>For questions about this assessment, please contact ${assessment.assessor_contact || company?.email || 'your service provider'}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get all assessment reports for a user
 */
export async function getAssessmentReports(): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data: reports, error: reportsError } = await supabase
      .from('assessment_reports')
      .select(`
        *,
        property_assessments!inner (
          *,
          properties!inner (
            service_address,
            clients!inner (name)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (reportsError) {
      return { 
        data: null, 
        error: { message: 'Failed to fetch assessment reports' } 
      };
    }

    return { data: reports || [], error: null };

  } catch (error) {
    console.error('Error getting assessment reports:', error);
    return { 
      data: null, 
      error: { message: 'Failed to get assessment reports' } 
    };
  }
}
