-- Historical payment information is unknown; only newly created contracts default to pending.
alter table public.contracts
  add column settlement_status text,
  add column settlement_date date;

alter table public.contracts
  alter column settlement_status set default 'pending',
  add constraint contracts_settlement_status_check
    check (settlement_status is null or settlement_status in ('pending', 'paid')),
  add constraint contracts_paid_settlement_date_check
    check (settlement_status is distinct from 'paid' or settlement_date is not null),
  add constraint contracts_unknown_settlement_date_check
    check (settlement_status is not null or settlement_date is null);

-- A salesperson may manage their contracts, but cannot record or alter payments.
create function public.guard_contract_settlement() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated'
     and coalesce(public.get_my_role()::text, '') not in ('owner', 'admin') then
    if (tg_op = 'INSERT' and (new.settlement_status is distinct from 'pending' or new.settlement_date is not null))
       or (tg_op = 'UPDATE' and (new.settlement_status is distinct from old.settlement_status or new.settlement_date is distinct from old.settlement_date)) then
      raise exception 'Solo los administradores pueden modificar liquidaciones' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_contract_settlement
  before insert or update on public.contracts
  for each row execute function public.guard_contract_settlement();