-- Add popularity_rank to torten_designs for the "Beliebte Torten" homepage carousel.
-- NULL = not featured. Lower rank shows first (1 = top). Curated by admin.

ALTER TABLE public.torten_designs
  ADD COLUMN IF NOT EXISTS popularity_rank integer;

-- Speeds up the homepage query: WHERE popularity_rank IS NOT NULL ORDER BY popularity_rank
CREATE INDEX IF NOT EXISTS torten_designs_popularity_rank_idx
  ON public.torten_designs (popularity_rank)
  WHERE popularity_rank IS NOT NULL;
