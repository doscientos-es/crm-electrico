alter table public.contracts
  add column if not exists terminated_at date;
