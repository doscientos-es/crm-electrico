-- Add IBAN / bank account field to customers
alter table public.customers
  add column if not exists iban text;
