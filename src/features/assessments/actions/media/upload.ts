'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { AssessmentMedia, AssessmentMediaType, UploadAssessmentMediaData } from '../../types';

/**
 * Infers media type from file type
 */
export function inferMediaTypeFromFile(file: File): AssessmentMediaType {
  if (file.type.startsWith('image/')) {
    return 'photo';
  } else if (file.type.startsWith('video/')) {
    return 'video';
  } else {
    return 'document';
  }
}

/**
 * Generates unique storage path for media files
 */
export function generateStoragePath(
  assessmentId: string, 
  fileName: string, 
  type: AssessmentMediaType
): string {
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `assessments/${assessmentId}/${type}s/${timestamp}_${cleanFileName}`;
}

/**
 * Validates media file for upload
 */
export function validateMediaFile(
  file: File,
  type: AssessmentMediaType,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): string | null {
  if (!file) {
    return 'File is required';
  }

  if (file.size > maxSize) {
    return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
  }

  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const validDocumentTypes = [
    'application/pdf', 
    'text/plain', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  switch (type) {
    case 'photo':
      if (!validImageTypes.includes(file.type)) {
        return 'Only JPEG, PNG, and WebP images are allowed for photos';
      }
      break;
    case 'video':
      if (!validVideoTypes.includes(file.type)) {
        return 'Only MP4, WebM, and QuickTime videos are allowed';
      }
      break;
    case 'document':
      if (!validDocumentTypes.includes(file.type)) {
        return 'Only PDF, Word documents, and text files are allowed';
      }
      break;
    default:
      return 'Invalid media type specified';
  }

  return null;
}

/**
 * Uploads media file for assessment
 */
export async function uploadAssessmentMedia(data: UploadAssessmentMediaData): Promise<ActionResponse<AssessmentMedia>> {
  try {
    const { file, assessment_id, media_type, description, tags, visible_to_client } = data;

    // Validate file
    const validationError = validateMediaFile(file, media_type);
    if (validationError) {
      return { 
        data: null,
        error: { 
          message: validationError,
          code: 'VALIDATION_ERROR' 
        } 
      };
    }

    const supabase = await createSupabaseServerClient();

    // Generate unique file path
    const storagePath = generateStoragePath(assessment_id, file.name, media_type);

    // Upload file to storage
    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from('assessment-media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return { 
        data: null,
        error: { 
          message: 'Failed to upload file',
          code: 'STORAGE_ERROR' 
        } 
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assessment-media')
      .getPublicUrl(storagePath);

    // Save media record to database
    const { data: mediaRecord, error: dbError } = await supabase
      .from('assessment_media')
      .insert({
        assessment_id: assessment_id,
        type: media_type,
        url: publicUrl,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        description,
        tags,
        is_featured: visible_to_client || false
      })
      .select('*')
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('assessment-media')
        .remove([storagePath]);

      console.error('Database insert error:', dbError);
      return { 
        data: null,
        error: { 
          message: 'Failed to save media record',
          code: 'DATABASE_ERROR' 
        } 
      };
    }

    revalidatePath(`/assessments/${assessment_id}`);
    return { data: mediaRecord, error: null };
  } catch (error) {
    console.error('Upload assessment media unexpected error:', error);
    return { 
      data: null,
      error: { 
        message: 'An unexpected error occurred during upload',
        code: 'UNKNOWN_ERROR' 
      } 
    };
  }
}