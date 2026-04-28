alter table public.customers
  add column if not exists company text,
  add column if not exists dni text,
  add column if not exists status text not null default 'active' check (status in ('active','renewal_due','renewed','inactive','lost')),
  add column if not exists contract_signed_at date,
  add column if not exists renewal_date date,
  add column if not exists renewal_alert_months int not null default 10 check (renewal_alert_months between 1 and 12),
  add column if not exists products_services jsonb not null default '[]'::jsonb,
  add column if not exists assigned_to uuid references public.profiles(id),
  add column if not exists last_contact_at timestamptz;

update public.customers
set
  company = coalesce(company, legal_name, name),
  renewal_date = coalesce(
    renewal_date,
    (
      select c.ends_at
      from public.contracts c
      where c.customer_id = customers.id
      order by c.created_at desc
      limit 1
    )
  ),
  contract_signed_at = coalesce(
    contract_signed_at,
    (
      select c.starts_at
      from public.contracts c
      where c.customer_id = customers.id
      order by c.created_at desc
      limit 1
    )
  ),
  assigned_to = coalesce(
    assigned_to,
    (
      select d.assigned_to
      from public.deals d
      where d.customer_id = customers.id and d.assigned_to is not null
      order by d.created_at desc
      limit 1
    ),
    created_by
  )
where true;

create index if not exists customers_status_idx on public.customers (organization_id, status);
create index if not exists customers_renewal_date_idx on public.customers (organization_id, renewal_date);
create index if not exists customers_assigned_to_idx on public.customers (organization_id, assigned_to);

drop policy if exists "customers select own org" on public.customers;
drop policy if exists "customers update permitted roles" on public.customers;

create policy "customers select assigned_or_admin" on public.customers
for select
using (
  organization_id = public.current_org_id()
  and (
    public.has_role(array['owner','admin']::app_role[])
    or assigned_to = auth.uid()
  )
);

create policy "customers update assigned_or_admin" on public.customers
for update
using (
  organization_id = public.current_org_id()
  and (
    public.has_role(array['owner','admin']::app_role[])
    or assigned_to = auth.uid()
  )
)
with check (organization_id = public.current_org_id());

create or replace view public.customers_due_for_renewal as
select
  c.id,
  c.organization_id,
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
  and c.status in ('active','renewal_due','renewed')
  and (coalesce(c.contract_signed_at, c.renewal_date) + make_interval(months => c.renewal_alert_months))::date <= current_date;
