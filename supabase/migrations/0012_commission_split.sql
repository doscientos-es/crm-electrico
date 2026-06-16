-- Split commission_eur into company and commercial parts
alter table public.contracts
  add column if not exists commission_company_eur numeric not null default 0,
  add column if not exists commission_commercial_eur numeric not null default 0;
