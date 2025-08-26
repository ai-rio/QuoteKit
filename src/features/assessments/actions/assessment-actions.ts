'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import {
  AssessmentDashboardData,
  AssessmentFilters,
  BulkAssessmentOperation,
  CreateAssessmentData,
  PropertyAssessment,
  PropertyAssessmentWithDetails,
  UpdateAssessmentData} from '../types';

/**
 * Create a new property assessment
 */
export async function createAssessment(
  data: CreateAssessmentData
): Promise<ActionResponse<PropertyAssessment>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    // Generate assessment number (ASS-YYYY-DDD-XXXXXXXX format)
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const assessmentNumber = `ASS-${year}-${dayOfYear.toString().padStart(3, '0')}-${randomSuffix}`;

    const assessmentData = {
      user_id: user.id,
      assessment_number: assessmentNumber,
      assessment_date: new Date().toISOString(),
      assessment_status: 'scheduled' as const,
      priority_level: data.priority_level || 5,
      bare_spots_count: 0,
      tree_count: 0,
      shrub_count: 0,
      irrigation_status: 'none' as const,
      irrigation_zones_count: 0,
      electrical_outlets_available: 0,
      water_source_access: false,
      utility_lines_marked: false,
      parking_available: false,
      obstacles: [],
      special_considerations: {},
      equipment_needed: [],
      material_requirements: {},
      dump_truck_access: false,
      crane_access_needed: false,
      safety_hazards: [],
      permit_required: false,
      profit_margin_percent: 20,
      follow_up_needed: false,
      photos_taken_count: 0,
      measurements_verified: false,
      client_walkthrough_completed: false,
      erosion_issues: false,
      ...data
    };

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      return {
        data: null,
        error: error.message
      };
    }

    revalidatePath('/assessments');
    revalidatePath(`/properties/${data.property_id}`);

    return {
      data: assessment,
      error: null
    };
  } catch (error) {
    console.error('Error in createAssessment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update an existing assessment
 */
export async function updateAssessment(
  id: string,
  data: UpdateAssessmentData
): Promise<ActionResponse<PropertyAssessment>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assessment:', error);
      return {
        data: null,
        error: error.message
      };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${id}`);

    return {
      data: assessment,
      error: null
    };
  } catch (error) {
    console.error('Error in updateAssessment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get assessment by ID with details
 */
export async function getAssessmentById(
  id: string
): Promise<ActionResponse<PropertyAssessmentWithDetails>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const { data: assessment, error } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties (
          id,
          service_address,
          property_name,
          property_type,
          clients (
            id,
            name,
            email,
            phone
          )
        ),
        quotes (
          id,
          quote_number,
          status,
          total,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching assessment:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: assessment,
      error: null
    };
  } catch (error) {
    console.error('Error in getAssessmentById:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get assessments with filtering and pagination
 */
export async function getAssessments(
  filters?: AssessmentFilters,
  page = 1,
  limit = 20
): Promise<ActionResponse<PropertyAssessmentWithDetails[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    let query = supabase
      .from('property_assessments')
      .select(`
        *,
        properties (
          id,
          service_address,
          property_name,
          property_type,
          clients (
            id,
            name,
            email,
            phone
          )
        ),
        quotes (
          id,
          quote_number,
          status,
          total,
          created_at
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
      if (filters.search) {
        query = query.or(`assessment_notes.ilike.%${filters.search}%,recommendations.ilike.%${filters.search}%,internal_notes.ilike.%${filters.search}%`);
      }
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by most recent first
    query = query.order('created_at', { ascending: false });

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Error fetching assessments:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: assessments || [],
      error: null
    };
  } catch (error) {
    console.error('Error in getAssessments:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const { error } = await supabase
      .from('property_assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting assessment:', error);
      return {
        data: null,
        error: error.message
      };
    }

    revalidatePath('/assessments');

    return {
      data: true,
      error: null
    };
  } catch (error) {
    console.error('Error in deleteAssessment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Bulk operations on assessments
 */
export async function bulkAssessmentOperation(
  operation: BulkAssessmentOperation
): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (operation.type) {
      case 'update_status':
        if (operation.data?.status) {
          updateData.assessment_status = operation.data.status;
        }
        break;
      case 'update_priority':
        if (operation.data?.priority_level !== undefined) {
          updateData.priority_level = operation.data.priority_level;
        }
        break;
      case 'assign_assessor':
        if (operation.data?.assessor_name) {
          updateData.assessor_name = operation.data.assessor_name;
        }
        break;
      case 'delete':
        const { error: deleteError } = await supabase
          .from('property_assessments')
          .delete()
          .in('id', operation.assessment_ids)
          .eq('user_id', user.id);

        if (deleteError) {
          return {
            data: null,
            error: deleteError.message
          };
        }

        revalidatePath('/assessments');
        return {
          data: true,
          error: null
        };
    }

    const { error } = await supabase
      .from('property_assessments')
      .update(updateData)
      .in('id', operation.assessment_ids)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error in bulk operation:', error);
      return {
        data: null,
        error: error.message
      };
    }

    revalidatePath('/assessments');

    return {
      data: true,
      error: null
    };
  } catch (error) {
    console.error('Error in bulkAssessmentOperation:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get assessments for a specific property
 */
export async function getAssessmentsForProperty(
  propertyId: string
): Promise<ActionResponse<PropertyAssessmentWithDetails[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        data: null,
        error: 'Authentication required'
      };
    }

    const { data: assessments, error } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties (
          id,
          service_address,
          property_name,
          property_type,
          clients (
            id,
            name,
            email,
            phone
          )
        ),
        quotes (
          id,
          quote_number,
          status,
          total,
          created_at
        )
      `)
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments for property:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: assessments || [],
      error: null
    };
  } catch (error) {
    console.error('Error in getAssessmentsForProperty:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
