'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import {
  AssessmentMedia,
  AssessmentMediaType,
  UploadAssessmentMediaData} from '../types';

// =====================================================
// MEDIA VALIDATION AND UTILITIES
// =====================================================

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

function generateStoragePath(userId: string, assessmentId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${assessmentId}/${timestamp}_${sanitizedFilename}`;
}

function inferMediaTypeFromFile(file: File): AssessmentMediaType {
  if (file.type.startsWith('image/')) {
    return 'photo';
  } else if (file.type.startsWith('video/')) {
    return 'video';
  } else if (file.type.startsWith('audio/')) {
    return 'audio_note';
  } else {
    return 'document';
  }
}

// =====================================================
// MEDIA UPLOAD OPERATIONS
// =====================================================

export async function uploadAssessmentMedia(
  formData: FormData
): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Extract form data
    const assessmentId = formData.get('assessment_id') as string;
    const file = formData.get('file') as File;
    const mediaType = formData.get('media_type') as AssessmentMediaType;
    const caption = formData.get('caption') as string || '';
    const description = formData.get('description') as string || '';
    const locationDescription = formData.get('location_description') as string || '';
    const category = formData.get('category') as string || '';
    const tags = formData.get('tags') as string || '';
    const visibleToClient = formData.get('visible_to_client') === 'true';

    // Validation
    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    if (!file) {
      return { data: null, error: { message: 'File is required' } };
    }

    const fileValidationError = validateMediaFile(file);
    if (fileValidationError) {
      return { data: null, error: { message: fileValidationError } };
    }

    // Verify assessment belongs to user
    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select('id, user_id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (assessmentError || !assessment) {
      return { data: null, error: { message: 'Assessment not found or access denied' } };
    }

    // Generate storage path
    const storagePath = generateStoragePath(user.id, assessmentId, file.name);
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assessment-media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { data: null, error: { message: 'Failed to upload file' } };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assessment-media')
      .getPublicUrl(storagePath);

    // Parse tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Infer media type if not provided
    const finalMediaType = mediaType || inferMediaTypeFromFile(file);

    // Create media record
    const mediaData = {
      user_id: user.id,
      assessment_id: assessmentId,
      media_type: finalMediaType,
      filename: file.name,
      original_filename: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      storage_bucket: 'assessment-media',
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      caption: caption || null,
      description: description || null,
      location_description: locationDescription || null,
      category: category || null,
      tags: tagsArray,
      visible_to_client: visibleToClient,
      sort_order: 0,
      is_featured: false,
      requires_approval: false,
      processing_status: 'uploaded',
      thumbnail_generated: false,
      compressed_generated: false,
      metadata: {}
    };

    const { data: media, error: mediaError } = await supabase
      .from('assessment_media')
      .insert(mediaData)
      .select()
      .single();

    if (mediaError) {
      console.error('Database error creating media record:', mediaError);
      
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('assessment-media')
        .remove([storagePath]);
      
      return { data: null, error: mediaError };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${assessmentId}`);
    return { data: media, error: null };
  } catch (error) {
    console.error('Unexpected error uploading media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while uploading the file' } 
    };
  }
}

// =====================================================
// MEDIA RETRIEVAL OPERATIONS
// =====================================================

export async function getAssessmentMedia(
  assessmentId: string,
  filters?: {
    media_type?: AssessmentMediaType;
    visible_to_client?: boolean;
    is_featured?: boolean;
    category?: string;
  }
): Promise<ActionResponse<AssessmentMedia[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    // Verify assessment belongs to user
    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select('id, user_id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (assessmentError || !assessment) {
      return { data: null, error: { message: 'Assessment not found or access denied' } };
    }

    // Build query with filters
    let query = supabase
      .from('assessment_media')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id);

    if (filters) {
      if (filters.media_type) {
        query = query.eq('media_type', filters.media_type);
      }
      if (filters.visible_to_client !== undefined) {
        query = query.eq('visible_to_client', filters.visible_to_client);
      }
      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
    }

    // Order by sort_order and creation date
    query = query.order('sort_order', { ascending: true })
                 .order('created_at', { ascending: false });

    const { data: media, error } = await query;

    if (error) {
      console.error('Database error fetching media:', error);
      return { data: null, error };
    }

    return { data: media || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while fetching media' } 
    };
  }
}

export async function getMediaById(mediaId: string): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!mediaId) {
      return { data: null, error: { message: 'Media ID is required' } };
    }

    const { data: media, error } = await supabase
      .from('assessment_media')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: { message: 'Media not found' } };
      }
      console.error('Database error fetching media:', error);
      return { data: null, error };
    }

    return { data: media, error: null };
  } catch (error) {
    console.error('Unexpected error fetching media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while fetching the media' } 
    };
  }
}

// =====================================================
// MEDIA UPDATE OPERATIONS
// =====================================================

