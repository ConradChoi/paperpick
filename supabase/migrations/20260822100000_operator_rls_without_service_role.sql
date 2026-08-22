-- Lets the regular (cookie-bound, RLS-governed) client handle almost every
-- operator/permission read and write that getAdminAccess() and the
-- operator-groups/operators screens need, instead of requiring the
-- service-role key on every single /admin/* page load.
--
-- Service role is still unavoidable for two specific actions — creating and
-- deleting a Supabase Auth user (auth.admin.createUser/deleteUser has no
-- RLS-governed equivalent) — but that's now the ONLY place it's needed,
-- down from every admin page render.

-- Mirrors is_admin()/is_super_admin(): lets a policy check "is this row's
-- group the caller's own group" without an inline subquery on `admins`
-- (which is itself RLS-governed) triggering a second policy evaluation
-- per row. SECURITY DEFINER bypasses that entirely, same reasoning as
-- is_admin()/is_super_admin() above.
create function my_group_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from admins where user_id = auth.uid();
$$;

-- An operator can read their own group's permissions (needed by
-- getAdminAccess() to resolve what they can do) without being able to see
-- any other group's — is_super_admin() already grants full access to
-- every group via the existing operator_group_permissions_all_super_admin
-- policy, so this only adds visibility for the non-super-admin case.
create policy "operator_group_permissions_select_own_group"
  on operator_group_permissions for select
  using (group_id = my_group_id());

-- Lets a super admin update an admins row (e.g. reassigning an operator's
-- group) through the regular client. Insert/delete still go through
-- service role because they're bundled with the corresponding
-- auth.admin.createUser()/deleteUser() call in the same request.
create policy "admins_update_super_admin"
  on admins for update
  using (is_super_admin())
  with check (is_super_admin());
