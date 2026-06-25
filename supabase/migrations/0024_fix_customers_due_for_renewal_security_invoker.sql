-- Fix: customers_due_for_renewal view should use SECURITY INVOKER (default for views)
-- so that RLS policies on public.customers are applied for the querying user,
-- not the view owner. Requires PostgreSQL 15+ (supported by Supabase).

create or replace view public.customers_due_for_renewal
  with (security_invoker = true)
as
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