export async function updateAssessmentMedia(
  mediaId: string,
  updates: Partial<AssessmentMedia>
): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!mediaId) {
      return { data: null, error: { message: 'Media ID is required' } };
    }

    // Verify media belongs to user
    const { data: existingMedia, error: checkError } = await supabase
      .from('assessment_media')
      .select('id, user_id, assessment_id')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingMedia) {
      return { data: null, error: { message: 'Media not found or access denied' } };
    }

    // Process tags if provided
    const updateData = { ...updates };
    if (updates.tags && typeof updates.tags === 'string') {
      updateData.tags = (updates.tags as any).split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }

    const { data: media, error } = await supabase
      .from('assessment_media')
      .update(updateData)
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating media:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${existingMedia.assessment_id}`);
    return { data: media, error: null };
  } catch (error) {
    console.error('Unexpected error updating media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while updating the media' } 
    };
  }
}

export async function toggleMediaFeatured(mediaId: string, isFeatured: boolean): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!mediaId) {
      return { data: null, error: { message: 'Media ID is required' } };
    }

    // Get media to find assessment_id
    const { data: existingMedia, error: checkError } = await supabase
      .from('assessment_media')
      .select('id, user_id, assessment_id')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingMedia) {
      return { data: null, error: { message: 'Media not found or access denied' } };
    }

    // If setting as featured, remove featured status from other media in same assessment
    if (isFeatured) {
      await supabase
        .from('assessment_media')
        .update({ is_featured: false })
        .eq('assessment_id', existingMedia.assessment_id)
        .eq('user_id', user.id)
        .neq('id', mediaId);
    }

    const { data: media, error } = await supabase
      .from('assessment_media')
      .update({ is_featured: isFeatured })
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error toggling media featured status:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${existingMedia.assessment_id}`);
    return { data: media, error: null };
  } catch (error) {
    console.error('Unexpected error toggling media featured status:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while updating the media' } 
    };
  }
}

export async function reorderMedia(
  assessmentId: string,
  mediaOrder: { id: string; sort_order: number }[]
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!assessmentId) {
      return { data: null, error: { message: 'Assessment ID is required' } };
    }

    // Verify assessment belongs to user
    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select('id, user_id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (assessmentError || !assessment) {
      return { data: null, error: { message: 'Assessment not found or access denied' } };
    }

    // Update sort order for each media item
    for (const item of mediaOrder) {
      const { error: updateError } = await supabase
        .from('assessment_media')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('user_id', user.id)
        .eq('assessment_id', assessmentId);

      if (updateError) {
        console.error('Error updating media order:', updateError);
        return { data: null, error: updateError };
      }
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${assessmentId}`);
    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error reordering media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while reordering media' } 
    };
  }
}

// =====================================================
// MEDIA DELETE OPERATIONS
// =====================================================

export async function deleteAssessmentMedia(mediaId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!mediaId) {
      return { data: null, error: { message: 'Media ID is required' } };
    }

    // Get media details before deletion
    const { data: media, error: fetchError } = await supabase
      .from('assessment_media')
      .select('storage_bucket, storage_path, assessment_id')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !media) {
      return { data: null, error: { message: 'Media not found or access denied' } };
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from('assessment_media')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Database error deleting media:', deleteError);
      return { data: null, error: deleteError };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(media.storage_bucket)
      .remove([media.storage_path]);

    if (storageError) {
      console.error('Storage error deleting media file:', storageError);
      // Don't fail the entire operation for storage errors
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${media.assessment_id}`);
    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error deleting media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while deleting the media' } 
    };
  }
}

export async function bulkDeleteMedia(mediaIds: string[]): Promise<ActionResponse<{ deleted: number }>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!mediaIds || mediaIds.length === 0) {
      return { data: null, error: { message: 'No media selected for deletion' } };
    }

    // Get media details before deletion
    const { data: mediaFiles, error: fetchError } = await supabase
      .from('assessment_media')
      .select('id, storage_bucket, storage_path, assessment_id')
      .in('id', mediaIds)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching media for bulk delete:', fetchError);
      return { data: null, error: fetchError };
    }

    if (!mediaFiles || mediaFiles.length === 0) {
      return { data: null, error: { message: 'No media found or access denied' } };
    }

    // Delete from database
    const { data: deletedMedia, error: deleteError } = await supabase
      .from('assessment_media')
      .delete()
      .in('id', mediaIds)
      .eq('user_id', user.id)
      .select('id');

    if (deleteError) {
      console.error('Database error in bulk media delete:', deleteError);
      return { data: null, error: deleteError };
    }

    // Delete from storage
    const filePaths = mediaFiles.map(file => file.storage_path);
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('assessment-media')
        .remove(filePaths);

      if (storageError) {
        console.error('Storage error in bulk media delete:', storageError);
        // Don't fail the entire operation for storage errors
      }
    }

    // Get unique assessment IDs for cache invalidation
    const assessmentIds = Array.from(new Set(mediaFiles.map(file => file.assessment_id)));
    
    revalidatePath('/assessments');
    assessmentIds.forEach(id => revalidatePath(`/assessments/${id}`));
    
    return { data: { deleted: deletedMedia?.length || 0 }, error: null };
  } catch (error) {
    console.error('Unexpected error in bulk media delete:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during bulk media deletion' } 
    };
  }
}

// =====================================================
// MEDIA APPROVAL OPERATIONS
// =====================================================

export async function approveMedia(mediaId: string): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    if (!mediaId) {
      return { data: null, error: { message: 'Media ID is required' } };
    }

    const { data: media, error } = await supabase
      .from('assessment_media')
      .update({
        requires_approval: false,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error approving media:', error);
      return { data: null, error };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${media.assessment_id}`);
    return { data: media, error: null };
  } catch (error) {
    console.error('Unexpected error approving media:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred while approving the media' } 
    };
  }
}