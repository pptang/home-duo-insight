-- Add metadata editing fields to properties table
ALTER TABLE properties 
ADD COLUMN edited_at TIMESTAMP,
ADD COLUMN edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN manual_overrides JSONB;

-- Add metadata review fields to comparisons table
ALTER TABLE comparisons 
ADD COLUMN metadata_review_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN metadata_reviewed_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_properties_edited_at ON properties(edited_at);
CREATE INDEX idx_properties_edited_by ON properties(edited_by);
CREATE INDEX idx_comparisons_metadata_status ON comparisons(metadata_review_status);

-- Add comments for documentation
COMMENT ON COLUMN properties.edited_at IS 'Timestamp when property metadata was last edited';
COMMENT ON COLUMN properties.edited_by IS 'User ID who last edited the property metadata';
COMMENT ON COLUMN properties.manual_overrides IS 'JSON object tracking manual field overrides';
COMMENT ON COLUMN comparisons.metadata_review_status IS 'Status of metadata review: pending, in_review, completed, skipped';
COMMENT ON COLUMN comparisons.metadata_reviewed_at IS 'Timestamp when metadata review was completed';