-- Customer lifecycle derived from contracts:
--
--   new                -> no contracts at all
--   pending_recovery   -> has at least one contract pending recovery
--   active             -> has at least one contract that is NOT cancelled or terminated
--   inactive           -> has contracts but ALL are cancelled or terminated

create or replace function public.sync_customer_status_from_contracts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id            uuid;
  has_pending_recovery boolean;
  has_active           boolean;
  has_any              boolean;
begin
  target_id := coalesce(
    (case when tg_op <> 'DELETE' then new.customer_id else null end),
    old.customer_id
  );

  if target_id is null then
    return coalesce(new, old);
  end if;

  select
    exists(
      select 1 from public.contracts
      where customer_id = target_id
        and status = 'pending_recovery'
    ),
    exists(
      select 1 from public.contracts
      where customer_id = target_id
        and status not in ('cancelled', 'terminated')
    ),
    exists(
      select 1 from public.contracts where customer_id = target_id
    )
  into has_pending_recovery, has_active, has_any;

  update public.customers
  set
    status     = case
                   when has_pending_recovery then 'pending_recovery'::public.customer_status
                   when has_active           then 'active'::public.customer_status
                   when has_any              then 'inactive'::public.customer_status
                   else                           'new'::public.customer_status
                 end,
    updated_at = now()
  where id = target_id;

  return coalesce(new, old);
end;
$$;

do $$
declare
  r                    record;
  has_pending_recovery boolean;
  has_active           boolean;
  has_any              boolean;
begin
  for r in select id from public.customers loop
    select
      exists(
        select 1 from public.contracts
        where customer_id = r.id
          and status = 'pending_recovery'
      ),
      exists(
        select 1 from public.contracts
        where customer_id = r.id
          and status not in ('cancelled', 'terminated')
      ),
      exists(
        select 1 from public.contracts where customer_id = r.id
      )
    into has_pending_recovery, has_active, has_any;

    update public.customers
    set status = case
      when has_pending_recovery then 'pending_recovery'::public.customer_status
      when has_active           then 'active'::public.customer_status
      when has_any              then 'inactive'::public.customer_status
      else                           'new'::public.customer_status
    end
    where id = r.id;
  end loop;
end;
$$;
