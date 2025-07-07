-- Add image extraction status fields to comparisons table
ALTER TABLE public.comparisons 
ADD COLUMN image_extraction_status TEXT DEFAULT 'pending' CHECK (image_extraction_status IN ('pending', 'in_progress', 'completed', 'failed')),
ADD COLUMN image_extraction_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN image_extraction_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when querying by status
CREATE INDEX idx_comparisons_image_extraction_status ON public.comparisons(image_extraction_status);