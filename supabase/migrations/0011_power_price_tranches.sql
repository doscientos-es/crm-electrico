-- Replace single power_price_eur with 6 period columns (P1–P6)
alter table public.contracts
  add column if not exists power_price_p1_eur numeric,
  add column if not exists power_price_p2_eur numeric,
  add column if not exists power_price_p3_eur numeric,
  add column if not exists power_price_p4_eur numeric,
  add column if not exists power_price_p5_eur numeric,
  add column if not exists power_price_p6_eur numeric;

-- Migrate existing data: put the old single value into P1
update public.contracts
  set power_price_p1_eur = power_price_eur
  where power_price_eur is not null;

alter table public.contracts
  drop column if exists power_price_eur;
