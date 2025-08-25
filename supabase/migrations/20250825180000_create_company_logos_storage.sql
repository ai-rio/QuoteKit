-- Migration to create company-logos storage bucket and policies
-- This fixes the "Failed to upload logo" issue by creating the missing bucket

-- Create the company-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-logos bucket
-- Users can only access their own logos (organized by user ID as folder)

-- Create helper function to extract folder name from storage path
-- This avoids conflicts with storage system's internal foldername function
CREATE OR REPLACE FUNCTION get_user_folder_from_path(path text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Extract the first directory from a path like "user-id/filename.ext"
    -- Returns the user-id part
    RETURN split_part(path, '/', 1);
END;
$$;

-- Policy: Users can insert logos into their own folder
CREATE POLICY "Users can upload their own company logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.uid()::text = get_user_folder_from_path(name)
);

-- Policy: Users can view their own logos
CREATE POLICY "Users can view their own company logos" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'company-logos' 
    AND auth.uid()::text = get_user_folder_from_path(name)
);

-- Policy: Users can update their own logos
CREATE POLICY "Users can update their own company logos" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'company-logos' 
    AND auth.uid()::text = get_user_folder_from_path(name)
)
WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.uid()::text = get_user_folder_from_path(name)
);

-- Policy: Users can delete their own logos
CREATE POLICY "Users can delete their own company logos" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'company-logos' 
    AND auth.uid()::text = get_user_folder_from_path(name)
);

-- Add helpful comment (skip if not owner)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        -- Only try to comment if we have permissions
        BEGIN
            COMMENT ON TABLE storage.objects IS 'Storage objects including company logos organized by user ID folders';
        EXCEPTION WHEN insufficient_privilege THEN
            -- Ignore permission errors for comments
            NULL;
        END;
    END IF;
END
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Company logos storage bucket created successfully!';
    RAISE NOTICE 'Created bucket: company-logos with user-scoped access policies';
    RAISE NOTICE 'Logo upload functionality should now work correctly';
END $$;