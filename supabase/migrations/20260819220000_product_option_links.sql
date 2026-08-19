-- Replaces the abstract option-catalog model (option_groups/option_values/
-- product_option_values, added in 20260819210000) with a simpler direct
-- approach: an admin links existing PRODUCT rows to each other as
-- selectable "options." Selecting one on the User detail page swaps the
-- entire page (price/name/images/spec/description) to that product's own
-- values, since each option is a full product, not an abstract value.
--
-- The old tables were shipped without ever holding real (non-test) data,
-- so this drops them outright rather than migrating rows.
drop table if exists product_option_values;
drop table if exists option_values;
drop table if exists option_groups;

-- Directional: product_id "shows" option_product_id as one of its choices.
-- Not automatically symmetric — if B should also list A (and/or C) as
-- options on B's own page, that's a separate row an admin adds explicitly.
create table product_option_links (
  product_id uuid not null references products (id) on delete cascade,
  option_product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, option_product_id),
  check (product_id <> option_product_id)
);

create index product_option_links_product_idx on product_option_links (product_id);
create index product_option_links_option_product_idx on product_option_links (option_product_id);

alter table product_option_links enable row level security;

-- Public: read-only (needed for the product detail page's option
-- switcher). Admins: full write. Same is_admin() gate used throughout.
create policy "product_option_links_select_public"
  on product_option_links for select
  using (true);
create policy "product_option_links_insert_admin"
  on product_option_links for insert
  with check (is_admin());
create policy "product_option_links_delete_admin"
  on product_option_links for delete
  using (is_admin());
