'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { AssessmentMedia } from '../../types';

/**
 * Gets all media for an assessment
 */
export async function getAssessmentMedia(assessmentId: string): Promise<ActionResponse<AssessmentMedia[]>> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: media, error } = await supabase
      .from('assessment_media')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get assessment media error:', error);
      return { 
        data: null,
        error: { 
          message: 'Failed to fetch media',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    return { data: media || [], error: null };
  } catch (error) {
    console.error('Get assessment media unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}

/**
 * Gets a single media item by ID
 */
export async function getMediaById(mediaId: string): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: media, error } = await supabase
      .from('assessment_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (error) {
      console.error('Get media by ID error:', error);
      return { 
        data: null,
        error: { 
          message: 'Failed to fetch media',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    return { data: media, error: null };
  } catch (error) {
    console.error('Get media by ID unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}

/**
 * Updates media metadata
 */
export async function updateAssessmentMedia(
  mediaId: string,
  updates: {
    description?: string;
    tags?: string[];
    isFeatured?: boolean;
  }
): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: media, error } = await supabase
      .from('assessment_media')
      .update({
        description: updates.description,
        tags: updates.tags,
        is_featured: updates.isFeatured,
        updated_at: new Date().toISOString()
      })
      .eq('id', mediaId)
      .select('*')
      .single();

    if (error) {
      console.error('Update media error:', error);
      return { 
        data: null,
        error: { 
          message: 'Failed to update media',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    revalidatePath(`/assessments/${media.assessment_id}`);
    return { data: media, error: null };
  } catch (error) {
    console.error('Update media unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}

/**
 * Toggles featured status of media
 */
export async function toggleMediaFeatured(mediaId: string): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();

    // First get current status
    const { data: currentMedia, error: fetchError } = await supabase
      .from('assessment_media')
      .select('is_featured, assessment_id')
      .eq('id', mediaId)
      .single();

    if (fetchError) {
      console.error('Fetch media error:', fetchError);
      return { 
        data: null,
        error: { 
          message: 'Failed to fetch media',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    // Toggle featured status
    const { data: media, error } = await supabase
      .from('assessment_media')
      .update({
        is_featured: !currentMedia.is_featured,
        updated_at: new Date().toISOString()
      })
      .eq('id', mediaId)
      .select('*')
      .single();

    if (error) {
      console.error('Toggle media featured error:', error);
      return { 
        data: null,
        error: { 
          message: 'Failed to update media featured status',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    revalidatePath(`/assessments/${currentMedia.assessment_id}`);
    return { data: media, error: null };
  } catch (error) {
    console.error('Toggle media featured unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}

/**
 * Reorders media items for an assessment
 */
export async function reorderMedia(
  assessmentId: string,
  mediaIds: string[]
): Promise<ActionResponse<AssessmentMedia[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const results: AssessmentMedia[] = [];

    // Update order for each media item
    for (let i = 0; i < mediaIds.length; i++) {
      const { data: media, error } = await supabase
        .from('assessment_media')
        .update({
          sort_order: i + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaIds[i])
        .eq('assessment_id', assessmentId) // Extra security check
        .select('*')
        .single();

      if (error) {
        console.error(`Reorder media error for ${mediaIds[i]}:`, error);
        return { 
          data: null,
          error: { 
            message: `Failed to reorder media item ${i + 1}`,
            code: 'DATABASE_ERROR' 
          } 
        };
      }

      results.push(media);
    }

    revalidatePath(`/assessments/${assessmentId}`);
    return { data: results, error: null };
  } catch (error) {
    console.error('Reorder media unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}