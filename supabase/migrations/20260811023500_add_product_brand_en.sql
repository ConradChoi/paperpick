-- brand had no English counterpart, unlike name/unit/description which are
-- already split into _ko/_en. That left the English site showing Korean
-- brand names (e.g. "더블에이" instead of "Double A"). Rename for
-- consistency with the existing name_ko/name_en pattern, then add the
-- English column.
--
-- Written idempotently: an earlier manual run already added brand_en before
-- the rename was decided, so both statements guard against re-running into
-- "already exists" / "does not exist" errors.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'brand'
  ) then
    alter table products rename column brand to brand_ko;
  end if;
end $$;

alter table products add column if not exists brand_en text;
