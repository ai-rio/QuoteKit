'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

interface BulkDeleteResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

/**
 * Deletes assessment media and associated files
 */
export async function deleteAssessmentMedia(mediaId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get media record first to get storage path and assessment ID
    const { data: media, error: fetchError } = await supabase
      .from('assessment_media')
      .select('storage_path, assessment_id')
      .eq('id', mediaId)
      .single();

    if (fetchError) {
      console.error('Fetch media error:', fetchError);
      return { 
        data: null,
        error: { 
          message: 'Failed to fetch media record',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('assessment-media')
      .remove([media.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('assessment_media')
      .delete()
      .eq('id', mediaId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return { 
        data: null,
        error: { 
          message: 'Failed to delete media record',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    revalidatePath(`/assessments/${media.assessment_id}`);
    return { data: undefined, error: null };
  } catch (error) {
    console.error('Delete media unexpected error:', error);
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
 * Bulk deletes multiple media items
 */
export async function bulkDeleteMedia(mediaIds: string[]): Promise<ActionResponse<BulkDeleteResult>> {
  try {
    if (!mediaIds.length) {
      return { 
        data: null,
        error: { 
          message: 'No media IDs provided',
          code: 'VALIDATION_ERROR' 
        } 
      };
    }

    const supabase = await createSupabaseServerClient();
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];
    const assessmentIds = new Set<string>();

    for (const mediaId of mediaIds) {
      try {
        // Get media record
        const { data: media, error: fetchError } = await supabase
          .from('assessment_media')
          .select('storage_path, assessment_id')
          .eq('id', mediaId)
          .single();

        if (fetchError) {
          failureCount++;
          errors.push(`Failed to fetch media ${mediaId}: ${fetchError.message}`);
          continue;
        }

        assessmentIds.add(media.assessment_id);

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('assessment-media')
          .remove([media.storage_path]);

        if (storageError) {
          console.error(`Storage deletion error for ${mediaId}:`, storageError);
          // Continue with database deletion
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('assessment_media')
          .delete()
          .eq('id', mediaId);

        if (dbError) {
          failureCount++;
          errors.push(`Failed to delete media record ${mediaId}: ${dbError.message}`);
        } else {
          successCount++;
        }
      } catch (error) {
        failureCount++;
        errors.push(`Unexpected error deleting media ${mediaId}: ${error}`);
      }
    }

    // Revalidate paths for affected assessments
    assessmentIds.forEach(assessmentId => {
      revalidatePath(`/assessments/${assessmentId}`);
    });

    return { 
      data: {
        successCount,
        failureCount,
        errors
      },
      error: null
    };
  } catch (error) {
    console.error('Bulk delete media unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred during bulk deletion',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}

/**
 * Approves media (placeholder for approval workflow)
 */
export async function approveMedia(mediaId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: media, error } = await supabase
      .from('assessment_media')
      .update({
        // Add approval fields when the schema supports it
        updated_at: new Date().toISOString()
      })
      .eq('id', mediaId)
      .select('assessment_id')
      .single();

    if (error) {
      console.error('Approve media error:', error);
      return { 
        data: null,
        error: { 
          message: 'Failed to approve media',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    revalidatePath(`/assessments/${media.assessment_id}`);
    return { data: undefined, error: null };
  } catch (error) {
    console.error('Approve media unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}