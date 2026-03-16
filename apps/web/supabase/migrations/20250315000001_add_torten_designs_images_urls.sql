-- Add multiple images support to torten_designs
ALTER TABLE public.torten_designs
  ADD COLUMN IF NOT EXISTS images_urls text[] DEFAULT '{}';
