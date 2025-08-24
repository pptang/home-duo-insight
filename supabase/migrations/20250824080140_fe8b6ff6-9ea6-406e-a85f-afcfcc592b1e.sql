-- Add status column to expert_profiles table
ALTER TABLE expert_profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add check constraint for valid status values
ALTER TABLE expert_profiles 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_expert_profiles_status ON expert_profiles(status);

-- Add region column for expert specialization
ALTER TABLE expert_profiles 
ADD COLUMN IF NOT EXISTS region text;

-- Add specialization_tags column as text array
ALTER TABLE expert_profiles 
ADD COLUMN IF NOT EXISTS specialization_tags text[];

-- Update existing approved experts to have correct status
UPDATE expert_profiles 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';