-- Migration: simplify customer_status and derive it from contracts
--
-- New lifecycle:
--   new      → customer exists but has NO contracts
--   active   → customer has at least one contract with status = 'active'
--   inactive → customer has contracts but none is active
--
-- Removed: renewal_due, renewed (contract-level concerns), lost

-- ── 1. Recreate enum without renewal_due / renewed / lost ─────────────────────
create type customer_status_v2 as enum ('new', 'active', 'inactive');

-- Migrate existing values before changing the column type
update public.customers
set status = case
  when status::text in ('active', 'renewal_due', 'renewed') then 'active'
  when status::text in ('inactive', 'lost')                 then 'inactive'
  else 'new'
end::public.customer_status;

alter table public.customers alter column status drop default;
alter table public.customers
  alter column status type customer_status_v2
  using status::text::customer_status_v2;

alter table public.customers
  alter column status set default 'new'::customer_status_v2;

drop type public.customer_status;
alter type customer_status_v2 rename to customer_status;

-- ── 2. Update customers_due_for_renewal view (referenced old statuses) ─────────
create or replace view public.customers_due_for_renewal as
select
  c.id,
  c.name,
  c.company,
  c.status,
  c.assigned_to,
  c.contract_signed_at,
  c.renewal_date,
  c.renewal_alert_months,
  c.products_services,
  (coalesce(c.contract_signed_at, c.renewal_date) + make_interval(months => c.renewal_alert_months))::date as alert_from,
  (c.renewal_date - current_date) as days_to_renewal
from public.customers c
where c.renewal_date is not null
  and c.status = 'active'
  and (coalesce(c.contract_signed_at, c.renewal_date) + make_interval(months => c.renewal_alert_months))::date <= current_date;

-- ── 3. Trigger function: derive customer status from contracts ─────────────────
create or replace function public.sync_customer_status_from_contracts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id    uuid;
  has_active   boolean;
  has_any      boolean;
begin
  target_id := coalesce(
    (case when tg_op <> 'DELETE' then new.customer_id else null end),
    old.customer_id
  );

  if target_id is null then
    return coalesce(new, old);
  end if;

  select
    exists(select 1 from public.contracts where customer_id = target_id and status = 'active'),
    exists(select 1 from public.contracts where customer_id = target_id)
  into has_active, has_any;

  update public.customers
  set
    status     = case
                   when has_active then 'active'::public.customer_status
                   when has_any    then 'inactive'::public.customer_status
                   else                 'new'::public.customer_status
                 end,
    updated_at = now()
  where id = target_id;

  return coalesce(new, old);
end;
$$;

-- ── 4. Attach trigger on contracts ────────────────────────────────────────────
drop trigger if exists trg_sync_customer_status on public.contracts;
create trigger trg_sync_customer_status
  after insert or update of status or delete
  on public.contracts
  for each row
  execute function public.sync_customer_status_from_contracts();

-- ── 5. Back-fill all existing customers to match current contract state ────────
do $$
declare
  r record;
  has_active boolean;
  has_any    boolean;
begin
  for r in select id from public.customers loop
    select
      exists(select 1 from public.contracts where customer_id = r.id and status = 'active'),
      exists(select 1 from public.contracts where customer_id = r.id)
    into has_active, has_any;

    update public.customers
    set status = case
      when has_active then 'active'::public.customer_status
      when has_any    then 'inactive'::public.customer_status
      else                 'new'::public.customer_status
    end
    where id = r.id;
  end loop;
end;
$$;
