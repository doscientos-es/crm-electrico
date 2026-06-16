-- Add a separate mailing (correspondence) address to customers.
-- The existing address/city/province/postal_code columns represent the
-- physical supply address; these mailing_* columns let clients receive
-- letters at a different address.
alter table public.customers
  add column if not exists mailing_address text,
  add column if not exists mailing_city text,
  add column if not exists mailing_province text,
  add column if not exists mailing_postal_code text;
