-- Fixes: guest orders were never linked to an account, even retroactively.
-- orders.user_id was only ever set once, at insert time; a customer who
-- ordered as a guest and later registered/logged in never saw those orders
-- in "My Account" because /api/account/orders filters strictly by
-- orders.user_id = auth.uid().
--
-- Two mechanisms, covering both ways a guest can become a known user:
--
-- 1. A trigger on public.customers: whenever a customer row's user_id is set
--    (guest -> linked), backfill every historical order for that customer
--    that doesn't have a user_id yet.
-- 2. A callable function `public.link_guest_customer_to_user`, invoked from
--    the app (on login/session-check, see lib/supabase/account.ts) to find a
--    guest customer row by email and link it — covering "already has an
--    account, ordered as a guest, logs back in without checking out again".

CREATE OR REPLACE FUNCTION public.backfill_orders_on_customer_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    UPDATE public.orders
    SET user_id = NEW.user_id
    WHERE customer_id = NEW.id AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_customer_user_linked ON public.customers;
CREATE TRIGGER on_customer_user_linked
  AFTER UPDATE OF user_id ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.backfill_orders_on_customer_link();

-- Also cover the INSERT path (customer row created directly with a user_id,
-- e.g. first order placed while already logged in) for completeness.
DROP TRIGGER IF EXISTS on_customer_user_linked_insert ON public.customers;
CREATE TRIGGER on_customer_user_linked_insert
  AFTER INSERT ON public.customers
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.backfill_orders_on_customer_link();

-- Callable from the app (service-role) after login to link a pre-existing
-- guest customer/order history to the now-known account.
CREATE OR REPLACE FUNCTION public.link_guest_customer_to_user(
  p_user_id uuid,
  p_email_normalized text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_customer_id uuid;
  v_existing_user_id uuid;
BEGIN
  SELECT id, user_id INTO v_customer_id, v_existing_user_id
  FROM public.customers
  WHERE email_normalized = p_email_normalized
  FOR UPDATE;

  IF v_customer_id IS NULL THEN
    RETURN;
  END IF;

  IF v_existing_user_id IS NULL THEN
    UPDATE public.customers SET user_id = p_user_id WHERE id = v_customer_id;
  END IF;
  -- If already linked to a *different* user, do nothing (don't steal a
  -- customer record another account owns).
END;
$$;

REVOKE ALL ON FUNCTION public.link_guest_customer_to_user(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_guest_customer_to_user(uuid, text) TO service_role;
