-- Add three new priority columns to comparisons table
ALTER TABLE comparisons
ADD COLUMN IF NOT EXISTS top_priority_1 text,
ADD COLUMN IF NOT EXISTS top_priority_2 text,
ADD COLUMN IF NOT EXISTS top_priority_3 text;