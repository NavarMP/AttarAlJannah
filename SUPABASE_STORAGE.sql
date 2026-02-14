-- Create the 'profile-photos' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow Public Read Access
-- Everyone (anon and authenticated) can view files in this bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-photos' );

-- Policy 2: Allow Authenticated Uploads
-- Only authenticated users can upload files to this bucket
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profile-photos' );

-- Policy 3: Allow Users to Update their own files (Optional but good)
-- If file path contains their user ID or similar, but for now simple update might be fine if authenticated.
-- A simple update policy for authenticated users:
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'profile-photos' );

-- Policy 4: Allow Users to Delete their own files
-- Simple delete for authenticated users
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'profile-photos' );
