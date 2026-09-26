-- Restore EXECUTE privileges required by RLS policy expressions.
-- These helpers remain in the non-exposed private schema and are SECURITY DEFINER.
-- Anonymous users must not execute them.

revoke all on function private.has_product_access() from public, anon;
revoke all on function private.has_social_access(uuid) from public, anon;
revoke all on function private.is_participant(uuid) from public, anon;

grant execute on function private.has_product_access() to authenticated;
grant execute on function private.has_social_access(uuid) to authenticated;
grant execute on function private.is_participant(uuid) to authenticated;
