-- Convert the text status introduced by 0003 into the enum consumed by later
-- status migrations. `new` represents customers created before activation.
do $$
begin
  create type public.customer_status as enum (
    'new', 'active', 'renewal_due', 'renewed', 'inactive', 'lost'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.customers alter column status drop default;
alter table public.customers drop constraint if exists customers_status_check;
-- The view is recreated with the enum-compatible predicate in 0018.
drop view if exists public.customers_due_for_renewal;
alter table public.customers
  alter column status type public.customer_status
  using (
    case
      when status::text in ('new', 'active', 'renewal_due', 'renewed', 'inactive', 'lost')
        then status::text
      else 'new'
    end
  )::public.customer_status;
alter table public.customers alter column status set default 'new'::public.customer_status;
