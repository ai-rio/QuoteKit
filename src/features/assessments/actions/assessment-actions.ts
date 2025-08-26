'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import {
  AssessmentAnalytics,
  AssessmentFilters,
  AssessmentMedia,
  AssessmentMediaType,
  AssessmentOverallCondition,
  AssessmentStatus,
  BulkAssessmentOperation,
  CreateAssessmentData,
  IrrigationStatus,
  LawnCondition,
  PropertyAssessment,
  PropertyAssessmentWithDetails,
  SoilCondition,
  UpdateAssessmentData,
  UploadAssessmentMediaData} from '../types';

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

function validateAssessmentData(data: Partial<PropertyAssessment>): string | null {
  if (!data.assessor_name?.trim()) {
    return 'Assessor name is required';
  }

  if (data.complexity_score !== undefined && (data.complexity_score < 1 || data.complexity_score > 10)) {
    return 'Complexity score must be between 1 and 10';
  }

  if (data.priority_level !== undefined && (data.priority_level < 1 || data.priority_level > 10)) {
    return 'Priority level must be between 1 and 10';
  }

  if (data.weed_coverage_percent !== undefined && (data.weed_coverage_percent < 0 || data.weed_coverage_percent > 100)) {
    return 'Weed coverage percent must be between 0 and 100';
  }

  if (data.soil_ph !== undefined && (data.soil_ph < 0 || data.soil_ph > 14)) {
    return 'Soil pH must be between 0 and 14';
  }

  if (data.drainage_quality !== undefined && (data.drainage_quality < 1 || data.drainage_quality > 5)) {
    return 'Drainage quality must be between 1 and 5';
  }

  if (data.compaction_level !== undefined && (data.compaction_level < 1 || data.compaction_level > 5)) {
    return 'Compaction level must be between 1 and 5';
  }

  return null;
}

function validateMediaFile(file: File): string | null {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf', 'text/plain',
    'audio/mpeg', 'audio/wav', 'audio/webm'
  ];

  if (file.size > maxSize) {
    return 'File size must be less than 50MB';
  }

  if (!allowedTypes.includes(file.type)) {
    return 'File type not supported. Please use images, videos, documents, or audio files.';
  }

  return null;
}

// =====================================================
// CRUD OPERATIONS FOR PROPERTY ASSESSMENTS
// =====================================================

export async function createAssessment(data: CreateAssessmentData): Promise<ActionResponse<PropertyAssessment>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Validate required fields
    if (!data.property_id?.trim()) {
      return { data: null, error: { message: 'Property is required' } };
    }

    if (!data.assessor_name?.trim()) {
      return { data: null, error: { message: 'Assessor name is required' } };
    }

    // Verify property belongs to user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', data.property_id)
      .eq('user_id', user.id)
      .single();

    if (propertyError || !property) {
      return { data: null, error: { message: 'Property not found or access denied' } };
    }

    // Build assessment data
    const assessmentData = {
      user_id: user.id,
      property_id: data.property_id,
      assessor_name: data.assessor_name.trim(),
      assessor_contact: data.assessor_contact?.trim() || null,
      scheduled_date: data.scheduled_date || null,
      assessment_notes: data.assessment_notes?.trim() || null,
      priority_level: data.priority_level || 5,
      assessment_status: 'scheduled' as AssessmentStatus,
      bare_spots_count: 0,
      tree_count: 0,
      shrub_count: 0,
      irrigation_zones_count: 0,
      electrical_outlets_available: 0,
      erosion_issues: false,
      water_source_access: true,
      utility_lines_marked: false,
      parking_available: true,
      equipment_needed: [],
      material_requirements: {},
      dump_truck_access: true,
      crane_access_needed: false,
      safety_hazards: [],
      permit_required: false,
      profit_margin_percent: 20.00,
      follow_up_needed: false,
      photos_taken_count: 0,
      measurements_verified: false,
      client_walkthrough_completed: false,
      obstacles: [],
      special_considerations: {}
    };

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating assessment:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    return { data: assessment, error: null };
  } catch (error) {
    console.error('Unexpected error creating assessment:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while creating the assessment' } 
    };
  }
}

