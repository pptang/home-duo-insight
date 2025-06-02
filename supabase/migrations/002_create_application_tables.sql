-- Create properties table
CREATE TABLE public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_name TEXT,
    address TEXT,
    price_yen BIGINT,
    floor_plan TEXT,
    commute_minutes INTEGER,
    property_type TEXT,
    image_urls TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create comparisons table
CREATE TABLE public.comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_a_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    property_b_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create expert_profiles table
CREATE TABLE public.expert_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    profile_image_url TEXT,
    company_website TEXT,
    x_handle TEXT,
    instagram_url TEXT,
    line_url TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create expert_ratings table
CREATE TABLE public.expert_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expert_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, expert_user_id)
);

-- Create votes table
CREATE TABLE public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comparison_id UUID NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
    expert_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    voted_for UUID NOT NULL, -- property_a_id or property_b_id
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_comparisons_property_a_id ON public.comparisons(property_a_id);
CREATE INDEX idx_comparisons_property_b_id ON public.comparisons(property_b_id);
CREATE INDEX idx_comparisons_user_id ON public.comparisons(user_id);
CREATE INDEX idx_expert_profiles_user_id ON public.expert_profiles(user_id);
CREATE INDEX idx_expert_ratings_expert_user_id ON public.expert_ratings(expert_user_id);
CREATE INDEX idx_votes_comparison_id ON public.votes(comparison_id);
CREATE INDEX idx_votes_expert_user_id ON public.votes(expert_user_id);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Properties - Public read, authenticated users can insert
CREATE POLICY "Properties are viewable by everyone" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create properties" ON public.properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comparisons - Public read, authenticated users can insert their own
CREATE POLICY "Comparisons are viewable by everyone" ON public.comparisons
    FOR SELECT USING (true);

CREATE POLICY "Users can create comparisons" ON public.comparisons
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Expert profiles - Public read, experts can manage their own
CREATE POLICY "Expert profiles are viewable by everyone" ON public.expert_profiles
    FOR SELECT USING (true);

CREATE POLICY "Experts can manage their own profile" ON public.expert_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Expert ratings - Users can rate experts, view all ratings
CREATE POLICY "Expert ratings are viewable by everyone" ON public.expert_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can create expert ratings" ON public.expert_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes - Public read, experts can create their own votes
CREATE POLICY "Votes are viewable by everyone" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Experts can create votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = expert_user_id);
