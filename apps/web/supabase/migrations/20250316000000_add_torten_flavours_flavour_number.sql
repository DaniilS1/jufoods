-- Add flavour_number for business ordering (unique, not the primary key)
ALTER TABLE public.torten_flavours
  ADD COLUMN IF NOT EXISTS flavour_number integer;

-- Backfill existing rows with stable order by created_at
UPDATE public.torten_flavours t
SET flavour_number = sub.rn
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM public.torten_flavours
) sub
WHERE t.id = sub.id;

ALTER TABLE public.torten_flavours
  ALTER COLUMN flavour_number SET NOT NULL;

ALTER TABLE public.torten_flavours
  ADD CONSTRAINT torten_flavours_flavour_number_key UNIQUE (flavour_number);
