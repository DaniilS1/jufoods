-- Add classic flag to torten_designs: when true, design has no flavour links
ALTER TABLE public.torten_designs
  ADD COLUMN IF NOT EXISTS classic boolean NOT NULL DEFAULT false;
