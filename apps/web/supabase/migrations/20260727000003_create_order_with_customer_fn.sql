-- Fixes two audit findings at once:
--
-- 1. (Bug) customer upsert + order insert were two separate round trips from
--    the API route. If the order insert failed after the customer upsert
--    succeeded, `customers.order_count` / `last_order_at` drifted permanently
--    with no corresponding order and no rollback. Wrapping both writes in a
--    single plpgsql function makes them atomic (one transaction).
--
-- 2. (High/security) a guest checkout using an email address that already
--    belongs to a *different*, already-linked account could silently overwrite
--    that account's name/phone/city with no verification of email ownership.
--    The function now only overwrites contact fields when the submitting
--    request is anonymous-vs-guest-customer or matches the linked user; a
--    mismatched linked customer only gets its order-count/last-order-at stats
--    bumped, never its contact details.

CREATE OR REPLACE FUNCTION public.create_order_with_customer(
  p_email_normalized text,
  p_display_email text,
  p_full_name text,
  p_phone text,
  p_residence_city text,
  p_user_id uuid,
  p_customer_address text,
  p_notes text,
  p_checkout_details jsonb,
  p_items jsonb,
  p_custom_design_id uuid
)
RETURNS TABLE (order_id uuid, customer_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_customer_id uuid;
  v_existing_user_id uuid;
  v_order_id uuid;
  v_now timestamptz := now();
BEGIN
  -- Lock the matching customer row (if any) for the duration of this transaction
  -- so concurrent checkouts with the same email can't race on order_count.
  SELECT id, user_id INTO v_customer_id, v_existing_user_id
  FROM public.customers
  WHERE email_normalized = p_email_normalized
  FOR UPDATE;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      email_normalized, display_email, full_name, phone_or_social,
      residence_city, user_id, first_order_at, last_order_at, order_count
    ) VALUES (
      p_email_normalized, p_display_email, p_full_name, p_phone,
      p_residence_city, p_user_id, v_now, v_now, 1
    )
    RETURNING id INTO v_customer_id;
  ELSIF v_existing_user_id IS NULL OR v_existing_user_id = p_user_id THEN
    -- Pure guest customer, or the submitter IS the linked account: safe to
    -- refresh contact details from this checkout submission.
    UPDATE public.customers SET
      display_email = p_display_email,
      full_name = p_full_name,
      phone_or_social = p_phone,
      residence_city = p_residence_city,
      user_id = COALESCE(v_existing_user_id, p_user_id),
      last_order_at = v_now,
      order_count = order_count + 1
    WHERE id = v_customer_id;
  ELSE
    -- Email belongs to a different linked account. Bump order stats only —
    -- never let an unverified submitter overwrite someone else's contact data.
    UPDATE public.customers SET
      last_order_at = v_now,
      order_count = order_count + 1
    WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.orders (
    user_id, customer_id, customer_name, customer_email, customer_phone,
    customer_address, notes, checkout_details, items, status, custom_design_id
  ) VALUES (
    p_user_id, v_customer_id, p_full_name, p_display_email, p_phone,
    p_customer_address, p_notes, p_checkout_details, p_items, 'pending', p_custom_design_id
  )
  RETURNING id INTO v_order_id;

  RETURN QUERY SELECT v_order_id, v_customer_id;
END;
$$;

-- Only the service-role key (used exclusively by /api/orders) may call this.
REVOKE ALL ON FUNCTION public.create_order_with_customer(
  text, text, text, text, text, uuid, text, text, jsonb, jsonb, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_customer(
  text, text, text, text, text, uuid, text, text, jsonb, jsonb, uuid
) TO service_role;
