-- Follow-up fix: this Supabase project has default privileges
-- (ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO
-- anon, authenticated, service_role) applied at function-creation time.
-- These are separate ACL entries from the PUBLIC pseudo-role, so the
-- "REVOKE ALL ... FROM PUBLIC" in the preceding migrations did NOT remove
-- anon/authenticated's EXECUTE grant on the new service-role-only functions,
-- confirmed via information_schema.routine_privileges.
--
-- Left as-is: public.is_admin, which intentionally grants EXECUTE to
-- authenticated/anon (RLS policies on public.users call it for any role).

REVOKE EXECUTE ON FUNCTION public.create_order_with_customer(
  text, text, text, text, text, uuid, text, text, jsonb, jsonb, uuid
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.link_guest_customer_to_user(uuid, text)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, integer, integer)
  FROM anon, authenticated;
