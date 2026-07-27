-- Security fix: public.users, public.settings, public.custom_designs were created
-- without Row Level Security. Any client holding the public anon/authenticated key
-- could read every user's name/phone/role and, worse, write to public.users.role
-- (self-promotion to admin). This migration locks all three tables down.

-- 1. SECURITY DEFINER helper so admin-check policies never recurse through RLS
--    on public.users (the function body bypasses RLS because of SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = check_user_id AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- 2. public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Self-service profile creation (defense-in-depth fallback used by ensureUserProfile()
-- when the on_auth_user_created trigger hasn't run yet). role is pinned to 'customer'.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'customer');

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Belt-and-suspenders: even though no policy grants a role change, explicitly
-- revoke column-level UPDATE on `role` for client-facing roles. Role changes
-- must go through the service-role key (e.g. Supabase Studio) only.
REVOKE UPDATE (role) ON public.users FROM authenticated, anon;

-- 3. public.settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
CREATE POLICY "Users can view own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
CREATE POLICY "Users can insert own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
CREATE POLICY "Users can update own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. public.custom_designs
ALTER TABLE public.custom_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own custom designs" ON public.custom_designs;
CREATE POLICY "Users can view own custom designs" ON public.custom_designs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own custom designs" ON public.custom_designs;
CREATE POLICY "Users can insert own custom designs" ON public.custom_designs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own custom designs" ON public.custom_designs;
CREATE POLICY "Users can update own custom designs" ON public.custom_designs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own custom designs" ON public.custom_designs;
CREATE POLICY "Users can delete own custom designs" ON public.custom_designs
  FOR DELETE USING (auth.uid() = user_id);
