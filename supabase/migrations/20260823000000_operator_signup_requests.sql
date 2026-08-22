-- Self-service operator signup: instead of only a super admin directly
-- creating operator accounts (which needs SUPABASE_SERVICE_ROLE_KEY for
-- auth.admin.createUser — see 20260822100000's commit message for why that
-- broke the whole admin panel when Amplify's env var plumbing failed), a
-- prospective operator can now sign up themselves via the public
-- `supabase.auth.signUp()` API (anon key only, no service role) and land
-- in a 'pending' state until a super admin approves them with a group.
--
-- Every existing admins row predates this feature and is a real, already
-- trusted admin, so the new column defaults to 'approved' — nothing loses
-- access.
alter table admins
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected'));

-- Both gates now also require 'approved' — a pending or rejected row must
-- behave exactly like having no admins row at all.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from admins where user_id = auth.uid() and status = 'approved'
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from admins where user_id = auth.uid() and status = 'approved'),
    false
  );
$$;

-- A brand-new signup has no admins row yet, so is_admin() is false and the
-- existing admins_select_admin policy (is_admin()-gated) can't show them
-- their own pending/rejected row — without this, the login page couldn't
-- tell them "your request is pending" vs "wrong password."
create policy "admins_select_self"
  on admins for select
  using (user_id = auth.uid());

-- Lets a freshly-signed-up (not yet any kind of admin) user insert exactly
-- one row for themselves, and only as an unprivileged pending request —
-- they cannot set is_super_admin, pick their own group, or insert a row
-- for anyone else. Approving (assigning a group + status = 'approved') is
-- exclusively a super-admin UPDATE via the existing
-- admins_update_super_admin policy.
create policy "admins_insert_self_pending"
  on admins for insert
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and is_super_admin = false
    and group_id is null
  );
