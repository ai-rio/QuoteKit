import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client';

export interface LogoUploadResult {
  url: string | null;
  fileName: string | null;
  error: string | null;
}

export async function uploadLogo(file: File, userId: string): Promise<LogoUploadResult> {
  try {
    const supabase = createSupabaseClientClient();

    // Validate file
    if (!file.type.startsWith('image/')) {
      return { url: null, fileName: null, error: 'File must be an image' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { url: null, fileName: null, error: 'File size must be less than 5MB' };
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/logo-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: null, fileName: null, error: 'Failed to upload logo' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName);

    return { url: publicUrl, fileName, error: null };
  } catch (error) {
    console.error('Logo upload error:', error);
    return { url: null, fileName: null, error: 'Failed to upload logo' };
  }
}

export async function deleteLogo(fileName: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClientClient();

    const { error } = await supabase.storage
      .from('company-logos')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Logo delete error:', error);
    return false;
  }
}