export async function getAssessments(filters?: AssessmentFilters): Promise<ActionResponse<PropertyAssessmentWithDetails[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Build query with joins for property and client details
    let query = supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner(
          id,
          property_name,
          service_address,
          property_type,
          clients!inner(
            id,
            name,
            company_name,
            client_type
          )
        )
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('assessment_status', filters.status);
      }
      
      if (filters.condition && filters.condition.length > 0) {
        query = query.in('overall_condition', filters.condition);
      }
      
      if (filters.complexity_min !== undefined) {
        query = query.gte('complexity_score', filters.complexity_min);
      }
      
      if (filters.complexity_max !== undefined) {
        query = query.lte('complexity_score', filters.complexity_max);
      }
      
      if (filters.date_from) {
        query = query.gte('assessment_date', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('assessment_date', filters.date_to);
      }
      
      if (filters.property_id) {
        query = query.eq('property_id', filters.property_id);
      }
      
      if (filters.assessor_name) {
        query = query.ilike('assessor_name', `%${filters.assessor_name}%`);
      }
      
      if (filters.has_quote !== undefined) {
        if (filters.has_quote) {
          query = query.not('quote_id', 'is', null);
        } else {
          query = query.is('quote_id', null);
        }
      }
      
      if (filters.follow_up_needed !== undefined) {
        query = query.eq('follow_up_needed', filters.follow_up_needed);
      }
      
      // Full-text search
      if (filters.search?.trim()) {
        query = query.textSearch('assessment_notes', filters.search.trim());
      }
    }

    // Order by priority and date
    query = query.order('priority_level', { ascending: false })
                 .order('assessment_date', { ascending: false });

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Database error fetching assessments:', error);
      return { data: null, error };
    }

    // Transform the data to include property and client details
    const transformedAssessments: PropertyAssessmentWithDetails[] = assessments.map((assessment: any) => ({
      ...assessment,
      property_name: assessment.properties?.property_name,
      service_address: assessment.properties?.service_address,
      property_type: assessment.properties?.property_type,
      client_id: assessment.properties?.clients?.id,
      client_name: assessment.properties?.clients?.name,
      company_name: assessment.properties?.clients?.company_name,
      client_type: assessment.properties?.clients?.client_type,
    }));

    return { data: transformedAssessments, error: null };
  } catch (error) {
    console.error('Unexpected error fetching assessments:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while fetching assessments' } 
    };
  }
}

export async function getAssessmentById(assessmentId: string): Promise<ActionResponse<PropertyAssessmentWithDetails>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner(
          id,
          property_name,
          service_address,
          property_type,
          clients!inner(
            id,
            name,
            company_name,
            client_type
          )
        )
      `)
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: { message: 'Assessment not found' } };
      }
      console.error('Database error fetching assessment:', error);
      return { data: null, error };
    }

    // Transform the data
    const transformedAssessment: PropertyAssessmentWithDetails = {
      ...assessment,
      property_name: assessment.properties?.property_name,
      service_address: assessment.properties?.service_address,
      property_type: assessment.properties?.property_type,
      client_id: assessment.properties?.clients?.id,
      client_name: assessment.properties?.clients?.name,
      company_name: assessment.properties?.clients?.company_name,
      client_type: assessment.properties?.clients?.client_type,
    };

    return { data: transformedAssessment, error: null };
  } catch (error) {
    console.error('Unexpected error fetching assessment:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while fetching the assessment' } 
    };
  }
}

export async function updateAssessment(assessmentId: string, data: UpdateAssessmentData): Promise<ActionResponse<PropertyAssessment>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    // Validate the data
    const validationError = validateAssessmentData(data);
    if (validationError) {
      return { data: null, error: { message: validationError } };
    }

    // Verify assessment belongs to user
    const { data: existingAssessment, error: checkError } = await supabase
      .from('property_assessments')
      .select('id, user_id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingAssessment) {
      return { data: null, error: { message: 'Assessment not found or access denied' } };
    }

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .update(data)
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating assessment:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${assessmentId}`);
    return { data: assessment, error: null };
  } catch (error) {
    console.error('Unexpected error updating assessment:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while updating the assessment' } 
    };
  }
}

export async function deleteAssessment(assessmentId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    // Get assessment media files to delete from storage
    const { data: mediaFiles } = await supabase
      .from('assessment_media')
      .select('storage_bucket, storage_path')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id);

    // Delete assessment (cascade will handle media table records)
    const { error } = await supabase
      .from('property_assessments')
      .delete()
      .eq('id', assessmentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error deleting assessment:', error);
      return { data: null, error };
    }

    // Delete media files from storage
    if (mediaFiles && mediaFiles.length > 0) {
      const filePaths = mediaFiles.map(file => file.storage_path);
      const { error: storageError } = await supabase.storage
        .from('assessment-media')
        .remove(filePaths);

      if (storageError) {
        console.error('Storage error deleting media files:', storageError);
        // Don't fail the entire operation for storage errors
      }
    }

    revalidatePath('/assessments');
    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error deleting assessment:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while deleting the assessment' } 
    };
  }
}

// =====================================================
// ASSESSMENT STATUS MANAGEMENT
// =====================================================

