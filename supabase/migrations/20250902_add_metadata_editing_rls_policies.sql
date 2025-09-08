-- Row Level Security policies for metadata editing functionality

-- Enable RLS on properties table for editing
CREATE POLICY "Users can update properties they have access to" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM comparisons 
      WHERE (property_a_id = properties.id OR property_b_id = properties.id)
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- Enable RLS on comparisons for status updates
CREATE POLICY "Users can update their own comparisons" ON comparisons
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);