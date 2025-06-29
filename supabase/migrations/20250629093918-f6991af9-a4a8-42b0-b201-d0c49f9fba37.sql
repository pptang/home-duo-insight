
-- Add foreign key constraint from comparisons.user_id to profiles.id
ALTER TABLE public.comparisons 
ADD CONSTRAINT fk_comparisons_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