export async function updateAssessmentStatus(
  assessmentId: string, 
  status: AssessmentStatus
): Promise<ActionResponse<PropertyAssessment>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    // Prepare update data with automatic date setting
    const updateData: any = { assessment_status: status };
    
    if (status === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .update(updateData)
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating assessment status:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${assessmentId}`);
    return { data: assessment, error: null };
  } catch (error) {
    console.error('Unexpected error updating assessment status:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while updating the assessment status' } 
    };
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export async function bulkAssessmentOperation(operation: BulkAssessmentOperation): Promise<ActionResponse<{ affected: number }>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!operation.assessment_ids || operation.assessment_ids.length === 0) {
      return { data: null, error: { message: 'No assessments selected' } };
    }

    let query = supabase
      .from('property_assessments')
      .update(operation.data || {})
      .in('id', operation.assessment_ids)
      .eq('user_id', user.id);

    // Handle different operation types
    switch (operation.type) {
      case 'delete':
        // Get media files first
        const { data: mediaFiles } = await supabase
          .from('assessment_media')
          .select('storage_bucket, storage_path')
          .in('assessment_id', operation.assessment_ids)
          .eq('user_id', user.id);

        // Delete assessments
        const { data: deletedAssessments, error: deleteError } = await supabase
          .from('property_assessments')
          .delete()
          .in('id', operation.assessment_ids)
          .eq('user_id', user.id)
          .select('id');

        if (deleteError) {
          return { data: null, error: deleteError };
        }

        // Delete media files from storage
        if (mediaFiles && mediaFiles.length > 0) {
          const filePaths = mediaFiles.map(file => file.storage_path);
          await supabase.storage
            .from('assessment-media')
            .remove(filePaths);
        }

        revalidatePath('/assessments');
        return { data: { affected: deletedAssessments?.length || 0 }, error: null };

      case 'update_status':
        if (!operation.data?.status) {
          return { data: null, error: { message: 'Status is required for status update operation' } };
        }
        break;

      case 'update_priority':
        if (operation.data?.priority_level === undefined) {
          return { data: null, error: { message: 'Priority level is required for priority update operation' } };
        }
        break;

      case 'assign_assessor':
        if (!operation.data?.assessor_name?.trim()) {
          return { data: null, error: { message: 'Assessor name is required for assessor assignment operation' } };
        }
        break;
    }

    const { data: updatedAssessments, error } = await query.select('id');

    if (error) {
      console.error('Database error in bulk operation:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    return { data: { affected: updatedAssessments?.length || 0 }, error: null };
  } catch (error) {
    console.error('Unexpected error in bulk operation:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during bulk operation' } 
    };
  }
}

// =====================================================
// ASSESSMENT ANALYTICS
// =====================================================

export async function getAssessmentAnalytics(): Promise<ActionResponse<AssessmentAnalytics>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data: summary, error } = await supabase
      .from('assessment_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No assessments yet, return empty analytics
        const emptyAnalytics: AssessmentAnalytics = {
          user_id: user.id,
          total_assessments: 0,
          scheduled_count: 0,
          in_progress_count: 0,
          completed_count: 0,
          reviewed_count: 0,
          followup_required_count: 0,
          excellent_condition_count: 0,
          good_condition_count: 0,
          fair_condition_count: 0,
          poor_condition_count: 0,
          critical_condition_count: 0,
          average_complexity: 0,
          max_complexity: 0,
          high_complexity_count: 0,
          total_estimated_value: 0,
          average_assessment_value: 0,
          quoted_value: 0,
          average_labor_hours: 0,
          total_estimated_hours: 0,
          assessments_with_quotes: 0,
          quote_conversion_rate_percent: 0,
          assessments_this_week: 0,
          assessments_this_month: 0,
          total_media_files: 0
        };
        return { data: emptyAnalytics, error: null };
      }
      console.error('Database error fetching assessment analytics:', error);
      return { data: null, error };
    }

    return { data: summary, error: null };
  } catch (error) {
    console.error('Unexpected error fetching assessment analytics:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while fetching assessment analytics' } 
    };
  }
}

// =====================================================
// ASSESSMENT DASHBOARD DATA
// =====================================================

export async function getAssessmentDashboard(): Promise<ActionResponse<any>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Use the optimized dashboard function from the database
    const { data: dashboardData, error } = await supabase
      .rpc('get_assessment_dashboard', { p_user_id: user.id });

    if (error) {
      console.error('Database error fetching assessment dashboard:', error);
      return { data: null, error };
    }

    return { data: dashboardData || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching assessment dashboard:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while fetching dashboard data' } 
    };
  }
}