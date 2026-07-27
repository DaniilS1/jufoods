-- Adds visibility into whether the order-notification webhook (ORDER_WEBHOOK_URL)
-- was actually delivered. Previously a failed/timed-out/misconfigured webhook
-- failed silently — nobody could tell from the admin panel that a shop-owner
-- notification never went out for a given order.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS webhook_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_last_error text;

COMMENT ON COLUMN public.orders.webhook_delivered_at IS 'Set when ORDER_WEBHOOK_URL responded 2xx for this order; NULL means never confirmed delivered.';
COMMENT ON COLUMN public.orders.webhook_last_error IS 'Last webhook delivery error (HTTP status/message or network/timeout error), for admin troubleshooting.';
