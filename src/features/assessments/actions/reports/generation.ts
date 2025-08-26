'use server';

import { v4 as uuidv4 } from 'uuid';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { generateReportHTML } from './templates';
import { AssessmentReportResult,GenerateAssessmentReportData } from './types';

/**
 * Generates an assessment report in the specified format
 */
export async function generateAssessmentReport(
  data: GenerateAssessmentReportData
): Promise<ActionResponse<AssessmentReportResult>> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get assessment with all related data
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select(`
        *,
        property:properties (*),
        media:assessment_media (*)
      `)
      .eq('id', data.assessmentId)
      .single();

    if (error) {
      console.error('Get assessment error:', error);
      return { 
        data: null,
        error: { 
          message: 'Failed to fetch assessment data',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    const reportId = uuidv4();
    const generatedAt = new Date();

    const reportData = {
      assessment,
      reportId: reportId.slice(0, 8).toUpperCase(),
      format: data.format,
      generatedAt,
      templateUsed: data.template || 'standard'
    };

    let result: AssessmentReportResult = { reportData };

    switch (data.format) {
      case 'html':
        const htmlContent = generateReportHTML(reportData, {
          includeMedia: data.includeMedia,
          includePricing: data.includePricing
        });
        result.content = htmlContent;
        break;

      case 'pdf':
        // PDF generation would be implemented here
        // This is a placeholder for PDF generation logic
        result.buffer = Buffer.from('PDF generation not implemented yet');
        break;

      case 'json':
        result.content = JSON.stringify(reportData, null, 2);
        break;

      default:
        return { 
          data: null,
          error: { 
            message: 'Unsupported report format',
            code: 'VALIDATION_ERROR' 
          } 
        };
    }

    return { 
      data: result,
      error: null 
    };
  } catch (error) {
    console.error('Generate assessment report unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred during report generation',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}

/**
 * Gets list of generated assessment reports
 */
export async function getAssessmentReports(
  assessmentId?: string
): Promise<ActionResponse<AssessmentReportResult[]>> {
  try {
    // This would typically query a reports table
    // For now, return an empty array as reports are generated on-demand
    return { 
      data: [],
      error: null 
    };
  } catch (error) {
    console.error('Get assessment reports unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}