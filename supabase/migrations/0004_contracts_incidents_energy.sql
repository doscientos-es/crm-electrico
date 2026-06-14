do $$ begin
  create type contract_status_v2 as enum (
    'PENDING_PROCESSING',
    'PROCESSING',
    'PENDING_SIGNATURE',
    'ACTIVE',
    'CANCELLED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type customer_type_v2 as enum ('RESIDENTIAL', 'SME');
exception when duplicate_object then null;
end $$;

alter table public.customers alter column type drop default;
alter table public.customers
  alter column type type customer_type_v2
  using (
    case type::text
      when 'residential' then 'RESIDENTIAL'
      else 'SME'
    end
  )::customer_type_v2;
alter table public.customers alter column type set default 'SME';

do $$
begin
  if exists (select 1 from pg_type where typname = 'customer_type') then
    drop type customer_type;
  end if;
  alter type customer_type_v2 rename to customer_type;
exception when duplicate_object then null;
end $$;

alter table public.contracts alter column status drop default;
alter table public.contracts
  alter column status type contract_status_v2
  using (
    case status::text
      when 'draft' then 'PENDING_PROCESSING'
      when 'sent' then 'PENDING_SIGNATURE'
      when 'signed' then 'ACTIVE'
      when 'cancelled' then 'CANCELLED'
      else status::text
    end
  )::contract_status_v2;
alter table public.contracts alter column status set default 'PENDING_PROCESSING';

do $$
begin
  if exists (select 1 from pg_type where typname = 'contract_status') then
    drop type contract_status;
  end if;
  alter type contract_status_v2 rename to contract_status;
exception when duplicate_object then null;
end $$;

do $$ begin
  create type incident_status as enum ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type incident_priority as enum ('LOW','MEDIUM','HIGH','URGENT');
exception when duplicate_object then null;
end $$;

alter table public.customers
  add column if not exists energy_data jsonb;

alter table public.contracts
  add column if not exists commission_eur numeric(12,2) not null default 0,
  add column if not exists energy_data jsonb;

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  status incident_status not null default 'OPEN',
  priority incident_priority not null default 'MEDIUM',
  customer_id uuid not null references public.customers(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  internal_notes text not null default '',
  resolved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_org_status_idx on public.incidents (organization_id, status);
create index if not exists incidents_org_priority_idx on public.incidents (organization_id, priority);
create index if not exists incidents_customer_idx on public.incidents (customer_id);
create index if not exists incidents_contract_idx on public.incidents (contract_id);
create index if not exists contracts_org_status_idx on public.contracts (organization_id, status);

drop trigger if exists set_incidents_updated_at on public.incidents;
create trigger set_incidents_updated_at
before update on public.incidents
for each row execute function public.set_updated_at();

alter table public.incidents enable row level security;

create policy "incidents select own org" on public.incidents
for select using (organization_id = public.current_org_id());

create policy "incidents insert permitted roles" on public.incidents
for insert with check (
  organization_id = public.current_org_id()
  and public.has_role(array['owner','admin','sales','technician']::app_role[])
);

create policy "incidents update permitted roles" on public.incidents
for update using (
  organization_id = public.current_org_id()
  and (
    public.has_role(array['owner','admin','sales']::app_role[])
    or assigned_to = auth.uid()
  )
)
with check (organization_id = public.current_org_id());

create policy "incidents delete owner admin only" on public.incidents
for delete using (
  organization_id = public.current_org_id()
  and public.has_role(array['owner','admin']::app_role[])
);
