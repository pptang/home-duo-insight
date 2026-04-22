-- home-duo-insight-dy7: surface real view/save counts on comparison detail page.
-- Adds view_count + save_count columns, a saved_comparisons relation with a
-- trigger that keeps save_count in sync, and a SECURITY DEFINER RPC so anon
-- visitors can increment view_count without direct UPDATE access.

ALTER TABLE public.comparisons
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count integer NOT NULL DEFAULT 0;

-- Saved comparisons (bookmarks). Composite PK prevents double-saves per user.
CREATE TABLE IF NOT EXISTS public.saved_comparisons (
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comparison_id uuid        NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comparison_id)
);

CREATE INDEX IF NOT EXISTS saved_comparisons_comparison_id_idx
  ON public.saved_comparisons (comparison_id);

ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage their own saves" ON public.saved_comparisons;
CREATE POLICY "users manage their own saves"
  ON public.saved_comparisons
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger keeps comparisons.save_count in sync with saved_comparisons rows.
CREATE OR REPLACE FUNCTION public.sync_comparison_save_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comparisons
       SET save_count = save_count + 1
     WHERE id = NEW.comparison_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comparisons
       SET save_count = GREATEST(save_count - 1, 0)
     WHERE id = OLD.comparison_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS saved_comparisons_sync_count ON public.saved_comparisons;
CREATE TRIGGER saved_comparisons_sync_count
  AFTER INSERT OR DELETE ON public.saved_comparisons
  FOR EACH ROW EXECUTE FUNCTION public.sync_comparison_save_count();

-- View increment RPC. SECURITY DEFINER so anon viewers can bump the counter
-- without a direct UPDATE grant on comparisons.
CREATE OR REPLACE FUNCTION public.increment_comparison_view(p_comparison_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.comparisons
     SET view_count = view_count + 1
   WHERE id = p_comparison_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_comparison_view(uuid) TO anon, authenticated;
