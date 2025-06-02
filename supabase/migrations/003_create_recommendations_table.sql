-- Create recommendations table to store AI-generated property recommendations
CREATE TABLE public.recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comparison_id UUID NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Property A analysis
    property_a_pros TEXT[] NOT NULL DEFAULT '{}',
    property_a_cons TEXT[] NOT NULL DEFAULT '{}',
    
    -- Property B analysis  
    property_b_pros TEXT[] NOT NULL DEFAULT '{}',
    property_b_cons TEXT[] NOT NULL DEFAULT '{}',
    
    -- Summary comparison table (stored as JSONB for flexibility)
    summary_table JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Final AI recommendation
    final_recommendation TEXT NOT NULL,
    
    -- User profile used for this recommendation (for reference)
    user_profile JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_recommendations_comparison_id ON public.recommendations(comparison_id);
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at);

-- Enable Row Level Security
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for recommendations
-- Users can read recommendations they generated or for public comparisons
CREATE POLICY "Users can view their own recommendations" ON public.recommendations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL
    );

-- Users can insert their own recommendations
CREATE POLICY "Users can create recommendations" ON public.recommendations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        user_id IS NULL
    );

-- Users can update their own recommendations
CREATE POLICY "Users can update their own recommendations" ON public.recommendations
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_recommendations_updated_at
    BEFORE UPDATE ON public.recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();