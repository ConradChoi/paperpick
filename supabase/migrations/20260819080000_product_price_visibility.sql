-- Per-product toggle to hide the price on the public storefront (User side
-- shows "가격문의"/"Contact for price" instead) while Admin still requires
-- and displays the actual price for internal reference.
alter table products
  add column if not exists price_visible boolean not null default true;
