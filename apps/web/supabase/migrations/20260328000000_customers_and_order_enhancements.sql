-- Checkout customers, order linkage, structured checkout payload, admin RLS

-- 1. Customers (guest-first; optional link to public.users)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL,
  display_email text NOT NULL,
  full_name text NOT NULL,
  phone_or_social text,
  residence_city text,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  first_order_at timestamptz NOT NULL DEFAULT now(),
  last_order_at timestamptz NOT NULL DEFAULT now(),
  order_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_email_normalized_key UNIQUE (email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_customers_last_order_at ON public.customers (last_order_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers (user_id) WHERE user_id IS NOT NULL;

CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Orders: link to customer + structured checkout JSON
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers (id) ON DELETE RESTRICT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_details jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);

COMMENT ON COLUMN public.orders.checkout_details IS 'Structured checkout payload: orderDetails, delivery, referralSource, cityOfResidence, etc.';
COMMENT ON COLUMN public.orders.notes IS 'Customer free-text remarks from checkout (and legacy JSON for old rows).';

-- 3. RLS: customers — no direct client writes; service role bypasses RLS for API
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select all customers" ON public.customers
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 4. RLS: orders — admins can read and update (e.g. status) all orders
CREATE POLICY "Admins can select all orders" ON public.orders
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
