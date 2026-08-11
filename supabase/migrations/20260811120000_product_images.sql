-- Product images: Storage bucket + `products.additional_image_urls` column.
--
-- Storage layout: objects live at the bucket root as `{uuid}.{ext}`
-- (e.g. `product-images/3f9c1b2a-....jpg`), where `{uuid}` is generated
-- server-side per upload (see POST /api/admin/upload) and is independent of
-- any `products.id` — this lets an admin upload images before a product
-- row exists (new-product form flow). Public read is required since product
-- images are shown on the public storefront; writes are admin-only via
-- `is_admin()`, the same helper already used for the `products` table RLS
-- (see 20260810135928_init_schema.sql for why is_admin() rather than an
-- inline admins lookup).

-- ============================================================
-- storage bucket
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB, mirrors the server-side re-validation in POST /api/admin/upload
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public: anyone can read (view) objects in this bucket.
-- drop-then-create (Postgres has no CREATE POLICY IF NOT EXISTS) so this
-- migration can be re-run safely, matching the idempotency of the bucket
-- upsert above.
drop policy if exists "product_images_select_public" on storage.objects;
create policy "product_images_select_public"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admins: full write access, gated by the same is_admin() used elsewhere.
drop policy if exists "product_images_insert_admin" on storage.objects;
create policy "product_images_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "product_images_update_admin" on storage.objects;
create policy "product_images_update_admin"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "product_images_delete_admin" on storage.objects;
create policy "product_images_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ============================================================
-- products.additional_image_urls
-- ============================================================
-- Up to 4 additional images, in display order. `image_url` (existing column)
-- remains the single required-at-the-API-level primary image. No NOT NULL /
-- length constraint at the DB level — "required" and "max 4" are enforced by
-- the API's zod schema, not here, so this migration can't break on existing
-- rows.
alter table products
  add column if not exists additional_image_urls text[] not null default '{}';
