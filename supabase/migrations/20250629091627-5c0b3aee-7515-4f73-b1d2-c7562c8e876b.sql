
-- Add missing user_id field to expert_profiles table to link with auth users
ALTER TABLE public.expert_profiles ADD COLUMN user_id uuid;

-- Update the foreign key relationship for votes table
-- The expert_user_id should reference expert_profiles.id, not profiles.id
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_expert_user_id_fkey;
ALTER TABLE public.votes ADD CONSTRAINT votes_expert_user_id_fkey 
  FOREIGN KEY (expert_user_id) REFERENCES public.expert_profiles(id) ON DELETE CASCADE;

-- Add foreign key relationship from expert_profiles.user_id to profiles.id
ALTER TABLE public.expert_profiles ADD CONSTRAINT expert_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
