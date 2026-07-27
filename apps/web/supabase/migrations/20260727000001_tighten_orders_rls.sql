-- Security fix: `orders` allowed anonymous direct INSERT ("Anyone can create
-- orders" WITH CHECK (true)) and let customers UPDATE their own order with no
-- column/value restriction (could flip their own `status` to "completed").
--
-- Order creation now exclusively goes through /api/orders, which uses the
-- service-role client (bypasses RLS) via the create_order_with_customer()
-- RPC (see 20260727000003). Customers never need to write to `orders` directly.

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- "Users can view their own orders" (SELECT, auth.uid() = user_id) is kept —
-- it is what /api/account/orders relies on for the customer's own order history.
