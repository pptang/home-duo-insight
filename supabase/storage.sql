
-- Create a storage bucket for expert profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('expert-profiles', 'expert-profiles', true);

-- Set up public access policy for the bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'expert-profiles');
  
-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'expert-profiles' AND
    auth.role() = 'authenticated'
  );
