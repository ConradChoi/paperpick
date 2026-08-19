-- Product options: Admin-managed option catalog, assignable per product.
--
-- Two kinds (option_groups.type):
--   'display' — informational tag only (e.g. "친환경", "당일발송"), no price
--               effect, shown as a static badge on the User detail page.
--   'variant' — the User picks one value per group on the detail page, and
--               its price_delta is added to the product's base price
--               (e.g. "포장단위: 1박스(+0) / 5박스(+50000)").
--
-- product_option_values is a pure junction table: which of the globally
-- catalogued option_values apply to a given product. Admin manages the
-- catalog once (option_groups/option_values) and then just checks which
-- values apply per product, rather than re-entering options per product.
create table option_groups (
  id uuid primary key default gen_random_uuid(),
  name_ko text not null,
  name_en text,
  type text not null check (type in ('display', 'variant')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table option_values (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references option_groups (id) on delete cascade,
  value_ko text not null,
  value_en text,
  -- Only meaningful for 'variant' groups; stays 0 (no-op) for 'display'.
  price_delta int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index option_values_group_idx on option_values (option_group_id);

create table product_option_values (
  product_id uuid not null references products (id) on delete cascade,
  option_value_id uuid not null references option_values (id) on delete cascade,
  primary key (product_id, option_value_id)
);

create index product_option_values_product_idx on product_option_values (product_id);
create index product_option_values_value_idx on product_option_values (option_value_id);

alter table option_groups enable row level security;
alter table option_values enable row level security;
alter table product_option_values enable row level security;

-- Public: read-only (needed for the product detail page + list filters).
-- Admins: full write. Same is_admin() gate used throughout (see
-- 20260810135928_init_schema.sql for why it must go through is_admin()
-- rather than an inline admins lookup).
create policy "option_groups_select_public"
  on option_groups for select
  using (true);
create policy "option_groups_insert_admin"
  on option_groups for insert
  with check (is_admin());
create policy "option_groups_update_admin"
  on option_groups for update
  using (is_admin())
  with check (is_admin());
create policy "option_groups_delete_admin"
  on option_groups for delete
  using (is_admin());

create policy "option_values_select_public"
  on option_values for select
  using (true);
create policy "option_values_insert_admin"
  on option_values for insert
  with check (is_admin());
create policy "option_values_update_admin"
  on option_values for update
  using (is_admin())
  with check (is_admin());
create policy "option_values_delete_admin"
  on option_values for delete
  using (is_admin());

create policy "product_option_values_select_public"
  on product_option_values for select
  using (true);
create policy "product_option_values_insert_admin"
  on product_option_values for insert
  with check (is_admin());
create policy "product_option_values_delete_admin"
  on product_option_values for delete
  using (is_admin());
