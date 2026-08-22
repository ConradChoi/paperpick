-- Operator accounts + group-based menu permissions, layered on top of the
-- existing admins/is_admin() gate.
--
-- Model:
--   admins.is_super_admin — the original, unrestricted admin type. Every
--     existing admins row predates this feature (created directly via SQL
--     by the site owner), so all of them are backfilled to true below —
--     nothing loses access.
--   operator_groups — a named permission template (e.g. "상품 담당자").
--   operator_group_permissions — per-group, per-menu CRUD flags.
--   admins.group_id — which group a non-super-admin operator belongs to.
--     Super admins ignore this entirely (always full access); an operator
--     with no group (or a group missing a row for a given menu) has no
--     access to that menu at all.
--
-- operator_groups/operator_group_permissions and the write side of
-- `admins` (creating/editing/deleting operators) are managed exclusively
-- by super admins through service-role API routes — regular operators
-- never manage other operators, groups, or permissions, including their
-- own. RLS below enforces the same boundary independently.

-- Must exist before is_super_admin() below — a `language sql` function
-- body is parsed and validated against the schema at CREATE time (unlike
-- plpgsql), so the column has to already be there.
alter table admins add column if not exists is_super_admin boolean not null default false;
update admins set is_super_admin = true;

create function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from admins where user_id = auth.uid()),
    false
  );
$$;

-- Convenience copy of the operator's email, set at creation time — avoids
-- every operator-list read needing a service-role auth.admin lookup per
-- row just to display who's who. Backfilled here from auth.users for the
-- existing super admin(s).
alter table admins add column if not exists email text;
update admins a set email = u.email from auth.users u where u.id = a.user_id and a.email is null;

create table operator_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table admins
  add column if not exists group_id uuid references operator_groups (id) on delete set null;

create table operator_group_permissions (
  group_id uuid not null references operator_groups (id) on delete cascade,
  menu text not null check (menu in ('products', 'inquiries')),
  can_create boolean not null default false,
  can_read boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  primary key (group_id, menu)
);

alter table operator_groups enable row level security;
alter table operator_group_permissions enable row level security;

create policy "operator_groups_all_super_admin"
  on operator_groups for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "operator_group_permissions_all_super_admin"
  on operator_group_permissions for all
  using (is_super_admin())
  with check (is_super_admin());
