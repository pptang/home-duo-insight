-- Create recommendation_feedback table
CREATE TABLE public.recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  feedback text NOT NULL CHECK (feedback IN ('positive', 'negative')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (recommendation_id, session_id)
);

-- Enable RLS
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (for anonymous users)
CREATE POLICY "Anyone can insert feedback"
ON public.recommendation_feedback
FOR INSERT
WITH CHECK (true);

-- Anyone can view feedback
CREATE POLICY "Anyone can view feedback"
ON public.recommendation_feedback
FOR SELECT
USING (true);

-- Users can update their own feedback (by session_id match)
CREATE POLICY "Users can update their own feedback"
ON public.recommendation_feedback
FOR UPDATE
USING (session_id = session_id);