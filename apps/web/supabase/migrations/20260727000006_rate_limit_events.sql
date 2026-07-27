-- DB-backed rate limiting for unauthenticated write endpoints (/api/orders,
-- /api/custom-designs). No external dependency (Redis/Upstash) needed; this
-- app's traffic volume doesn't need anything faster than a Postgres table.

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_bucket_created
  ON public.rate_limit_events (bucket_key, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: this table is only ever touched through the
-- SECURITY DEFINER function below, called with the service-role key.

-- Atomically checks whether `p_bucket_key` (e.g. "orders:203.0.113.4" or
-- "orders:email:foo@example.com") is still under `p_max_count` hits within
-- the trailing `p_window_seconds`, and records this attempt if so.
CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  p_bucket_key text,
  p_max_count integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Opportunistic cleanup, bounded and cheap at this app's traffic volume.
  DELETE FROM public.rate_limit_events WHERE created_at < now() - interval '1 day';

  SELECT count(*) INTO v_count
  FROM public.rate_limit_events
  WHERE bucket_key = p_bucket_key
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF v_count >= p_max_count THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_events (bucket_key) VALUES (p_bucket_key);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_record_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, integer, integer) TO service_role;
