-- Paper Pick — initial schema
-- products, inquiries, admins + RLS policies

-- ============================================================
-- admins: maps a Supabase Auth user to admin access.
-- Membership in this table is what "admin role" means throughout RLS below.
-- ============================================================
create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Helper: is the current request from an admin?
-- SECURITY DEFINER so it can read `admins` without going through that
-- table's own RLS — this matters below, not just for callers elsewhere.
create function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Only admins can see the admins table (including their own row).
--
-- IMPORTANT: this must go through is_admin(), not an inline
-- `exists (select 1 from admins ...)` subquery. A self-referencing subquery
-- inside a table's own RLS policy is a documented Postgres pitfall — when
-- verified against a real logged-in admin, a direct
-- `auth.uid() = user_id or exists (select ... from admins ...)` policy
-- returned zero rows even for the admin's own row, while `is_admin()`
-- (SECURITY DEFINER, so it bypasses RLS on its internal lookup) correctly
-- returned true for the same session. Route every admins-table check
-- through is_admin() to avoid the recursive-RLS trap.
create policy "admins_select_admin"
  on admins for select
  using (is_admin());

-- ============================================================
-- products
-- ============================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name_ko text not null,
  name_en text,
  size text not null check (size in ('A4', 'A3', 'B4', 'B5')),
  weight_gsm int not null check (weight_gsm > 0),
  unit_ko text not null,
  unit_en text,
  price int not null check (price >= 0),
  description_ko text,
  description_en text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'soldout')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_status_idx on products (status);
create index products_brand_idx on products (brand);
create index products_size_idx on products (size);

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

alter table products enable row level security;

-- Public (anon + authenticated): only active products are visible.
create policy "products_select_active_public"
  on products for select
  using (status = 'active');

-- Admins: full read (including soldout) and full write.
create policy "products_select_admin"
  on products for select
  using (is_admin());

create policy "products_insert_admin"
  on products for insert
  with check (is_admin());

create policy "products_update_admin"
  on products for update
  using (is_admin())
  with check (is_admin());

create policy "products_delete_admin"
  on products for delete
  using (is_admin());

-- ============================================================
-- inquiries (문의 / 사전예약 / 뉴스레터)
-- ============================================================
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('general', 'reservation', 'newsletter')),
  name text not null,
  contact text not null,
  message text,
  product_id uuid references products (id) on delete set null,
  locale text not null check (locale in ('ko', 'en')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  consent_at timestamptz not null,
  consent_version text not null,
  created_at timestamptz not null default now()
);

create index inquiries_status_idx on inquiries (status);
create index inquiries_type_idx on inquiries (type);
create index inquiries_created_at_idx on inquiries (created_at);
create index inquiries_product_id_idx on inquiries (product_id);

alter table inquiries enable row level security;

-- Public: insert-only (anon can submit, cannot read anyone's submissions).
create policy "inquiries_insert_public"
  on inquiries for insert
  with check (
    consent_at is not null
    and consent_version is not null
  );

-- Admins: read and update status. No public delete policy —
-- retention/purge (1-year policy) runs via a service-role scheduled job,
-- not through RLS-governed client access.
create policy "inquiries_select_admin"
  on inquiries for select
  using (is_admin());

create policy "inquiries_update_admin"
  on inquiries for update
  using (is_admin())
  with check (is_admin());
