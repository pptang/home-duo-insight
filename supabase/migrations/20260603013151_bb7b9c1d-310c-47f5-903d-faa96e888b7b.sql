-- Enable Row Level Security on the archive table
ALTER TABLE public.comparisons_archive_non_jp ENABLE ROW LEVEL SECURITY;

-- Deny all public access to this archive table
-- Edge functions use service_role and bypass RLS, so they can still access it
CREATE POLICY "Deny all public access to archive table"
  ON public.comparisons_archive_non_jp
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);