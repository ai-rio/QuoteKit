import { AssessmentReportData } from './types';

interface TemplateOptions {
  includeMedia?: boolean;
  includePricing?: boolean;
}

/**
 * Generates HTML content for assessment report
 */
export function generateReportHTML(
  reportData: AssessmentReportData,
  options: TemplateOptions = {}
): string {
  const { assessment, reportId, generatedAt } = reportData;
  const { includeMedia = true, includePricing = true } = options;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assessment Report - ${reportId}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 2px solid #2d5a3d; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #2d5a3d; font-size: 28px; font-weight: bold; margin: 0; }
        .subtitle { color: #666; font-size: 14px; margin: 5px 0 0 0; }
        .section { margin: 30px 0; }
        .section-title { color: #2d5a3d; font-size: 20px; font-weight: bold; margin: 0 0 15px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .info-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #2d5a3d; }
        .info-label { font-weight: bold; color: #555; margin-bottom: 5px; }
        .info-value { color: #333; }
        .condition-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .condition-excellent { background: #d4edda; color: #155724; }
        .condition-good { background: #cce7ff; color: #004085; }
        .condition-fair { background: #fff3cd; color: #856404; }
        .condition-poor { background: #f8d7da; color: #721c24; }
        .measurements { background: #f0f7f0; padding: 20px; border-radius: 8px; margin: 15px 0; }
        .notes { background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; white-space: pre-wrap; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .media-item { text-align: center; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .media-item img { max-width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Property Assessment Report</h1>
        <p class="subtitle">Report ID: ${reportId} | Generated: ${generatedAt.toLocaleString()}</p>
      </div>

      <div class="section">
        <h2 class="section-title">Property Information</h2>
        <div class="grid">
          <div class="info-card">
            <div class="info-label">Property Address</div>
            <div class="info-value">
              ${assessment.properties?.service_address || assessment.service_address || 'N/A'}
            </div>
          </div>
          <div class="info-card">
            <div class="info-label">Property Type</div>
            <div class="info-value">${assessment.properties?.property_type || assessment.property_type || 'N/A'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Assessor</div>
            <div class="info-value">${assessment.assessor_name}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Assessment Date</div>
            <div class="info-value">${new Date(assessment.created_at).toLocaleDateString()}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Status</div>
            <div class="info-value">${assessment.assessment_status?.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Condition Assessment</h2>
        <div class="grid">
          <div class="info-card">
            <div class="info-label">Overall Condition</div>
            <div class="info-value">
              ${assessment.overall_condition ? `<span class="condition-badge condition-${assessment.overall_condition}">${assessment.overall_condition}</span>` : 'Not assessed'}
            </div>
          </div>
          <div class="info-card">
            <div class="info-label">Lawn Condition</div>
            <div class="info-value">
              ${assessment.lawn_condition ? `<span class="condition-badge condition-${assessment.lawn_condition}">${assessment.lawn_condition}</span>` : 'Not assessed'}
            </div>
          </div>
          <div class="info-card">
            <div class="info-label">Soil Condition</div>
            <div class="info-value">
              ${assessment.soil_condition ? `<span class="condition-badge condition-${assessment.soil_condition}">${assessment.soil_condition}</span>` : 'Not assessed'}
            </div>
          </div>
          <div class="info-card">
            <div class="info-label">Complexity Score</div>
            <div class="info-value">${assessment.complexity_score || 'N/A'}/10</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Measurements & Details</h2>
        <div class="measurements">
          <div class="grid">
            ${assessment.lawn_area_measured ? `
              <div>
                <div class="info-label">Measured Area</div>
                <div class="info-value">${assessment.lawn_area_measured.toLocaleString()} sq ft</div>
              </div>
            ` : ''}
            ${assessment.lawn_area_estimated ? `
              <div>
                <div class="info-label">Estimated Area</div>
                <div class="info-value">${assessment.lawn_area_estimated.toLocaleString()} sq ft</div>
              </div>
            ` : ''}
            ${assessment.weed_coverage_percent !== null ? `
              <div>
                <div class="info-label">Weed Coverage</div>
                <div class="info-value">${assessment.weed_coverage_percent}%</div>
              </div>
            ` : ''}
            ${assessment.soil_ph ? `
              <div>
                <div class="info-label">Soil pH</div>
                <div class="info-value">${assessment.soil_ph}</div>
              </div>
            ` : ''}
            ${assessment.drainage_quality ? `
              <div>
                <div class="info-label">Drainage Quality</div>
                <div class="info-value">${assessment.drainage_quality}/5</div>
              </div>
            ` : ''}
            ${assessment.slope_grade_percent !== null ? `
              <div>
                <div class="info-label">Slope Grade</div>
                <div class="info-value">${assessment.slope_grade_percent}%</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      ${includePricing && (assessment.total_estimated_hours || assessment.estimated_total_cost) ? `
        <div class="section">
          <h2 class="section-title">Time & Cost Estimates</h2>
          <div class="grid">
            ${assessment.total_estimated_hours ? `
              <div class="info-card">
                <div class="info-label">Estimated Hours</div>
                <div class="info-value">${assessment.total_estimated_hours} hours</div>
              </div>
            ` : ''}
            ${assessment.estimated_total_cost ? `
              <div class="info-card">
                <div class="info-label">Estimated Cost</div>
                <div class="info-value">$${assessment.estimated_total_cost.toLocaleString()}</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${assessment.assessment_notes ? `
        <div class="section">
          <h2 class="section-title">Assessment Notes</h2>
          <div class="notes">${assessment.assessment_notes}</div>
        </div>
      ` : ''}

      ${includeMedia && (assessment as any).media && (assessment as any).media.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Assessment Media (${(assessment as any).media.length} files)</h2>
          <div class="media-grid">
            ${(assessment as any).media.map((media: any) => `
              <div class="media-item">
                ${media.type === 'photo' ? `
                  <img src="${media.url}" alt="${media.description || 'Assessment photo'}" />
                ` : `
                  <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                    <div>${media.type.toUpperCase()}</div>
                  </div>
                `}
                <div style="margin-top: 8px; font-size: 12px;">
                  <strong>${media.file_name}</strong>
                  ${media.description ? `<br><span style="color: #666;">${media.description}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>This report was automatically generated by QuoteKit Assessment System.</p>
        <p>Report ID: ${reportId} | Generated: ${generatedAt.toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}