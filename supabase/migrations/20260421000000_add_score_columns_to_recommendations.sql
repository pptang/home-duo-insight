ALTER TABLE public.recommendations
  ADD COLUMN property_a_score_total smallint,
  ADD COLUMN property_b_score_total smallint,
  ADD COLUMN score_breakdown jsonb;

COMMENT ON COLUMN public.recommendations.score_breakdown IS
  'JSON object with integer keys 0-100: price, location, building. Example: {"price": 72, "location": 85, "building": 63}';
