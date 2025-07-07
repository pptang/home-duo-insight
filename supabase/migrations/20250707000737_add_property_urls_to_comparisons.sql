-- Add original property URLs to comparisons table for retry functionality
ALTER TABLE public.comparisons 
ADD COLUMN property_url_a TEXT,
ADD COLUMN property_url_b TEXT;