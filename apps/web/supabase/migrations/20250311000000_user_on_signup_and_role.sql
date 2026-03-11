-- User-on-signup trigger, role column, and admin-only RLS

-- 1. Add role column to public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Set default for existing rows before adding NOT NULL
UPDATE public.users SET role = 'customer' WHERE role IS NULL;

ALTER TABLE public.users
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'customer';

-- Add check constraint (drop first if exists from previous run)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin'));

-- 2. Trigger function for signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    'customer'
  );
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- 3. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Replace products RLS with admin-only CUD
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 5. Enable RLS and add admin-only policies for torten_designs
ALTER TABLE public.torten_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Torten designs viewable by everyone" ON public.torten_designs;
DROP POLICY IF EXISTS "Admins can manage torten designs" ON public.torten_designs;

CREATE POLICY "Torten designs viewable by everyone" ON public.torten_designs
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert torten designs" ON public.torten_designs
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update torten designs" ON public.torten_designs
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete torten designs" ON public.torten_designs
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 6. Enable RLS and add admin-only policies for torten_flavours
ALTER TABLE public.torten_flavours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Torten flavours viewable by everyone" ON public.torten_flavours;
DROP POLICY IF EXISTS "Admins can manage torten flavours" ON public.torten_flavours;

CREATE POLICY "Torten flavours viewable by everyone" ON public.torten_flavours
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert torten flavours" ON public.torten_flavours
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update torten flavours" ON public.torten_flavours
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete torten flavours" ON public.torten_flavours
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 7. Enable RLS and add admin-only policies for design_flavour
ALTER TABLE public.design_flavour ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Design flavour viewable by everyone" ON public.design_flavour;
DROP POLICY IF EXISTS "Admins can manage design flavour" ON public.design_flavour;

CREATE POLICY "Design flavour viewable by everyone" ON public.design_flavour
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert design flavour" ON public.design_flavour
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update design flavour" ON public.design_flavour
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete design flavour" ON public.design_flavour
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
